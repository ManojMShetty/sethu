# test_api.py
# Run the whole contract against a running server. Standard library only.
#
#   python server.py          (in one terminal)
#   python test_api.py        (in another)
#
# WARNING: this calls /api/reset first. It wipes the database.
# Run seed.py afterwards before you demo anything.

import os
import sys
import json
import urllib.request
import urllib.error

# HAWCC: "localhost will NOT work on this platform. Always use the
# generated public URL." So never hardcode one. Pass it in:
#
#   python test_api.py https://<your-ports-panel-url>
#   SETHU_URL=https://... python test_api.py
#
# The localhost default is only for the workspace terminal, where the
# server is a local process.
BASE = (sys.argv[1] if len(sys.argv) > 1
        else os.environ.get("SETHU_URL", "http://localhost:8000")).rstrip("/")
print("testing " + BASE)
RESIDENT = "tok-resident-aaaa"      # pretend device tokens
NEIGHBOUR = "tok-neighbour-bbbb"
passed = 0


def call(method, path, body=None):
    """Returns (status, parsed json). Never raises on a 4xx - we are
    testing that the 4xx happens."""
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(BASE + path, data=data, method=method)
    request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())


def check(name, condition):
    global passed
    if not condition:
        raise AssertionError("FAILED  " + name)
    passed += 1
    print("ok  " + name)


# ----------------------------------------------------------------- the run

call("POST", "/api/reset")

status, body = call("GET", "/api/health")
check("health responds", status == 200 and body["ok"] is True)

status, body = call("POST", "/api/report", {
    "category": "light", "note": "Dark since Deepavali.",
    "lat": 12.2958, "lng": 76.6394, "token": RESIDENT})
check("first report is VYS-0001", status == 200 and body["id"] == "VYS-0001")
first = body["id"]

status, body = call("POST", "/api/report", {
    "category": "nonsense", "lat": 12.2958, "lng": 76.6394,
    "token": RESIDENT})
check("unknown category rejected      (400)", status == 400)

status, body = call("POST", "/api/report", {
    "category": "light", "lat": 12.29582, "lng": 76.63942,
    "token": NEIGHBOUR})
check("same pole 3m away merges", body.get("duplicate") is True)

status, body = call("POST", "/api/report", {
    "category": "light", "lat": 12.2962, "lng": 76.6398,
    "token": NEIGHBOUR})
check("next pole 60m away is its own report",
      body.get("duplicate") is False and body["id"] == "VYS-0002")

status, body = call("POST", "/api/voice", {"id": first, "token": NEIGHBOUR})
check("neighbour can add a voice", status == 200)

status, body = call("POST", "/api/voice", {"id": first, "token": NEIGHBOUR})
check("same device cannot vote twice  (409)", status == 409)

status, body = call("POST", "/api/voice", {"id": "VYS-9999",
                                           "token": NEIGHBOUR})
check("voice on unknown id rejected   (404)", status == 404)

status, body = call("GET", "/api/reports")
report = [r for r in body["reports"] if r["id"] == first][0]
check("reporter plus one joiner is 2 voices", report["voices"] == 2)
check("photos never travel in the list", "photo" not in report)

status, body = call("POST", "/api/confirm", {"id": first, "works": True,
                                             "token": RESIDENT})
check("cannot close before repair claim (409)", status == 409)

status, body = call("POST", "/api/assign", {"id": first, "worker": "Lineman"})
check("staff take the job", status == 200)

status, body = call("POST", "/api/assign", {"id": first, "worker": "Lineman"})
check("cannot take it twice          (409)", status == 409)

status, body = call("POST", "/api/repaired", {"id": first})
check("repair claim needs proof      (400)", status == 400)

status, body = call("POST", "/api/repaired", {"id": first,
                                              "photo": "data:image/jpeg,x"})
check("repair claim with proof", status == 200)

status, body = call("GET", "/api/reports")
report = [r for r in body["reports"] if r["id"] == first][0]
check("staff cannot reach resolved", report["status"] == "awaiting")

# ---- the one that is the whole product -----------------------------------
status, body = call("POST", "/api/confirm", {"id": first, "works": True,
                                             "token": NEIGHBOUR})
check("WRONG device cannot close     (403)", status == 403)

status, body = call("POST", "/api/confirm", {"id": first, "works": False,
                                             "token": RESIDENT})
check("reporter rejects the repair", status == 200)

status, body = call("GET", "/api/reports")
report = [r for r in body["reports"] if r["id"] == first][0]
check("reopen counted", report["reopened"] == 1)
check("reopen restarted the deadline",
      report["deadline_from"] > report["created_at"])
check("but created_at was NOT rewritten",
      report["created_at"] < report["deadline_from"])

# ---- escalation, driven by the demo clock --------------------------------
call("POST", "/api/assign", {"id": first, "worker": "Lineman"})
call("POST", "/api/repaired", {"id": first, "photo": "data:image/jpeg,x"})

status, body = call("POST", "/api/clock", {"hours": 80})   # light = 72h
check("clock shifted", status == 200)

status, body = call("GET", "/api/reports")
report = [r for r in body["reports"] if r["id"] == first][0]
check("escalated to Taluk unassisted", report["level"] == 1)
check("escalation written to the record",
      any("Taluk" in h["message"] for h in report["history"]))

status, body = call("POST", "/api/clock", {"hours": 80})   # past 2x now
status, body = call("GET", "/api/reports")
report = [r for r in body["reports"] if r["id"] == first][0]
check("escalated to Zilla unassisted", report["level"] == 2)

status, body = call("POST", "/api/confirm", {"id": first, "works": True,
                                             "token": RESIDENT})
check("reporter closes it for good", status == 200)

call("POST", "/api/clock", {"reset": True})

# ---- the explanation the Panchayat owes the resident ---------------------
# The same contract test_local.js runs against store-local.js. If a rule
# changes on one side only, one of these two files goes red.


def find(report_id):
    _, payload = call("GET", "/api/reports")
    return [r for r in payload["reports"] if r["id"] == report_id][0]


status, body = call("POST", "/api/report", {
    "category": "toilet", "lat": 12.4000, "lng": 76.8000,
    "token": RESIDENT, "place_kind": "school"})
school_toilet = body["id"]

status, body = call("POST", "/api/report", {
    "category": "toilet", "lat": 12.5000, "lng": 76.9000, "token": RESIDENT})
village_toilet = body["id"]

status, body = call("POST", "/api/report", {
    "category": "power", "lat": 12.6000, "lng": 77.0000, "token": RESIDENT})
power_line = body["id"]

check("school toilet routes to the education dept",
      find(school_toilet)["owner_body"] == "edu")
check("village toilet stays with the Panchayat",
      find(village_toilet)["owner_body"] == "gp")
check("a power line starts with the ESCOM",
      find(power_line)["owner_body"] == "escom")

status, _ = call("POST", "/api/reason", {"id": village_toilet,
                                         "code": "because"})
check("reason must come from the list     (400)", status == 400)

status, _ = call("POST", "/api/reason", {"id": "VYS-9999",
                                         "code": "no_funds"})
check("reason on an unknown report        (404)", status == 404)

before = find(village_toilet)
status, _ = call("POST", "/api/reason", {
    "id": village_toilet, "code": "no_funds",
    "detail": "Gram Sabha meets in October"})
check("official gives a reason", status == 200)

after = find(village_toilet)
check("the reason is on the public record", len(after["reasons"]) == 1)
check("the reason carries who said it",
      after["reasons"][0]["body"] == "gp" and after["reasons"][0]["detail"])
check("a reason does NOT move the deadline",
      after["deadline_from"] == before["deadline_from"])
check("a reason does NOT rewrite the report date",
      after["created_at"] == before["created_at"])

status, _ = call("POST", "/api/reason", {"id": school_toilet,
                                         "code": "not_our_asset"})
check("rerouting needs a destination      (400)", status == 400)

status, _ = call("POST", "/api/reason", {"id": school_toilet,
                                         "code": "not_our_asset",
                                         "to": "edu"})
check("cannot reroute to its current owner (400)", status == 400)

before = find(school_toilet)
status, _ = call("POST", "/api/reason", {
    "id": school_toilet, "code": "not_our_asset",
    "detail": "Tap is outside the compound wall", "to": "gp"})
check("handed to the Panchayat", status == 200)

after = find(school_toilet)
check("the owner changed", after["owner_body"] == "gp")
check("but handing it over did NOT restart the clock",
      after["deadline_from"] == before["deadline_from"] and
      after["created_at"] == before["created_at"])

call("POST", "/api/assign", {"id": power_line, "worker": "Section officer"})
call("POST", "/api/clock", {"hours": 20})       # a power line gets 12 hours

late = find(power_line)
check("overdue and unexplained reads as silent", late["silent"] is True)
check("escalated even though nobody explained", late["level"] == 1)

status, _ = call("POST", "/api/repaired", {"id": power_line,
                                           "photo": "data:image/jpeg,x"})
check("no repair claim while the delay is unexplained (409)", status == 409)

status, _ = call("POST", "/api/reason", {
    "id": power_line, "code": "no_staff",
    "detail": "No lineman posted to this Panchayat"})
check("so the official explains it", status == 200)

late = find(power_line)
check("silence is cleared", late["silent"] is False)
check("but it is STILL escalated and still late", late["level"] == 1)

status, _ = call("POST", "/api/repaired", {"id": power_line,
                                           "photo": "data:image/jpeg,x"})
check("and now the repair claim is allowed", status == 200)

status, _ = call("POST", "/api/confirm", {"id": power_line, "works": False,
                                          "token": RESIDENT})
check("resident says it is still broken", status == 200)

call("POST", "/api/clock", {"hours": 20})
check("last month's excuse does not cover this month",
      find(power_line)["silent"] is True)

call("POST", "/api/clock", {"reset": True})

print("")
print(str(passed) + " passed")
