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

print("")
print(str(passed) + " passed")
