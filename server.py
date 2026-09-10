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
                escalated      INTEGER NOT NULL DEFAULT 0
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
            out.append(r)
        # Ship the rules with the data. The browser has its own copy for
        # local mode; sending ours means the two can never silently
        # disagree about a live report's deadline.
        return {"now": at,
                "rules": {"deadlines": DEADLINES, "radius": DUP_RADIUS_M},
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

            conn.execute("""
                INSERT INTO reports
                  (id, category, note, photo, lat, lng, place, status,
                   created_at, deadline_from, reporter_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)
            """, (report_id, category, data.get("note", ""),
                  data.get("photo"), lat, lng, data.get("place"),
                  at, at, token_hash(token)))

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


def mark_repaired(data):
    # Staff can only CLAIM a repair. There is no path from here to
    # 'resolved'. Not hidden, not disabled - absent from the code.
    if not data.get("photo"):
        return 400, {"error": "a repair claim needs photo proof"}
    with closing(get_db()) as conn:
        at = now(conn)
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
            "DELETE FROM sqlite_sequence;")
        conn.commit()
    print("Everything cleared")
    return 200, {"ok": True}


ROUTES = {
    "/api/report":   add_report,
    "/api/voice":    add_voice,
    "/api/assign":   assign_report,
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
