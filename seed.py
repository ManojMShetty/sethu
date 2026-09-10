# seed.py
# Put a believable ledger on the projector.
#
#   python seed.py            add the demo rows
#   python seed.py --reset    wipe first, then add them
#
# An empty ledger is the worst first impression available to you, and it
# costs nothing to avoid. The rows are aged so the deadline bars show a
# spread: some filling, several past deadline, one at Zilla level, one
# reopened twice, two closed and confirmed by the resident.
#
# Run this immediately before you demo. Never demo from whatever state you
# left the app in last night.
#
# >>> THE LOCALITIES AND COORDINATES BELOW ARE PLACEHOLDERS. <<<
# They are the landmarks every Karnataka hamlet has, so the shape is right,
# but the names are generic and the coordinates are invented. Replace every
# one with what you write down on the field visit to Vyasarajapura. A local
# judge will spot invented geography immediately, and real names are the
# cheapest credibility on offer.

import sys
import time
import server                      # reuse the real schema and the real rules

HOUR = 3_600_000

#        category  locality                       note
#                  lat        lng        age_h  status        reopened
ROWS = [
    ("water",  "Overhead tank, main road",   13.0000, 77.5000,  86, "open",     2,
     "Tank is full. Nothing comes out of the tap at our end of the road."),
    ("power",  "Transformer, east colony",   13.0013, 77.5021,  31, "open",     0,
     "Transformer went in the rain. Fourth day now. No line man has come."),
    ("bus",    "Bus stop, main road",        13.0004, 77.5003,  40, "assigned", 0,
     "The 7:10 has not run all week. Children are missing first period."),
    ("bore",   "Borewell, north colony",     13.0022, 77.5006,  19, "awaiting", 0,
     "Hand pump handle broken. Forty houses use this one."),
    ("drain",  "Ration shop",                13.0002, 77.5011,  54, "open",     0,
     "Blocked drain. Standing water outside the shop for a week."),
    ("waste",  "Government school gate",     13.0015, 77.5001,   9, "open",     0,
     "Not collected since Friday. Dogs at it every night, next to the gate."),
    ("toilet", "Anganwadi centre",           13.0011, 77.5008,  11, "assigned", 0,
     "No water in the toilet for four days."),
    ("road",   "Temple junction",            13.0018, 77.4993,  26, "open",     0,
     "Hole at the junction. Two-wheelers swerve into oncoming traffic."),
    ("light",  "Primary Health Centre",      13.0009, 77.5014,   6, "open",     0,
     "Pole outside the PHC gate is out. Night cases arrive in the dark."),
    ("water",  "Gram Panchayat office",      13.0007, 77.4996,   3, "open",     0,
     "Small leak at the valve. Reporting before it becomes a big one."),
    ("light",  "Bus stop, main road",        13.0005, 77.5004,  70, "resolved", 0,
     "Streetlight out at the stop."),
    ("drain",  "Overhead tank, main road",   13.0001, 77.5002,  96, "resolved", 1,
     "Drain overflowing beside the tank."),
]

WORKERS = ["Lineman, Ward 4", "Water section, Ward 7", "Sanitary inspector"]


def seed():
    server.setup_db()
    conn = server.get_db()
    real_now = int(time.time() * 1000)

    for i, (cat, place, lat, lng, age_h, status, reopened, note) in \
            enumerate(ROWS, start=1):
        rid = "VYS-" + str(i).zfill(4)
        created = real_now - age_h * HOUR
        token = "seed-resident-" + str(i)
        who = server.token_hash(token)

        # A reopened report keeps its ORIGINAL date and restarts only the
        # deadline. That is the pair of numbers the whole pitch rests on.
        deadline_from = created + 24 * HOUR if reopened else created

        conn.execute("""
            INSERT INTO reports
              (id, category, note, lat, lng, place, status,
               created_at, deadline_from, reporter_hash, worker, reopened)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (rid, cat, note, lat, lng, place, status, created, deadline_from,
              who, WORKERS[i % 3] if status != "open" else None, reopened))

        conn.execute("INSERT INTO voices (report_id, voter_hash, at) "
                     "VALUES (?, ?, ?)", (rid, who, created))
        server.add_history(conn, rid, "Reported by a resident", created)

        # A dead pole on a busy main road collects neighbours. A valve in a
        # quiet cross does not. Make the numbers mean something.
        for j in range(i % 5):
            conn.execute("INSERT INTO voices (report_id, voter_hash, at) "
                         "VALUES (?, ?, ?)",
                         (rid, server.token_hash("neighbour-%d-%d" % (i, j)),
                          created + (j + 1) * HOUR))
            server.add_history(conn, rid,
                               "Another resident reported the same problem",
                               created + (j + 1) * HOUR)

        if status in ("assigned", "awaiting", "resolved"):
            server.add_history(conn, rid, "Assigned to " + WORKERS[i % 3],
                               created + 2 * HOUR)
        if status in ("awaiting", "resolved"):
            conn.execute("UPDATE reports SET fix_photo = ? WHERE id = ?",
                         ("data:image/jpeg;base64,seed", rid))
            server.add_history(conn, rid,
                               "Staff submitted repair proof. Waiting for the "
                               "resident who reported it.", created + 5 * HOUR)
        if reopened:
            server.add_history(conn, rid,
                               "Resident says it is still broken. Reopened, "
                               "and the clock restarted.", created + 6 * HOUR)
        if status == "resolved":
            server.add_history(conn, rid,
                               "Resident confirmed the repair. Report closed.",
                               created + 8 * HOUR)

    conn.commit()
    # Write the escalation events for anything already past its deadline,
    # so a red bar always has a matching line in its own timeline.
    server.record_escalations(conn, server.now(conn))
    conn.close()
    print("Seeded " + str(len(ROWS)) + " reports.")
    print("REPLACE the localities with real ones from the field visit.")


if __name__ == "__main__":
    if "--reset" in sys.argv:
        server.setup_db()
        server.reset_everything({})
    seed()
