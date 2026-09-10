// app.js - the browser side of Sethu.
//
// How this works: Store holds the truth. We ask it for the list of
// reports, keep it in allReports, and draw the screen from that. Anything
// that changes a report tells Store first, then refreshes.
//
// This file never calls fetch() and never asks which backend is running.

// ---------- section 1: things we need everywhere ----------

var CATEGORIES = [
  { id: "power",  name: "Power line",  why: "live wire" },
  { id: "water",  name: "Dry pipeline", why: "no water at the tap" },
  { id: "bus",    name: "Bus never came", why: "no way out of here" },
  { id: "bore",   name: "Hand pump",   why: "only source" },
  { id: "waste",  name: "Garbage",     why: "health risk" },
  { id: "toilet", name: "Toilet",      why: "sanitation" },
  { id: "drain",  name: "Drain",       why: "standing water" },
  { id: "light",  name: "Streetlight", why: "unlit at night" },
  { id: "road",   name: "Road hole",   why: "slower to fix" }
];

// >>> PLACEHOLDERS. REPLACE ALL TEN ON THE FIELD VISIT. <<<
// These are the landmarks every Karnataka hamlet actually has, so the list
// is the right SHAPE - but the names and the coordinates are invented and
// a local judge will know it in one second. Walk Vyasarajapura, write down
// what people actually call these places, and stand at each one to read the
// real GPS off your phone.
//
// This list is also the fallback when the page is on a plain http origin,
// where the browser blocks geolocation without telling anyone.
var LANDMARKS = [
  { name: "Overhead tank, main road", lat: 13.0000, lng: 77.5000 },
  { name: "Bus stop, main road",      lat: 13.0004, lng: 77.5003 },
  { name: "Gram Panchayat office",    lat: 13.0007, lng: 77.4996 },
  { name: "Anganwadi centre",         lat: 13.0011, lng: 77.5008 },
  { name: "Government school gate",   lat: 13.0015, lng: 77.5001 },
  { name: "Primary Health Centre",    lat: 13.0009, lng: 77.5014 },
  { name: "Ration shop",              lat: 13.0002, lng: 77.5011 },
  { name: "Temple junction",          lat: 13.0018, lng: 77.4993 },
  { name: "Borewell, north colony",   lat: 13.0022, lng: 77.5006 },
  { name: "Transformer, east colony", lat: 13.0013, lng: 77.5021 }
];

var allReports = [];        // everything Store has told us
var serverNow = Date.now(); // the clock Store is using, demo offset included
var rules = RULES;          // replaced by the server's copy in server mode
var isStaff = false;

var chosenCategory = null;
var chosenPhoto = null;
var myLatitude = null;
var myLongitude = null;
var myPlace = null;

// Each browser gets a token and keeps it. This is how the server knows
// whether you are the person who filed a report, which decides whether
// you are allowed to close it. A fresh incognito window is a different
// resident - that is not a bug, it is how we demo the rule on stage.
var myToken = localStorage.getItem("sethu.token");
if (myToken === null) {
  myToken = "R" + Math.random().toString(36).slice(2, 12);
  localStorage.setItem("sethu.token", myToken);
}

// Every single string that reaches innerHTML goes through this. A note
// containing "<" must never be able to blank the popup, let alone run.
function esc(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function plural(n, word) {
  return n + " " + word + (Math.round(n) === 1 ? "" : "s");
}

function findCategory(id) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].id === id) return CATEGORIES[i];
  }
  return { id: id, name: "Other", why: "" };
}

function deadlineOf(id) { return rules.deadlines[id] || 72; }

function showMessage(text) {
  var box = document.getElementById("message");
  box.textContent = text;
  box.classList.remove("hidden");
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(function () {
    box.classList.add("hidden");
  }, 2800);
}

// Every call goes through here so that a rejection can never surface as
// success. server.py answers 403 and 409 with {ok:false, error:"..."};
// without this check the user sees a cheerful toast and believes it worked.
async function act(promise, successText) {
  try {
    var answer = await promise;
    if (answer && answer.ok === false) {
      showMessage(answer.error || "That did not work");
      return null;
    }
    if (successText) showMessage(successText);
    await loadReports();
    return answer;
  } catch (error) {
    showMessage("Could not reach the ledger");
    console.log(error);
    return null;
  }
}

async function loadReports() {
  try {
    var payload = await Store.listReports();
    allReports = payload.reports;
    serverNow = payload.now;
    if (payload.rules) rules = payload.rules;   // server is authoritative
    drawEverything();
  } catch (error) {
    showMessage("Could not load the ledger");
    console.log(error);
  }
}

// ---------- section 2: working out a report's state ----------

function hoursSince(milliseconds) {
  return (serverNow - milliseconds) / 3600000;
}

function describeAge(milliseconds) {
  var hours = hoursSince(milliseconds);
  if (hours < 1)  return plural(Math.max(1, Math.round(hours * 60)), "minute") + " old";
  if (hours < 48) return plural(Math.round(hours), "hour") + " old";
  return plural(Math.round(hours / 24), "day") + " old";
}

// NOT capped at 100. If every overdue report tied at 100 the desk sort
// would collapse and bury the most neglected report at the bottom - the
// exact opposite of what the desk promises.
function urgency(report) {
  if (report.status === "resolved") return -1;
  var used = hoursSince(report.deadline_from) / report.deadline;
  return used + Math.min(report.voices, 20) * 0.05 + report.reopened * 0.5;
}

function barWidth(report) {
  var used = (hoursSince(report.deadline_from) / report.deadline) * 100;
  return Math.max(0, Math.min(100, used));
}

function escalationName(report) {
  return ["Gram Panchayat", "Taluk Panchayat", "Zilla Panchayat"][report.level];
}

function describeStatus(report) {
  if (report.status === "resolved") return "Fixed, confirmed by the resident";
  if (report.status === "awaiting") return "Repair claimed, waiting for the resident";
  if (report.status === "assigned") {
    return report.level > 0 ? "In progress, past deadline" : "Assigned to staff";
  }
  if (report.level > 0) return "Escalated to " + escalationName(report);
  return "Waiting to be assigned";
}

function describeDeadline(report) {
  if (report.status === "resolved") return "Closed by the resident";
  var used = hoursSince(report.deadline_from);
  if (used > report.deadline) {
    return "Deadline missed by " + plural(Math.round(used - report.deadline), "hour");
  }
  return plural(Math.round(report.deadline - used), "hour") +
         " left of " + report.deadline;
}

// ---------- section 3: drawing the screen ----------

function drawCategories() {
  var box = document.getElementById("categories");
  box.innerHTML = "";

  CATEGORIES.forEach(function (category) {
    var button = document.createElement("button");
    button.innerHTML = esc(category.name) +
      "<small>" + deadlineOf(category.id) + "h &middot; " + esc(category.why) + "</small>";
    if (chosenCategory === category.id) button.className = "chosen";
    button.onclick = function () {
      chosenCategory = category.id;
      drawCategories();
    };
    box.appendChild(button);
  });
}

function buildReportCard(report) {
  var category = findCategory(report.category);

  var barClass = "deadline";
  if (report.status === "resolved") barClass += " done";
  else if (report.level === 2) barClass += " crit";
  else if (report.level === 1) barClass += " late";

  var cardClass = "report " + esc(report.status);
  if (report.level > 0 && report.status !== "resolved") cardClass += " late";

  var width = report.status === "resolved" ? 100 : barWidth(report);

  var html = '<div class="' + cardClass + '" data-id="' + esc(report.id) + '">';
  html += '<div class="reportTop">';
  html += '<div class="reportId">' + esc(report.id) + " &middot; " +
          esc(report.place || "location pinned") + " &middot; " +
          describeAge(report.created_at) + "</div>";
  html += '<div class="reportTitle">' + esc(category.name) + "</div>";
  html += '<div class="reportStatus">' + esc(describeStatus(report));

  if (report.voices > 1) {
    html += '<span class="chip">+' + (report.voices - 1) + " more residents</span>";
  }
  if (report.reopened > 0) {
    html += '<span class="chip bad">reopened ' +
            plural(report.reopened, "time") + "</span>";
  }
  html += "</div></div>";

  html += '<div class="' + barClass + '">';
  html += '<div class="deadlineFill" style="width:' + width + '%"></div>';
  html += '<div class="deadlineText"><span>' + esc(describeDeadline(report)) + "</span>";
  html += "<span>" + esc(escalationName(report)) + "</span></div>";
  html += "</div></div>";
  return html;
}

function drawList(elementId, reports, emptyText) {
  var box = document.getElementById(elementId);

  if (reports.length === 0) {
    box.innerHTML = '<div class="empty">' + esc(emptyText) + "</div>";
    return;
  }
  box.innerHTML = reports.map(buildReportCard).join("");

  var cards = box.getElementsByClassName("report");
  for (var i = 0; i < cards.length; i++) {
    cards[i].onclick = function () {
      openPopup(this.getAttribute("data-id"));
    };
  }
}

function drawEverything() {
  var open = 0, late = 0, done = 0, rejected = 0;
  var queue = [];

  allReports.forEach(function (report) {
    rejected += report.reopened;
    if (report.status === "resolved") {
      done++;
    } else {
      open++;
      queue.push(report);
      if (report.level > 0) late++;
    }
  });

  document.getElementById("countOpen").textContent = open;
  document.getElementById("countLate").textContent = late;
  document.getElementById("countDone").textContent = done;
  document.getElementById("countFalse").textContent = rejected;

  drawList("ledgerList", allReports,
           "No reports yet. The first one starts the ledger.");

  queue.sort(function (a, b) { return urgency(b) - urgency(a); });
  drawList("deskList", queue, "Queue is clear. Nothing is open right now.");
}

// ---------- section 4: what the buttons actually do ----------

// A raw phone photo is three to five megabytes and will never leave a
// village on a weak signal. Draw it onto a canvas at 720px and re-encode.
// Comes out around fifty kilobytes.
function shrinkPhoto(file, whenReady) {
  var reader = new FileReader();
  reader.onload = function () {
    var image = new Image();
    image.onload = function () {
      var scale = Math.min(1, 720 / Math.max(image.width, image.height));
      var canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

      var small = canvas.toDataURL("image/jpeg", 0.45);
      whenReady(small, Math.round(small.length * 0.75 / 1024));
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function findLocation() {
  var text = document.getElementById("locationText");
  if (!navigator.geolocation) {
    text.textContent = "This device cannot share location. Pick a landmark.";
    return;
  }
  text.textContent = "Finding your location";
  navigator.geolocation.getCurrentPosition(
    function (position) {
      myLatitude = position.coords.latitude;
      myLongitude = position.coords.longitude;
      myPlace = null;
      text.textContent = "Pinned at " + myLatitude.toFixed(5) + ", " +
                         myLongitude.toFixed(5);
    },
    function () {
      // On a plain-http origin the browser blocks this and says nothing.
      // Tell the user what to do instead of leaving them stuck.
      text.textContent = "Location unavailable here. Pick a landmark below.";
    },
    { timeout: 8000 }
  );
}

function drawLandmarks() {
  var select = document.getElementById("placeSelect");
  LANDMARKS.forEach(function (spot) {
    var option = document.createElement("option");
    option.value = spot.name;
    option.textContent = spot.name;
    select.appendChild(option);
  });
  select.onchange = function () {
    var spot = LANDMARKS.filter(function (s) { return s.name === this.value; },
                                this)[0];
    if (!spot) return;
    myLatitude = spot.lat;
    myLongitude = spot.lng;
    myPlace = spot.name;
    document.getElementById("locationText").textContent = "Set to " + spot.name;
  };
}

async function sendReport(force) {
  // The guard lives HERE, not on the button's disabled attribute. A
  // disabled button dispatches no click at all, so a user who taps it
  // gets silence - no toast, no error, nothing to debug on stage.
  if (chosenCategory === null) {
    showMessage("Choose what is broken first");
    return;
  }

  var answer = await act(Store.addReport({
    category: chosenCategory,
    note: document.getElementById("noteInput").value,
    photo: chosenPhoto,
    lat: myLatitude,
    lng: myLongitude,
    place: myPlace,
    token: myToken,
    force: force === true
  }));
  if (answer === null) return;

  if (answer.duplicate === true) {
    var joinIt = confirm(
      "Someone already reported this within " + answer.metres +
      " metres (" + answer.id + ").\n\n" +
      "Add your report to theirs? It carries more weight than a separate one.");
    if (joinIt) {
      await act(Store.addVoice(answer.id, myToken), "Added to " + answer.id);
      clearForm();
      switchTo("ledger");
      return;
    }
    // They said no. File it as its own report rather than dropping what
    // they typed on the floor, which is what a bare return would do.
    return sendReport(true);
  }

  showMessage("Report sent, " + answer.id);
  clearForm();
  switchTo("ledger");
}

function clearForm() {
  chosenCategory = null;
  chosenPhoto = null;
  document.getElementById("noteInput").value = "";
  document.getElementById("photoArea").innerHTML =
    '<button class="photoButton" id="photoButton">Take a photo</button>';
  document.getElementById("photoButton").onclick = openCamera;
  drawCategories();
}

function openCamera() { document.getElementById("photoInput").click(); }

async function openPopup(reportId) {
  var report = allReports.filter(function (r) { return r.id === reportId; })[0];
  if (!report) return;

  var category = findCategory(report.category);
  var iReportedThis = (report.reporter_hash === myToken);
  var html = "";

  if (report.has_photo) html += '<img class="photoPreview" id="photoMain" alt="">';

  html += "<h2>" + esc(category.name) + "</h2>";
  html += '<p class="sub">' + esc(report.note || "No description given.") + "</p>";
  html += '<p class="sub">' + esc(report.place || "Location pinned") +
          " &middot; " + plural(report.voices, "resident") + " reporting" +
          " &middot; deadline " + plural(report.deadline, "hour") + "</p>";

  if (report.level > 0 && report.status !== "resolved") {
    html += '<div class="notice bad"><b>Escalated to ' +
            esc(escalationName(report)) + "</b>" +
            "The deadline passed, so this moved up a level automatically. " +
            "No officer approved it, and everyone can see it.</div>";
  }
  if (report.reopened > 0) {
    html += '<div class="notice"><b>Reported ' + describeAge(report.created_at) +
            ", reopened " + plural(report.reopened, "time") + "</b>" +
            "The original date never changes. Only the current deadline " +
            "restarts.</div>";
  }
  if (report.has_fix_photo) {
    html += "<label>Repair photo submitted by staff</label>";
    html += '<img class="photoPreview" id="photoFix" alt="">';
  }

  html += "<label>What has happened</label><ul class='history'>";
  report.history.forEach(function (event) {
    html += "<li><b>" + esc(event.message) + "</b><small>" +
            esc(new Date(event.at).toLocaleString()) + "</small></li>";
  });
  html += "</ul>";

  // Which buttons you get depends on who you are.
  if (isStaff) {
    if (report.status === "open") {
      html += '<button class="mainButton blue" id="actionAssign">Take this job</button>';
    } else if (report.status === "assigned") {
      html += '<button class="mainButton green" id="actionRepair">Mark repaired and attach proof</button>';
    } else if (report.status === "awaiting") {
      html += '<div class="notice"><b>Waiting on the resident</b>' +
              "You cannot close this. The person who reported it decides, " +
              "and the server enforces that - not this screen.</div>";
    }
  } else if (report.status === "awaiting" && iReportedThis) {
    html += '<div class="notice"><b>Is it actually fixed?</b>' +
            "Staff say this was repaired. You reported it, so you decide.</div>";
    html += '<div class="halfButtons">';
    html += '<button class="mainButton green" id="actionYes">Yes, it works</button>';
    html += '<button class="mainButton" id="actionNo">No, still broken</button>';
    html += "</div>";
  } else if (report.status !== "resolved" && !iReportedThis) {
    html += '<button class="mainButton blue" id="actionVoice">This affects me too</button>';
  }

  document.getElementById("popupId").textContent = report.id;
  document.getElementById("popupBody").innerHTML = html;
  document.getElementById("popup").classList.remove("hidden");
  attachPopupButtons(report.id);

  // Photos arrive after the card is already on screen. Setting .src as a
  // property rather than building it into an HTML string means the data
  // URL can never break out of the attribute.
  if (report.has_photo) {
    var main = await Store.getPhoto(report.id, "report");
    var el = document.getElementById("photoMain");
    if (el && main) el.src = main;
  }
  if (report.has_fix_photo) {
    var fix = await Store.getPhoto(report.id, "fix");
    var fixEl = document.getElementById("photoFix");
    if (fixEl && fix) fixEl.src = fix;
  }
}

function attachPopupButtons(reportId) {
  var assign = document.getElementById("actionAssign");
  if (assign) assign.onclick = async function () {
    var worker = prompt("Who is taking this job?", "Lineman, Ward 4");
    if (worker === null) return;
    if (await act(Store.assign(reportId, worker), "Assigned")) closePopup();
  };

  var repair = document.getElementById("actionRepair");
  if (repair) repair.onclick = function () {
    // Proof is required. A claim without evidence is not a fix.
    var picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/*";
    picker.capture = "environment";
    picker.onchange = function () {
      if (!picker.files[0]) return;
      shrinkPhoto(picker.files[0], async function (small) {
        if (await act(Store.markRepaired(reportId, small),
                      "Sent to the resident to confirm")) closePopup();
      });
    };
    picker.click();
  };

  var yes = document.getElementById("actionYes");
  if (yes) yes.onclick = async function () {
    if (await act(Store.confirmFix(reportId, true, myToken),
                  "Closed. Thank you for checking.")) closePopup();
  };

  var no = document.getElementById("actionNo");
  if (no) no.onclick = async function () {
    if (await act(Store.confirmFix(reportId, false, myToken),
                  "Reopened and sent back")) closePopup();
  };

  var voice = document.getElementById("actionVoice");
  if (voice) voice.onclick = async function () {
    if (await act(Store.addVoice(reportId, myToken),
                  "Added. More residents now reporting this.")) closePopup();
  };
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
}

function switchTo(screen) {
  ["Report", "Ledger", "Desk"].forEach(function (name) {
    var active = (name.toLowerCase() === screen);
    document.getElementById("screen" + name).className = active ? "" : "hidden";
    document.getElementById("tab" + name).className = active ? "active" : "";
  });
  window.scrollTo(0, 0);
}

// ---------- section 5: wiring, once, on page load ----------

document.getElementById("tabReport").onclick = function () { switchTo("report"); };
document.getElementById("tabLedger").onclick = function () { switchTo("ledger"); };
document.getElementById("tabDesk").onclick   = function () { switchTo("desk"); };
document.getElementById("popupClose").onclick = closePopup;
document.getElementById("sendButton").onclick = function () { sendReport(false); };
document.getElementById("locationButton").onclick = findLocation;
document.getElementById("photoButton").onclick = openCamera;

document.getElementById("photoInput").onchange = function () {
  var file = this.files[0];
  if (!file) return;
  shrinkPhoto(file, function (small, sizeInKb) {
    chosenPhoto = small;
    document.getElementById("photoArea").innerHTML =
      '<img class="photoPreview" alt="">' +
      '<p class="photoSize">' + sizeInKb +
      " KB, small enough for a weak signal</p>";
    document.querySelector("#photoArea img").src = small;
  });
  this.value = "";
};

document.getElementById("roleButton").onclick = function () {
  isStaff = !isStaff;
  this.textContent = isStaff ? "Panchayat staff" : "Resident";
  switchTo(isStaff ? "desk" : "report");
  showMessage(isStaff ? "You are now Panchayat staff" : "You are a resident");
};

// The demo clock. Hidden unless the URL says ?demo=1, and we tell the
// jury what it is before we touch it.
if (location.search.indexOf("demo=1") > -1) {
  var bar = document.getElementById("demoBar");
  bar.classList.remove("hidden");
  bar.querySelectorAll("button").forEach(function (button) {
    button.onclick = async function () {
      var body = button.dataset.reset ? { reset: true }
                                      : { hours: Number(button.dataset.hours) };
      await act(Store.shiftClock(body));
      document.getElementById("clockNote").textContent =
        "showing " + new Date(serverNow).toLocaleString();
    };
  });
}

(async function boot() {
  var mode = await Store.start();
  document.getElementById("modeBadge").textContent = mode;
  drawCategories();
  drawLandmarks();
  findLocation();
  await loadReports();

  // Refetch, do not merely redraw. A redraw of stale memory is why a
  // report filed in one window never appears in the other.
  setInterval(loadReports, 15000);
})();
