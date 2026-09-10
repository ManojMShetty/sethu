# server.py
# Sethu - report and track broken public assets.
# LEAP Product Innovation Hackathon, Mysuru. Problem statement 1D.
#
# Standard library only. HAWCC wipes installed packages between logins
# (platform guide, section 5), so there is nothing here to reinstall.

import http.server
import socketserver
import sqlite3
import hashlib
import json
import math
import time
import os
from contextlib import closing
from urllib.parse import urlparse, parse_qs

PORT = 8000
DB_FILE = "sethu.db"

# Hours the Panchayat gets before a report escalates itself.
# A live wire is not a pothole. Be ready to defend every number.
#
# These are not numbers we invented. The Model Panchayat Citizens Charter
# (Ministry of Panchayati Raj + NIRDPR, June 2021) sets service norms for
# exactly these repairs, and Karnataka adopted a charter in 5,820 of its
# 5,953 Gram Panchayats. Its illustrative standard for a street light
# complaint is two working days. The charter is advisory and invisible;
# all this app does is make the promise the Panchayat already signed up to
# visible, and count it. If a GP publishes different numbers, edit this
# dict and the whole app follows.
DEADLINES = {
    "power": 12, "water": 24, "bus": 24, "bore": 24, "waste": 24,
    "toilet": 48, "drain": 48, "light": 72, "road": 168,
}

# How close two reports must be to count as the same problem.
# Point assets are one object; area assets span a stretch.
# A flat 60m silently swallows the NEXT streetlight.
DUP_RADIUS_M = {
    "power": 25, "water": 25, "bore": 25, "toilet": 25, "light": 25,
    "bus": 40, "waste": 60, "drain": 60, "road": 60,
}

MAX_BODY = 2_000_000          # 2 MB. A shrunk photo is ~50 KB.
LEVELS = ["Gram Panchayat", "Taluk Panchayat", "Zilla Panchayat"]

# The officer behind each level. Karnataka has not held Taluk or Zilla
# Panchayat elections since 2020-21, so levels 1 and 2 are appointed
# officers, not elected councils. Say that on stage before a judge says it.
LEVEL_OFFICER = ["Panchayat Development Officer",
                 "Taluk Panchayat Executive Officer",
                 "Zilla Panchayat Chief Executive Officer"]

# ------------------------------------------------------- who owns what
#
# Half of "why was this never fixed" is that the complaint reached a body
# that was never responsible for it. A dark pole is the clearest case: the
# bulb and fitting are the Gram Panchayat's own obligatory duty, but the
# line, the pole feed and the transformer belong to the ESCOM. One dark
# pole, two owners, and a resident who cannot be expected to know which.
#
# So the app routes. Every category starts with a default owner, and staff
# can hand a report to the right body WITHOUT closing it (see reroute).
BODIES = {
    "gp":    {"name": "Gram Panchayat",
              "officer": "Panchayat Development Officer",
              "reach": "Panchayat office"},
    "escom": {"name": "CESC Mysuru",
              "officer": "Section Officer",
              "reach": "1912"},
    "rdwsd": {"name": "Rural Drinking Water & Sanitation Dept",
              "officer": "Assistant Executive Engineer",
              "reach": "Taluk office"},
    "pred":  {"name": "Panchayat Raj Engineering Division",
              "officer": "Assistant Executive Engineer",
              "reach": "Zilla Panchayat"},
    "pwd":   {"name": "Public Works Department",
              "officer": "Assistant Engineer",
              "reach": "Taluk office"},
    "edu":   {"name": "Education Department",
              "officer": "Block Education Officer",
              "reach": "BEO office"},
    "ksrtc": {"name": "KSRTC",
              "officer": "Depot Manager",
              "reach": "Depot"},
}

# Where a report starts. Not where it must end: a dry tap on a single
# village scheme is the GP's, the same tap on a multi village scheme is
# the department's, and only a human can tell those apart on site.
OWNERS = {
    "power": "escom", "light": "gp", "water": "gp", "bore": "gp",
    "waste": "gp", "toilet": "gp", "drain": "gp", "road": "gp",
    "bus": "ksrtc",
}

# A school toilet is not a Gram Panchayat asset. The education department
# funds school toilet upkeep separately, so a toilet or water report
# tagged to a school or anganwadi is routed there instead.
SCHOOL_OWNER = {"toilet": "edu", "water": "edu", "bore": "edu"}

PLACE_KINDS = {"school": "Government school",
               "anganwadi": "Anganwadi centre"}

# ------------------------------------------------- the reasons an official may give
#
# The whole point of this list is that it is a LIST. A free text box turns
# into an excuse field within a week and cannot be counted. A fixed set of
# codes can be counted, and "no funds, filed 30 times this quarter" is a
# budget argument with a number attached rather than a complaint.
REASONS = {
    "no_funds":          "No funds until the Gram Sabha approves this work",
    "not_our_asset":     "This asset belongs to another department",
    "awaiting_material": "Waiting for material or a spare part",
    "work_ordered":      "Work order issued, contractor scheduled",
    "no_staff":          "No staff available for this trade",
    "needs_sanction":    "Needs technical sanction above the Panchayat's limit",
}


# ---------------------------------------------------------------- database

def get_db():
    conn = sqlite3.connect(DB_FILE, timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")   # readers don't block on a write
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def setup_db():
    with closing(get_db()) as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS reports (
                seq            INTEGER PRIMARY KEY AUTOINCREMENT,
                id             TEXT    UNIQUE NOT NULL,
                category       TEXT    NOT NULL,
                note           TEXT    NOT NULL DEFAULT '',
                photo          TEXT,
                fix_photo      TEXT,
                lat            REAL,
                lng            REAL,
                place          TEXT,
                status         TEXT    NOT NULL DEFAULT 'open',
                created_at     INTEGER NOT NULL,
                deadline_from  INTEGER NOT NULL,
                reporter_hash  TEXT    NOT NULL,
                worker         TEXT,
                reopened       INTEGER NOT NULL DEFAULT 0,
                escalated      INTEGER NOT NULL DEFAULT 0,
                owner_body     TEXT    NOT NULL DEFAULT 'gp',
                place_kind     TEXT
            );
            CREATE TABLE IF NOT EXISTS voices (
                report_id  TEXT    NOT NULL,
                voter_hash TEXT    NOT NULL,
                at         INTEGER NOT NULL,
                UNIQUE (report_id, voter_hash)
            );
            CREATE TABLE IF NOT EXISTS history (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id TEXT    NOT NULL,
                message   TEXT    NOT NULL,
                at        INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS meta (
                key   TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            -- Public explanations. Note what is NOT here: any column that
            -- could move a deadline. A reason is a thing the Panchayat
            -- says, never a thing that buys it time.
            CREATE TABLE IF NOT EXISTS reasons (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id TEXT    NOT NULL,
                code      TEXT    NOT NULL,
                detail    TEXT    NOT NULL DEFAULT '',
                body      TEXT    NOT NULL,
                cycle     INTEGER NOT NULL DEFAULT 0,
                at        INTEGER NOT NULL
            );
        """)
        conn.commit()


# ------------------------------------------------------------------- clock

def clock_offset(conn):
    row = conn.execute(
        "SELECT value FROM meta WHERE key = 'clock_offset_ms'").fetchone()
    return int(row["value"]) if row else 0


def now(conn):
    # Milliseconds, so it matches what JavaScript gives us.
    # The offset is the demo time machine. It lives on the SERVER so every
    # window and every phone moves together when you press +24h on stage.
    return int(time.time() * 1000) + clock_offset(conn)


def set_offset(conn, ms):
    conn.execute(
        "INSERT INTO meta (key, value) VALUES ('clock_offset_ms', ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value", (str(ms),))


# ------------------------------------------------------------------ helpers

def token_hash(token):
    # We never store the device token, only its hash. If the database
    # leaks, nobody can close anyone's report with it.
    return hashlib.sha256(str(token or "").encode()).hexdigest()


def add_history(conn, report_id, message, at):
    conn.execute(
        "INSERT INTO history (report_id, message, at) VALUES (?, ?, ?)",
        (report_id, message, at))


def distance_m(lat1, lng1, lat2, lng2):
    # Flat-earth approximation. Accurate well under a kilometre, which is
    # all we need to tell two reports of one streetlight apart.
    if None in (lat1, lng1, lat2, lng2):
        return float("inf")
    north = (lat2 - lat1) * 111_000
    east = (lng2 - lng1) * 111_000 * math.cos(math.radians(lat1))
    return math.sqrt(north * north + east * east)


def level_for(report, at):
    """Escalation is DERIVED from elapsed time. There is no approval field
    in the schema, so nobody can approve it. That is the whole point."""
    if report["status"] == "resolved":
        return 0
    hours = (at - report["deadline_from"]) / 3_600_000.0
    deadline = DEADLINES.get(report["category"], 72)
    if hours > deadline * 2:
        return 2
    if hours > deadline:
        return 1
    return 0


def owner_for(category, place_kind):
    """Route by what is broken AND where it stands. The same broken toilet
    is the Panchayat's problem beside the bus stop and the education
    department's problem inside a school compound."""
    if place_kind in PLACE_KINDS and category in SCHOOL_OWNER:
        return SCHOOL_OWNER[category]
    return OWNERS.get(category, "gp")


def reasons_for(conn, report_id):
    rows = conn.execute(
        "SELECT code, detail, body, cycle, at FROM reasons "
        "WHERE report_id = ? ORDER BY at, id", (report_id,)).fetchall()
    out = []
    for row in rows:
        reason = dict(row)
        reason["label"] = REASONS.get(reason["code"], reason["code"])
        out.append(reason)
    return out


def is_silent(report, reasons, at):
    """Past its deadline, and nobody has explained why in THIS round.

    Silence is a status in this app, not an absence of one. A report
    nobody will explain reads worse on the ledger than a report with an
    inconvenient explanation, which is the incentive we want.

    'This round' is the reopened count, not a timestamp. Each rejection by
    the resident starts a new round, and an excuse given before the last
    rejection does not cover the delay after it. Counting rounds rather
    than comparing clocks also means the demo time machine cannot
    accidentally make an old excuse look current."""
    if report["status"] == "resolved":
        return False
    if level_for(report, at) == 0:
        return False
    return not any(r["cycle"] == report["reopened"] for r in reasons)


def record_escalations(conn, at):
    """Escalation is computed, but the moment it happens is WRITTEN.
    Otherwise the ledger shows a red bar with nothing in its timeline to
    explain it, and a judge will ask exactly that."""
    rows = conn.execute(
        "SELECT * FROM reports WHERE status != 'resolved'").fetchall()
    for row in rows:
        level = level_for(row, at)
        if level > row["escalated"]:
            conn.execute("UPDATE reports SET escalated = ? WHERE id = ?",
                         (level, row["id"]))
            add_history(conn, row["id"],
                        "Deadline passed. Escalated to " + LEVELS[level] +
                        " automatically. No officer approved this.", at)
    conn.commit()


# ------------------------------------------------------------------ reading

def load_reports():
    with closing(get_db()) as conn:
        at = now(conn)
        record_escalations(conn, at)

        rows = conn.execute(
            "SELECT * FROM reports ORDER BY created_at DESC").fetchall()
        out = []
        for row in rows:
            r = dict(row)
            # Photos NEVER travel in the list payload. They are fetched one
            # at a time from /api/photo. This is what makes polling safe on
            # the weak signal we compress photos for in the first place.
            r["has_photo"] = bool(r.pop("photo", None))
            r["has_fix_photo"] = bool(r.pop("fix_photo", None))
            r["deadline"] = DEADLINES.get(r["category"], 72)
            r["level"] = level_for(row, at)
            r["voices"] = conn.execute(
                "SELECT COUNT(*) AS n FROM voices WHERE report_id = ?",
                (r["id"],)).fetchone()["n"]
            r["history"] = [dict(h) for h in conn.execute(
                "SELECT message, at FROM history WHERE report_id = ? "
                "ORDER BY at, id", (r["id"],)).fetchall()]
            r["reasons"] = reasons_for(conn, r["id"])
            r["silent"] = is_silent(row, r["reasons"], at)
            r["owner"] = BODIES.get(r["owner_body"], BODIES["gp"])["name"]
            out.append(r)
        # Ship the rules with the data. The browser has its own copy for
        # local mode; sending ours means the two can never silently
        # disagree about a live report's deadline.
        return {"now": at,
                "rules": {"deadlines": DEADLINES, "radius": DUP_RADIUS_M,
                          "owners": OWNERS, "bodies": BODIES,
                          "reasons": REASONS, "places": PLACE_KINDS,
                          "officers": LEVEL_OFFICER},
                "reports": out}


def load_photo(report_id, kind):
    column = "fix_photo" if kind == "fix" else "photo"
    with closing(get_db()) as conn:
        row = conn.execute(
            "SELECT " + column + " AS p FROM reports WHERE id = ?",
            (report_id,)).fetchone()
    if row is None:
        return None
    return row["p"]


# ------------------------------------------------------------------ writing

def add_report(data):
    category = data.get("category")
    if category not in DEADLINES:
        return 400, {"error": "pick what is broken first"}
    token = data.get("token")
    if not token:
        return 400, {"error": "missing device token"}

    lat, lng = data.get("lat"), data.get("lng")
    with closing(get_db()) as conn:
        # Read the number and write the row under ONE write lock. Without
        # BEGIN IMMEDIATE two phones sending at the same moment both read
        # the same MAX(seq) and the second INSERT dies on the UNIQUE.
        # SQLite makes the loser wait for the lock instead (timeout=5).
        conn.isolation_level = None
        conn.execute("BEGIN IMMEDIATE")
        try:
            at = now(conn)

            # Twelve people reporting one dead pole should be one report
            # carrying twelve voices, not twelve reports that each look
            # ignorable. Unless the reporter says otherwise.
            if not data.get("force"):
                radius = DUP_RADIUS_M.get(category, 40)
                for row in conn.execute(
                        "SELECT * FROM reports WHERE category = ? "
                        "AND status != 'resolved'", (category,)).fetchall():
                    if distance_m(lat, lng, row["lat"], row["lng"]) < radius:
                        conn.execute("ROLLBACK")
                        return 200, {"duplicate": True, "id": row["id"],
                                     "metres": radius}

            cur = conn.execute(
                "SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM reports")
            report_id = "VYS-" + str(cur.fetchone()["n"]).zfill(4)

            place_kind = data.get("place_kind")
            if place_kind not in PLACE_KINDS:
                place_kind = None

            conn.execute("""
                INSERT INTO reports
                  (id, category, note, photo, lat, lng, place, status,
                   created_at, deadline_from, reporter_hash,
                   owner_body, place_kind)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)
            """, (report_id, category, data.get("note", ""),
                  data.get("photo"), lat, lng, data.get("place"),
                  at, at, token_hash(token),
                  owner_for(category, place_kind), place_kind))

            # The reporter is the first voice. Everything counts one way.
            conn.execute("INSERT INTO voices (report_id, voter_hash, at) "
                         "VALUES (?, ?, ?)",
                         (report_id, token_hash(token), at))
            add_history(conn, report_id, "Reported by a resident", at)
            conn.execute("COMMIT")
        except Exception:
            conn.execute("ROLLBACK")
            raise

    print("New report:", report_id, category)
    return 200, {"duplicate": False, "id": report_id}


def add_voice(data):
    with closing(get_db()) as conn:
        at = now(conn)
        row = conn.execute("SELECT id FROM reports WHERE id = ?",
                           (data.get("id"),)).fetchone()
        if row is None:
            return 404, {"error": "no such report"}
        try:
            conn.execute(
                "INSERT INTO voices (report_id, voter_hash, at) "
                "VALUES (?, ?, ?)",
                (row["id"], token_hash(data.get("token")), at))
        except sqlite3.IntegrityError:
            # One device, one voice. This is why the count means something.
            return 409, {"error": "you have already reported this one"}
        add_history(conn, row["id"],
                    "Another resident reported the same problem", at)
        conn.commit()
    return 200, {"ok": True}


def assign_report(data):
    worker = (data.get("worker") or "").strip()
    if not worker:
        return 400, {"error": "who is taking this job?"}
    with closing(get_db()) as conn:
        at = now(conn)
        cur = conn.execute(
            "UPDATE reports SET status = 'assigned', worker = ? "
            "WHERE id = ? AND status = 'open'", (worker, data.get("id")))
        if cur.rowcount == 0:
            return 409, {"error": "that job is not open"}
        add_history(conn, data.get("id"), "Assigned to " + worker, at)
        conn.commit()
    return 200, {"ok": True}


def give_reason(data):
    """An official saying, in public, why this is not fixed yet.

    Read what this function does NOT do. It never writes deadline_from,
    created_at or escalated. A reason cannot buy time, because the moment
    it can, every report gets one on day one and the deadline stops
    meaning anything. The clock runs, the escalation still fires, and the
    explanation sits next to the overdue bar rather than in place of it.

    Rerouting is the same story: handing a report to the ESCOM moves who
    owns it and nothing else. Otherwise 'not our asset' becomes the new
    way to make a report disappear, which is the thing we are here to
    stop."""
    code = data.get("code")
    if code not in REASONS:
        return 400, {"error": "pick a reason from the list"}

    with closing(get_db()) as conn:
        at = now(conn)
        row = conn.execute("SELECT * FROM reports WHERE id = ?",
                           (data.get("id"),)).fetchone()
        if row is None:
            return 404, {"error": "no such report"}
        if row["status"] == "resolved":
            return 409, {"error": "that report is already closed"}

        speaking = row["owner_body"]

        if code == "not_our_asset":
            handed_to = data.get("to")
            if handed_to not in BODIES:
                return 400, {"error": "say which department it belongs to"}
            if handed_to == speaking:
                return 400, {"error": "that is the department it is already with"}
            conn.execute("UPDATE reports SET owner_body = ? WHERE id = ?",
                         (handed_to, row["id"]))
            add_history(conn, row["id"],
                        "Handed from " + BODIES[speaking]["name"] + " to " +
                        BODIES[handed_to]["name"] +
                        ". The deadline did not restart.", at)

        conn.execute(
            "INSERT INTO reasons (report_id, code, detail, body, cycle, at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (row["id"], code, (data.get("detail") or "").strip(),
             speaking, row["reopened"], at))
        add_history(conn, row["id"],
                    BODIES[speaking]["name"] + " gave a reason: " +
                    REASONS[code], at)
        conn.commit()
    return 200, {"ok": True}


def mark_repaired(data):
    # Staff can only CLAIM a repair. There is no path from here to
    # 'resolved'. Not hidden, not disabled - absent from the code.
    if not data.get("photo"):
        return 400, {"error": "a repair claim needs photo proof"}
    with closing(get_db()) as conn:
        at = now(conn)
        row = conn.execute("SELECT * FROM reports WHERE id = ?",
                           (data.get("id"),)).fetchone()
        if row is None:
            return 404, {"error": "no such report"}

        # You may not collect credit for a late repair you never explained.
        # This is the rule that turns the reason from a nice-to-have into
        # something an official has to do, and it lives on the server so it
        # is not a screen you can skip.
        if is_silent(row, reasons_for(conn, row["id"]), at):
            return 409, {"error": "this one went past its deadline. Give the "
                                  "resident a reason first."}

        cur = conn.execute(
            "UPDATE reports SET status = 'awaiting', fix_photo = ? "
            "WHERE id = ? AND status = 'assigned'",
            (data.get("photo"), data.get("id")))
        if cur.rowcount == 0:
            return 409, {"error": "that job is not assigned to anyone"}
        add_history(conn, data.get("id"),
                    "Staff submitted repair proof. Waiting for the resident "
                    "who reported it.", at)
        conn.commit()
    return 200, {"ok": True}


def confirm_fix(data):
    """The whole product is this function.

    It is the ONLY writer of 'resolved' in the codebase, and it refuses
    anyone who is not the device that filed the report. That check is here,
    on the server, and not in the browser - because a rule that lives in
    the browser is a UI convention, which is exactly what we criticise
    every other system for."""
    with closing(get_db()) as conn:
        at = now(conn)
        row = conn.execute(
            "SELECT reporter_hash, status FROM reports WHERE id = ?",
            (data.get("id"),)).fetchone()
        if row is None:
            return 404, {"error": "no such report"}
        if row["status"] != "awaiting":
            return 409, {"error": "nothing has been claimed as repaired yet"}
        if row["reporter_hash"] != token_hash(data.get("token")):
            return 403, {"error":
                         "only the resident who reported this can close it"}

        if data.get("works") is True:
            conn.execute("UPDATE reports SET status = 'resolved' WHERE id = ?",
                         (data.get("id"),))
            add_history(conn, data.get("id"),
                        "Resident confirmed the repair. Report closed.", at)
        else:
            # created_at is NEVER rewritten. The ledger does not forget when
            # this was first reported - that is the number that indicts.
            # Only the current deadline restarts.
            conn.execute("""
                UPDATE reports
                   SET status = 'open', deadline_from = ?, fix_photo = NULL,
                       worker = NULL, escalated = 0,
                       reopened = reopened + 1
                 WHERE id = ?
            """, (at, data.get("id")))
            add_history(conn, data.get("id"),
                        "Resident says it is still broken. Reopened, and the "
                        "clock restarted.", at)
        conn.commit()
    return 200, {"ok": True}


def shift_clock(data):
    # Stage machinery, and we say so out loud. Your shortest deadline is
    # 12 hours and your demo is 7 minutes.
    with closing(get_db()) as conn:
        if data.get("reset"):
            set_offset(conn, 0)
        else:
            hours = float(data.get("hours", 24))
            set_offset(conn, clock_offset(conn) + int(hours * 3_600_000))
        at = now(conn)
        record_escalations(conn, at)
        conn.commit()
    return 200, {"ok": True, "now": at}


def reset_everything(_data):
    with closing(get_db()) as conn:
        conn.executescript(
            "DELETE FROM reports; DELETE FROM history; "
            "DELETE FROM voices;  DELETE FROM meta; "
            "DELETE FROM reasons; DELETE FROM sqlite_sequence;")
        conn.commit()
    print("Everything cleared")
    return 200, {"ok": True}


ROUTES = {
    "/api/report":   add_report,
    "/api/voice":    add_voice,
    "/api/assign":   assign_report,
    "/api/reason":   give_reason,
    "/api/repaired": mark_repaired,
    "/api/confirm":  confirm_fix,
    "/api/clock":    shift_clock,
    "/api/reset":    reset_everything,
}


# ------------------------------------------------------------------- server

class Handler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="static", **kwargs)

    def log_message(self, fmt, *args):
        pass                       # the terminal is for our prints, not noise

    def send_json(self, status, payload):
        payload.setdefault("ok", 200 <= status < 300)
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        route = urlparse(self.path)
        try:
            if route.path == "/api/health":
                return self.send_json(200, {"service": "sethu"})
            if route.path == "/api/reports":
                return self.send_json(200, load_reports())
            if route.path == "/api/photo":
                query = parse_qs(route.query)
                photo = load_photo(query.get("id", [""])[0],
                                   query.get("kind", ["report"])[0])
                if not photo:
                    return self.send_json(404, {"error": "no photo"})
                return self.send_json(200, {"photo": photo})
        except Exception as error:
            print("GET failed:", route.path, error)
            return self.send_json(500, {"error": "server error"})
        return super().do_GET()

    def do_POST(self):
        route = urlparse(self.path)
        handler = ROUTES.get(route.path)
        if handler is None:
            return self.send_json(404, {"error": "unknown request"})

        length = int(self.headers.get("Content-Length", 0))
        if length > MAX_BODY:
            return self.send_json(413, {"error": "that photo is too large"})
        try:
            data = json.loads(self.rfile.read(length) or b"{}")
        except ValueError:
            return self.send_json(400, {"error": "bad json"})

        try:
            status, payload = handler(data)
        except Exception as error:
            # One bad request must never take the server down mid-demo.
            print("POST failed:", route.path, error)
            status, payload = 500, {"error": "server error"}
        self.send_json(status, payload)


class ThreadedServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    # One phone uploading a photo must not freeze the projector.
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    setup_db()
    if not os.path.isdir("static"):
        print("!! no static/ folder next to server.py")
    print("Sethu running.  http://localhost:" + str(PORT))
    ThreadedServer(("0.0.0.0", PORT), Handler).serve_forever()
