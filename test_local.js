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

  console.log("\n" + passed + " passed");
})();
