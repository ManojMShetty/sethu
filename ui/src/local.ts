// The ledger when server.py is not running.
//
// api.ts tries the server first and comes here only when a request
// fails, so a demo on a laptop with no network still has working
// buttons. The rules below follow server.py closely enough for that;
// the server stays the authority whenever it is there.

import { derive, SEED, type IssueId, type Report } from "./data";

let rows: Report[] | null = null;
let clockOffset = 0; // hours, mirrors the demo clock in App

// The ledger lives in localStorage, so signing out as the official and
// back in as a resident, or reloading the page, keeps every claim. It
// is still one browser's view; two phones need server.py.
const STORE = "sethu.ledger";

function load(): Report[] | null {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return JSON.parse(raw) as Report[];
  } catch {
    // storage off or junk; start from the seed
  }
  return null;
}

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(rows));
  } catch {
    // storage full or off; memory still has it for this page
  }
}

export function resetLocalLedger() {
  rows = null;
  try {
    localStorage.removeItem(STORE);
  } catch {
    // nothing to clear
  }
}

function ledger(): Report[] {
  if (!rows) {
    // Copy the seed so this module owns its rows. The one repair that is
    // waiting on a resident is marked as ours so that flow can be shown.
    rows = load() ?? SEED.map((r) => ({ ...r, mine: r.status === "repair_claimed" }));
  }
  return rows;
}

function stamp(r: Report, message: string): Report {
  return { ...r, history: [...(r.history ?? []), { message, at: Date.now() }] };
}

// Apply a change to one report. The change either returns the new row
// or a refusal, worded the way server.py would word it.
function patch(id: string, change: (r: Report) => Report | string): string | null {
  const list = ledger();
  const i = list.findIndex((r) => r.id === id);
  if (i < 0) return "no such report";
  const next = change(list[i]);
  if (typeof next === "string") return next;
  list[i] = next;
  save();
  return null;
}

export function localReports(): Report[] {
  return ledger().slice();
}

export function setLocalClock(hours: number) {
  clockOffset = hours;
}

export function localFile(input: {
  issue: IssueId;
  place: string | null;
}): { id: string } {
  const list = ledger();
  const id = "VYS-" + String(list.length + 1).padStart(4, "0");
  const fresh: Report = {
    id,
    location: input.place || "Location pinned",
    ageHoursAtBase: -clockOffset, // zero hours old right now
    issue: input.issue,
    status: "waiting",
    level: "gram",
    extraResidents: 0,
    reopened: 0,
    mine: true
  };
  list.unshift(stamp(fresh, "Reported by a resident"));
  save();
  return { id };
}

export function localAssign(id: string, worker: string): string | null {
  return patch(id, (r) => {
    const open =
      r.status === "waiting" ||
      r.status === "escalated_tp" ||
      r.status === "escalated_zp";
    if (!open) return "that job is not open";
    const late = derive(r, clockOffset).overdue;
    return stamp(
      { ...r, status: late ? "in_progress_late" : "assigned" },
      "Assigned to " + worker
    );
  });
}

export function localReason(
  id: string,
  label: string,
  detail: string,
  handTo?: { code: string; name: string }
): string | null {
  return patch(id, (r) => {
    if (r.status === "fixed") return "that report is already closed";
    const body = r.ownerBody ?? "gp";
    let next: Report = {
      ...r,
      reason: { headline: label, detail },
      reasons: [...(r.reasons ?? []), { headline: label, detail, body, at: Date.now() }]
    };
    let message = "Gave a reason: " + label;

    // Handing a report on changes who owns it and nothing else.
    if (handTo) {
      if (handTo.code === body) return "that is the department it is already with";
      next = {
        ...next,
        ownerBody: handTo.code,
        department: handTo.code === "gp" ? undefined : handTo.name
      };
      message = "Handed to " + handTo.name + ". The deadline did not restart.";
    }
    return stamp(next, message);
  });
}

export function localClaimRepair(
  id: string,
  noPhotoReason = "",
  photo: string | null = null
): string | null {
  return patch(id, (r) => {
    if (r.status === "fixed") return "that report is already closed";
    if (r.status === "repair_claimed") return "this one is already waiting on the resident";
    if (derive(r, clockOffset).silent) {
      return "this one went past its deadline. Give the resident a reason first.";
    }
    // With no server to say who filed it, whoever is looking at the
    // claim as a resident gets to answer it. That is what a demo needs.
    const message = noPhotoReason
      ? "Staff marked this completed without a photo. Their reason: " +
        noPhotoReason.replace(/\.+$/, "") +
        ". Waiting for the resident who reported it."
      : "Staff submitted repair proof. Waiting for the resident who reported it.";
    return stamp(
      { ...r, status: "repair_claimed", mine: true, fixPhoto: photo ?? undefined },
      message
    );
  });
}

export function localConfirm(id: string, works: boolean): string | null {
  return patch(id, (r) => {
    if (r.status !== "repair_claimed") return "nothing has been claimed as repaired yet";
    if (!r.mine) return "only the resident who reported this can close it";
    if (works) {
      return stamp(
        { ...r, status: "fixed", closedByResident: true },
        "Resident confirmed the repair. Report closed."
      );
    }
    // Reopened: the deadline restarts from now, the age does not.
    return stamp(
      {
        ...r,
        status: "waiting",
        level: "gram",
        reopened: r.reopened + 1,
        sinceDeadlineStart: -clockOffset,
        reason: undefined,
        serverSilent: undefined
      },
      "Resident says it is still broken. Reopened, and the clock restarted."
    );
  });
}
