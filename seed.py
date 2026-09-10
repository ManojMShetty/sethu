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
# Vyasarajapura, T. Narasipura taluk, Mysuru district, PIN 571120. The
# coordinates below sit around Somanathapura's recorded position, which
# shares this PIN, so the district and the roads are right and the points
# are good to about a kilometre. The place NAMES are the generic ones every
# hamlet here has. Ask in the village and rename them; that is the cheapest
# credibility on offer and it is the one thing the internet cannot give you.

import sys
import time
import server                      # reuse the real schema and the real rules

HOUR = 3_600_000

#        category  locality                       note
#                  lat        lng        age_h  status        reopened
#                  place_kind   reason code the owner has posted, or None
ROWS = [
    ("water", "Overhead tank",                  12.2769, 76.8821,  86, "open",    2,
     None, "no_funds",
     "Tank is full. Nothing comes out of the tap at our end of the road."),
    ("power", "Transformer, Somanathapura road", 12.2752, 76.8836,  31, "open",    0,
     None, None,
     "Transformer went in the rain. Fourth day now. No line man has come."),
    ("bus",  "Bus stop, Sosale road",          12.2762, 76.8808,  40, "assigned", 0,
     None, "not_our_asset",
     "The 7:10 has not run all week. Children are missing first period."),
    ("bore", "Borewell, north colony",         12.2775, 76.8814,  19, "awaiting", 0,
     None, None,
     "Hand pump handle broken. Forty houses use this one."),
    ("drain", "Ration shop",                    12.2758, 76.8803,  54, "open",    0,
     None, "awaiting_material",
     "Blocked drain. Standing water outside the shop for a week."),
    ("waste", "Government school",              12.2747, 76.8809,   9, "open",    0,
     "school", None,
     "Not collected since Friday. Dogs at it every night, next to the gate."),
    # The row that carries the problem statement. A school toilet, well past
    # its deadline, and nobody has said a word about it.
    ("toilet", "Government school",              12.2745, 76.8807,  61, "open",    0,
     "school", None,
     "Toilet has been locked since the tap stopped. Girls go home at noon."),
    ("toilet", "Anganwadi centre",               12.2751, 76.8825,  11, "assigned", 0,
     "anganwadi", None,
     "No water in the toilet for four days."),
    ("road", "Temple junction",                12.2743, 76.8818,  26, "open",    0,
     None, "needs_sanction",
     "Hole at the junction. Two-wheelers swerve into oncoming traffic."),
    ("light", "Health sub-centre",              12.2764, 76.8831,   6, "open",    0,
     None, None,
     "Pole outside the sub-centre is out. Night cases arrive in the dark."),
    ("water", "Gram Panchayat office",          12.2755, 76.8813,   3, "open",    0,
     None, None,
     "Small leak at the valve. Reporting before it becomes a big one."),
    ("light", "Bus stop, Sosale road",          12.2761, 76.8806,  70, "resolved", 0,
     None, None,
     "Streetlight out at the stop."),
    ("drain", "Overhead tank",                  12.2770, 76.8820,  96, "resolved", 1,
     None, None,
     "Drain overflowing beside the tank."),
]

# Posts that actually exist in a Karnataka Gram Panchayat. There is no
# lineman post in the standard staffing pattern, which is itself why a dead
# streetlight sits for a week, so streetlight work is shown as outsourced.
WORKERS = ["Water operator", "Sanitation worker", "Contract electrician"]

# What each department says when it has not fixed something. Seeded so the
# ledger on the projector shows a real spread: some explained, some not.
REASON_DETAIL = {
    "no_funds": "Tabled for the October Gram Sabha",
    "not_our_asset": "Route and timings are the depot's, not ours",
    "awaiting_material": "Desilting rods ordered from the taluk store",
    "needs_sanction": "Estimate above our limit, sent to the PRED",
}


def seed():
    server.setup_db()
    conn = server.get_db()
    real_now = int(time.time() * 1000)

    for i, (cat, place, lat, lng, age_h, status, reopened, place_kind,
            reason, note) in enumerate(ROWS, start=1):
        rid = "VYS-" + str(i).zfill(4)
        created = real_now - age_h * HOUR
        token = "seed-resident-" + str(i)
        who = server.token_hash(token)

        # A reopened report keeps its ORIGINAL date and restarts only the
        # deadline. That is the pair of numbers the whole pitch rests on.
        deadline_from = created + 24 * HOUR if reopened else created
        owner = server.owner_for(cat, place_kind)

        conn.execute("""
            INSERT INTO reports
              (id, category, note, lat, lng, place, status,
               created_at, deadline_from, reporter_hash, worker, reopened,
               owner_body, place_kind)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (rid, cat, note, lat, lng, place, status, created, deadline_from,
              who, WORKERS[i % 3] if status != "open" else None, reopened,
              owner, place_kind))

        if reason:
            conn.execute(
                "INSERT INTO reasons (report_id, code, detail, body, cycle, at)"
                " VALUES (?, ?, ?, ?, ?, ?)",
                (rid, reason, REASON_DETAIL.get(reason, ""), owner, reopened,
                 created + 4 * HOUR))
            server.add_history(
                conn, rid,
                server.BODIES[owner]["name"] + " gave a reason: " +
                server.REASONS[reason], created + 4 * HOUR)

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
    print("Confirm the place names in the village. Coordinates are\n"
      "the Somanathapura cluster, good to about a kilometre.")


if __name__ == "__main__":
    if "--reset" in sys.argv:
        server.setup_db()
        server.reset_everything({})
    seed()
