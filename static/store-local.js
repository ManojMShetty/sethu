// store-local.js
// The other backend. No server, no network, no Python. Everything lives
// in this browser's localStorage.
//
// This file is a deliberate LINE-BY-LINE MIRROR of the handlers in
// server.py. Keep the order of the functions the same as the order there,
// so any drift between the two shows up in a diff instead of on stage.
//
// Why it exists: if server.py dies during the jury demo, you reload and
// keep talking. That is the whole reason. It is insurance, not a feature.

// Mirrors DEADLINES and DUP_RADIUS_M in server.py. In server mode the
// server sends its own copy and app.js prefers that, so these two can
// never silently disagree about a live report.
var RULES = {
  deadlines: { power: 12, water: 24, bus: 24, bore: 24, waste: 24,
               toilet: 48, drain: 48, light: 72, road: 168 },
  radius:    { power: 25, water: 25, bore: 25, toilet: 25, light: 25,
               bus: 40, waste: 60, drain: 60, road: 60 }
};

var LEVELS = ["Gram Panchayat", "Taluk Panchayat", "Zilla Panchayat"];

var LocalApi = {

  name: "local",

  // ------------------------------------------------------------ storage

  read: function () {
    try {
      var raw = localStorage.getItem("sethu.db");
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupt or blocked - start clean */ }
    return { reports: [], history: [], voices: [], offset: 0 };
  },

  write: function (db) {
    try {
      localStorage.setItem("sethu.db", JSON.stringify(db));
    } catch (e) {
      // Quota is about 5 MB and base64 photos fill it fast. Drop the
      // oldest photos rather than losing the ledger itself.
      for (var i = db.reports.length - 1; i >= 0; i--) {
        if (db.reports[i].photo || db.reports[i].fix_photo) {
          db.reports[i].photo = null;
          db.reports[i].fix_photo = null;
          try {
            localStorage.setItem("sethu.db", JSON.stringify(db));
            return;
          } catch (again) { /* keep dropping */ }
        }
      }
    }
  },

  now: function (db) { return Date.now() + (db.offset || 0); },

  find: function (db, id) {
    for (var i = 0; i < db.reports.length; i++) {
      if (db.reports[i].id === id) return db.reports[i];
    }
    return null;
  },

  log: function (db, id, message, at) {
    db.history.push({ report_id: id, message: message, at: at });
  },

  fail: function (status, error) {
    return { ok: false, status: status, error: error };
  },

  // ---------------------------------------------------------- the rules

  distance: function (lat1, lng1, lat2, lng2) {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
      return Infinity;
    }
    var north = (lat2 - lat1) * 111000;
    var east = (lng2 - lng1) * 111000 * Math.cos(lat1 * Math.PI / 180);
    return Math.sqrt(north * north + east * east);
  },

  levelFor: function (report, at) {
    if (report.status === "resolved") return 0;
    var hours = (at - report.deadline_from) / 3600000;
    var deadline = RULES.deadlines[report.category] || 72;
    if (hours > deadline * 2) return 2;
    if (hours > deadline) return 1;
    return 0;
  },

  // ------------------------------------------------------------ reading

  async listReports() {
    var db = this.read();
    var at = this.now(db);
    var self = this;

    // Escalation is computed, but the MOMENT it happens is written, so a
    // red bar always has a matching line in its own timeline.
    db.reports.forEach(function (report) {
      var level = self.levelFor(report, at);
      if (level > (report.escalated || 0)) {
        report.escalated = level;
        self.log(db, report.id, "Deadline passed. Escalated to " +
                 LEVELS[level] + " automatically. No officer approved this.",
                 at);
      }
    });
    this.write(db);

    var reports = db.reports.map(function (report) {
      var copy = {};
      for (var key in report) {
        if (key !== "photo" && key !== "fix_photo") copy[key] = report[key];
      }
      copy.has_photo = !!report.photo;
      copy.has_fix_photo = !!report.fix_photo;
      copy.deadline = RULES.deadlines[report.category] || 72;
      copy.level = self.levelFor(report, at);
      copy.voices = db.voices.filter(function (v) {
        return v.report_id === report.id;
      }).length;
      copy.history = db.history.filter(function (h) {
        return h.report_id === report.id;
      }).sort(function (a, b) { return a.at - b.at; });
      return copy;
    }).sort(function (a, b) { return b.created_at - a.created_at; });

    return { now: at, rules: RULES, reports: reports };
  },

  async getPhoto(id, kind) {
    var report = this.find(this.read(), id);
    if (!report) return null;
    return kind === "fix" ? report.fix_photo : report.photo;
  },

  // ------------------------------------------------------------ writing

  async addReport(data) {
    if (!RULES.deadlines[data.category]) {
      return this.fail(400, "pick what is broken first");
    }
    var db = this.read();
    var at = this.now(db);

    if (!data.force) {
      var radius = RULES.radius[data.category] || 40;
      for (var i = 0; i < db.reports.length; i++) {
        var other = db.reports[i];
        if (other.category === data.category && other.status !== "resolved" &&
            this.distance(data.lat, data.lng, other.lat, other.lng) < radius) {
          return { ok: true, status: 200, duplicate: true,
                   id: other.id, metres: radius };
        }
      }
    }

    var seq = db.reports.length + 1;
    var id = "VYS-" + String(seq).padStart(4, "0");

    db.reports.push({
      seq: seq, id: id, category: data.category, note: data.note || "",
      photo: data.photo || null, fix_photo: null,
      lat: data.lat, lng: data.lng, place: data.place || null,
      status: "open", created_at: at, deadline_from: at,
      reporter_hash: data.token, worker: null, reopened: 0, escalated: 0
    });
    db.voices.push({ report_id: id, voter_hash: data.token, at: at });
    this.log(db, id, "Reported by a resident", at);
    this.write(db);
    return { ok: true, status: 200, duplicate: false, id: id };
  },

  async addVoice(id, token) {
    var db = this.read();
    var report = this.find(db, id);
    if (!report) return this.fail(404, "no such report");
    var already = db.voices.some(function (v) {
      return v.report_id === id && v.voter_hash === token;
    });
    if (already) return this.fail(409, "you have already reported this one");

    var at = this.now(db);
    db.voices.push({ report_id: id, voter_hash: token, at: at });
    this.log(db, id, "Another resident reported the same problem", at);
    this.write(db);
    return { ok: true, status: 200 };
  },

  async assign(id, worker) {
    if (!worker || !worker.trim()) {
      return this.fail(400, "who is taking this job?");
    }
    var db = this.read();
    var report = this.find(db, id);
    if (!report) return this.fail(404, "no such report");
    if (report.status !== "open") return this.fail(409, "that job is not open");

    report.status = "assigned";
    report.worker = worker;
    this.log(db, id, "Assigned to " + worker, this.now(db));
    this.write(db);
    return { ok: true, status: 200 };
  },

  async markRepaired(id, photo) {
    // Staff can only CLAIM a repair. There is no branch in this function
    // that writes 'resolved', exactly as in server.py.
    if (!photo) return this.fail(400, "a repair claim needs photo proof");
    var db = this.read();
    var report = this.find(db, id);
    if (!report) return this.fail(404, "no such report");
    if (report.status !== "assigned") {
      return this.fail(409, "that job is not assigned to anyone");
    }
    report.status = "awaiting";
    report.fix_photo = photo;
    this.log(db, id, "Staff submitted repair proof. Waiting for the " +
             "resident who reported it.", this.now(db));
    this.write(db);
    return { ok: true, status: 200 };
  },

  async confirmFix(id, works, token) {
    var db = this.read();
    var report = this.find(db, id);
    if (!report) return this.fail(404, "no such report");
    if (report.status !== "awaiting") {
      return this.fail(409, "nothing has been claimed as repaired yet");
    }
    if (report.reporter_hash !== token) {
      return this.fail(403, "only the resident who reported this can close it");
    }

    var at = this.now(db);
    if (works === true) {
      report.status = "resolved";
      this.log(db, id, "Resident confirmed the repair. Report closed.", at);
    } else {
      // created_at is never rewritten. Only the current deadline restarts.
      report.status = "open";
      report.deadline_from = at;
      report.fix_photo = null;
      report.worker = null;
      report.escalated = 0;
      report.reopened = (report.reopened || 0) + 1;
      this.log(db, id, "Resident says it is still broken. Reopened, and " +
               "the clock restarted.", at);
    }
    this.write(db);
    return { ok: true, status: 200 };
  },

  async shiftClock(body) {
    var db = this.read();
    db.offset = body.reset ? 0
              : (db.offset || 0) + Number(body.hours || 24) * 3600000;
    this.write(db);
    return { ok: true, status: 200, now: this.now(db) };
  },

  async reset() {
    localStorage.removeItem("sethu.db");
    return { ok: true, status: 200 };
  }
};
