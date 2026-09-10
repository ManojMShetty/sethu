// test_local.js
// Runs the SAME contract as test_api.py against store-local.js.
//
//   node test_local.js
//
// store-local.js is a hand-written mirror of server.py. This file is what
// stops the two drifting apart: if a rule changes on one side and not the
// other, this goes red rather than the demo going wrong on stage.

const fs = require("fs");
const vm = require("vm");

// minimal localStorage, plus a clock we can push forward
const store = {};
const sandbox = {
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  },
  Date, Math, JSON, Infinity, console
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("static/store-local.js", "utf8"), sandbox);
const api = sandbox.LocalApi;

const RESIDENT = "tok-resident-aaaa";
const NEIGHBOUR = "tok-neighbour-bbbb";
let passed = 0;

function check(name, condition) {
  if (!condition) { console.log("FAILED  " + name); process.exit(1); }
  passed++;
  console.log("ok  " + name);
}

(async function run() {
  await api.reset();

  let r = await api.addReport({ category: "light", note: "Dark since Deepavali.",
                                lat: 12.2958, lng: 76.6394, token: RESIDENT });
  check("first report is VYS-0001", r.id === "VYS-0001");
  const first = r.id;

  r = await api.addReport({ category: "nonsense", lat: 12.2958, lng: 76.6394,
                            token: RESIDENT });
  check("unknown category rejected      (400)", r.status === 400);

  r = await api.addReport({ category: "light", lat: 12.29582, lng: 76.63942,
                            token: NEIGHBOUR });
  check("same pole 3m away merges", r.duplicate === true);

  r = await api.addReport({ category: "light", lat: 12.2962, lng: 76.6398,
                            token: NEIGHBOUR });
  check("next pole 60m away is its own report",
        r.duplicate === false && r.id === "VYS-0002");

  check("neighbour can add a voice",
        (await api.addVoice(first, NEIGHBOUR)).ok === true);
  check("same device cannot vote twice  (409)",
        (await api.addVoice(first, NEIGHBOUR)).status === 409);
  check("voice on unknown id rejected   (404)",
        (await api.addVoice("VYS-9999", NEIGHBOUR)).status === 404);

  let list = await api.listReports();
  let one = list.reports.find((x) => x.id === first);
  check("reporter plus one joiner is 2 voices", one.voices === 2);
  check("photos never travel in the list", !("photo" in one));

  check("cannot close before repair claim (409)",
        (await api.confirmFix(first, true, RESIDENT)).status === 409);
  check("staff take the job",
        (await api.assign(first, "Lineman")).ok === true);
  check("cannot take it twice          (409)",
        (await api.assign(first, "Lineman")).status === 409);
  check("repair claim needs proof      (400)",
        (await api.markRepaired(first, null)).status === 400);
  check("repair claim with proof",
        (await api.markRepaired(first, "data:image/jpeg,x")).ok === true);

  list = await api.listReports();
  one = list.reports.find((x) => x.id === first);
  check("staff cannot reach resolved", one.status === "awaiting");

  check("WRONG device cannot close     (403)",
        (await api.confirmFix(first, true, NEIGHBOUR)).status === 403);
  check("reporter rejects the repair",
        (await api.confirmFix(first, false, RESIDENT)).ok === true);

  list = await api.listReports();
  one = list.reports.find((x) => x.id === first);
  check("reopen counted", one.reopened === 1);
  check("reopen restarted the deadline", one.deadline_from > one.created_at);
  check("but created_at was NOT rewritten", one.created_at < one.deadline_from);

  await api.assign(first, "Lineman");
  await api.markRepaired(first, "data:image/jpeg,x");

  check("clock shifted", (await api.shiftClock({ hours: 80 })).ok === true);
  list = await api.listReports();
  one = list.reports.find((x) => x.id === first);
  check("escalated to Taluk unassisted", one.level === 1);
  check("escalation written to the record",
        one.history.some((h) => h.message.includes("Taluk")));

  await api.shiftClock({ hours: 80 });
  list = await api.listReports();
  one = list.reports.find((x) => x.id === first);
  check("escalated to Zilla unassisted", one.level === 2);

  check("reporter closes it for good",
        (await api.confirmFix(first, true, RESIDENT)).ok === true);

  // ---- the explanation the Panchayat owes the resident ---------------
  // Everything below is about one rule: an official may not leave a
  // resident guessing, and may not buy time by explaining.

  await api.shiftClock({ reset: true });

  r = await api.addReport({ category: "toilet", lat: 12.4000, lng: 76.8000,
                            token: RESIDENT, place_kind: "school" });
  const schoolToilet = r.id;
  r = await api.addReport({ category: "toilet", lat: 12.5000, lng: 76.9000,
                            token: RESIDENT });
  const villageToilet = r.id;
  r = await api.addReport({ category: "power", lat: 12.6000, lng: 77.0000,
                            token: RESIDENT });
  const powerLine = r.id;

  list = await api.listReports();
  const ownerOf = (id) => list.reports.find((x) => x.id === id).owner_body;
  check("school toilet routes to the education dept",
        ownerOf(schoolToilet) === "edu");
  check("village toilet stays with the Panchayat",
        ownerOf(villageToilet) === "gp");
  check("a power line starts with the ESCOM",
        ownerOf(powerLine) === "escom");

  check("reason must come from the list     (400)",
        (await api.giveReason(villageToilet, "because", "", null)).status === 400);
  check("reason on an unknown report        (404)",
        (await api.giveReason("VYS-9999", "no_funds", "", null)).status === 404);

  let before = list.reports.find((x) => x.id === villageToilet);
  check("official gives a reason",
        (await api.giveReason(villageToilet, "no_funds",
                              "Gram Sabha meets in October")).ok === true);
  list = await api.listReports();
  let after = list.reports.find((x) => x.id === villageToilet);
  check("the reason is on the public record", after.reasons.length === 1);
  check("the reason carries who said it",
        after.reasons[0].body === "gp" && after.reasons[0].detail.length > 0);
  check("a reason does NOT move the deadline",
        after.deadline_from === before.deadline_from);
  check("a reason does NOT rewrite the report date",
        after.created_at === before.created_at);

  check("rerouting needs a destination      (400)",
        (await api.giveReason(schoolToilet, "not_our_asset", "", null)).status === 400);
  check("cannot reroute to its current owner (400)",
        (await api.giveReason(schoolToilet, "not_our_asset", "", "edu")).status === 400);

  before = list.reports.find((x) => x.id === schoolToilet);
  check("handed to the Panchayat",
        (await api.giveReason(schoolToilet, "not_our_asset",
                              "Tap is outside the compound wall", "gp")).ok === true);
  list = await api.listReports();
  after = list.reports.find((x) => x.id === schoolToilet);
  check("the owner changed", after.owner_body === "gp");
  check("but handing it over did NOT restart the clock",
        after.deadline_from === before.deadline_from &&
        after.created_at === before.created_at);

  await api.assign(powerLine, "Section officer");
  await api.shiftClock({ hours: 20 });          // a power line gets 12 hours

  list = await api.listReports();
  let late = list.reports.find((x) => x.id === powerLine);
  check("overdue and unexplained reads as silent", late.silent === true);
  check("escalated even though nobody explained", late.level === 1);
  check("no repair claim while the delay is unexplained (409)",
        (await api.markRepaired(powerLine, "data:image/jpeg,x")).status === 409);

  check("so the official explains it",
        (await api.giveReason(powerLine, "no_staff",
                              "No lineman posted to this Panchayat")).ok === true);
  list = await api.listReports();
  late = list.reports.find((x) => x.id === powerLine);
  check("silence is cleared", late.silent === false);
  check("but it is STILL escalated and still late", late.level === 1);
  check("and now the repair claim is allowed",
        (await api.markRepaired(powerLine, "data:image/jpeg,x")).ok === true);

  check("resident says it is still broken",
        (await api.confirmFix(powerLine, false, RESIDENT)).ok === true);
  await api.shiftClock({ hours: 20 });
  list = await api.listReports();
  late = list.reports.find((x) => x.id === powerLine);
  check("last month's excuse does not cover this month", late.silent === true);

  console.log("\n" + passed + " passed");
})();
