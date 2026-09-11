// Talking to server.py, and carrying on without it.
//
// The Python server owns the rules: what has escalated, who owns a
// category, whether an office has gone silent. This file translates
// its shapes into the ones the screens use. When the server is not
// there, the same calls fall through to local.ts so every button still
// does something on a laptop with no network.

import type { IssueId, Level, Report, Status } from "./data";
import {
  localAssign,
  localClaimRepair,
  localConfirm,
  localFile,
  localReason,
  localReports
} from "./local";
import { loadSession } from "./session";

const HOUR = 3_600_000;

// server.py uses the clerk's words, the UI uses the resident's.
const CATEGORY: Record<string, IssueId> = {
  power: "power",
  water: "pipeline",
  bus: "bus",
  bore: "handpump",
  waste: "garbage",
  toilet: "toilet",
  drain: "drain",
  light: "streetlight",
  road: "road"
};

export const TO_SERVER: Record<IssueId, string> = {
  power: "power",
  pipeline: "water",
  bus: "bus",
  handpump: "bore",
  garbage: "waste",
  toilet: "toilet",
  drain: "drain",
  streetlight: "light",
  road: "road"
};

const LEVELS: Level[] = ["gram", "taluk", "zilla"];

interface RawReason {
  code: string;
  label: string;
  detail: string;
  body: string;
  at: number;
}

interface RawReport {
  id: string;
  category: string;
  place?: string | null;
  status: "open" | "assigned" | "awaiting" | "resolved";
  created_at: number;
  deadline_from: number;
  deadline: number;
  level: number;
  voices: number;
  reopened: number;
  owner_body?: string;
  owner?: string;
  silent?: boolean;
  reasons?: RawReason[];
  history?: { message: string; at: number }[];
  reporter_hash?: string;
}

interface RawPayload {
  now: number;
  reports: RawReport[];
  rules?: {
    reasons?: Record<string, string>;
    bodies?: Record<string, { name: string; officer: string; reach: string }>;
  };
}

// The server ships its rule tables with the data. These are the
// defaults for a demo with no server.
export let REASON_CODES: Record<string, string> = {
  no_funds: "No funds until the Gram Sabha approves this work",
  not_our_asset: "This asset belongs to another department",
  awaiting_material: "Waiting for material or a spare part",
  work_ordered: "Work order issued, contractor scheduled",
  no_staff: "No staff available for this trade",
  needs_sanction: "Needs technical sanction above the Panchayat's limit"
};

export let BODY_NAMES: Record<string, string> = {
  gp: "Gram Panchayat",
  escom: "CESC Mysuru",
  rdwsd: "Rural Drinking Water & Sanitation Dept",
  pred: "Panchayat Raj Engineering Division",
  pwd: "Public Works Department",
  edu: "Education Department",
  ksrtc: "KSRTC"
};

export interface Live {
  reports: Report[];
  online: boolean; // true when the figures came from server.py
}

// Set by loadReports. Actions look at it to decide server or local.
let serverUp = false;

function statusOf(raw: RawReport): Status {
  if (raw.status === "resolved") return "fixed";
  if (raw.status === "awaiting") return "repair_claimed";
  if (raw.status === "assigned") return raw.level > 0 ? "in_progress_late" : "assigned";
  if (raw.level >= 2) return "escalated_zp";
  if (raw.level === 1) return "escalated_tp";
  return "waiting";
}

function convert(raw: RawReport, now: number, myHash: string): Report {
  const last = raw.reasons?.length ? raw.reasons[raw.reasons.length - 1] : null;

  return {
    id: raw.id,
    location: raw.place || "Location pinned",
    ageHoursAtBase: (now - raw.created_at) / HOUR,
    sinceDeadlineStart: (now - raw.deadline_from) / HOUR,
    issue: CATEGORY[raw.category] ?? "streetlight",
    status: statusOf(raw),
    level: LEVELS[Math.min(2, Math.max(0, raw.level))],
    extraResidents: Math.max(0, raw.voices - 1),
    reopened: raw.reopened,
    department: raw.owner_body && raw.owner_body !== "gp" ? raw.owner : undefined,
    reason: last ? { headline: last.label, detail: last.detail } : undefined,
    closedByResident: raw.status === "resolved",
    serverSilent: raw.silent,
    reasons: raw.reasons?.map((r) => ({
      headline: r.label,
      detail: r.detail,
      body: r.body,
      at: r.at
    })),
    history: raw.history,
    ownerBody: raw.owner_body,
    // The server only ever sends the hash of the reporter's token, so
    // it has to be compared with the hash of ours, not the token itself.
    mine: Boolean(myHash) && raw.reporter_hash === myHash
  };
}

// Who is filing. The signed-in phone number is the identity, so the
// same person can close their report from any phone. Before the login
// screen this was a random token per browser; that stays as the
// fallback so nothing filed earlier becomes unclosable.
export function deviceToken(): string {
  const session = loadSession();
  if (session) return "phone-" + session.phone;
  try {
    let t = localStorage.getItem("sethu.token");
    if (!t) {
      t = "tok-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("sethu.token", t);
    }
    return t;
  } catch {
    return "tok-anonymous";
  }
}

// Same digest server.py uses (hashlib.sha256(token).hexdigest()).
let hashedToken = "";
let hashedFor = "";

async function myTokenHash(): Promise<string> {
  const token = deviceToken();
  if (token === hashedFor) return hashedToken;
  try {
    const bytes = new TextEncoder().encode(token);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    hashedToken = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Plain http on a LAN has no WebCrypto. Nothing reads as "mine"
    // then, and the server still checks the token on its own side.
    hashedToken = "";
  }
  hashedFor = token;
  return hashedToken;
}

async function ask<T>(path: string, body?: unknown): Promise<T> {
  const control = new AbortController();
  const timer = window.setTimeout(() => control.abort(), 2500);
  try {
    const response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: control.signal
    });
    if (!response.ok) throw new Error(String(response.status));
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function loadReports(): Promise<Live> {
  try {
    const payload = await ask<RawPayload>("/api/reports");
    if (payload.rules?.reasons) REASON_CODES = payload.rules.reasons;
    if (payload.rules?.bodies) {
      BODY_NAMES = Object.fromEntries(
        Object.entries(payload.rules.bodies).map(([k, v]) => [k, v.name])
      );
    }
    const me = await myTokenHash();
    serverUp = true;
    return {
      reports: payload.reports.map((r) => convert(r, payload.now, me)),
      online: true
    };
  } catch {
    serverUp = false;
    return { reports: localReports(), online: false };
  }
}

// The demo clock belongs to the server when there is one.
export async function shiftClock(hours: number): Promise<boolean> {
  try {
    await ask("/api/clock", { hours });
    return true;
  } catch {
    return false;
  }
}

export async function resetClock(): Promise<boolean> {
  try {
    await ask("/api/clock", { reset: true });
    return true;
  } catch {
    return false;
  }
}

export async function fileReport(input: {
  issue: IssueId;
  note: string;
  lat: number | null;
  lng: number | null;
  place: string | null;
  placeKind: string | null;
  token: string;
  photo?: string;
}): Promise<{ id: string; duplicate?: boolean } | null> {
  if (!serverUp) return localFile({ issue: input.issue, place: input.place });
  try {
    return await ask("/api/report", {
      category: TO_SERVER[input.issue],
      note: input.note,
      lat: input.lat,
      lng: input.lng,
      place: input.place,
      place_kind: input.placeKind,
      token: input.token,
      photo: input.photo
    });
  } catch {
    return null;
  }
}

// ---- what a person can do to a report after it is filed ----
//
// Each one returns null when it went through, or the server's own
// error sentence when it did not. The rules (a reason cannot buy time,
// only the reporter can close) live on the server; local.ts mirrors
// them for the no-server demo.

async function act(path: string, body: unknown): Promise<string | null> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const answer = await response.json().catch(() => ({}));
    if (response.ok) return null;
    return answer.error || "That did not go through.";
  } catch {
    return "No connection to the Panchayat server.";
  }
}

export async function assignReport(id: string, worker: string) {
  if (!serverUp) return localAssign(id, worker);
  return act("/api/assign", { id, worker });
}

export async function giveReason(id: string, code: string, detail: string, to?: string) {
  if (!serverUp) {
    const handTo =
      code === "not_our_asset" ? (to ? { code: to, name: BODY_NAMES[to] ?? to } : null) : undefined;
    if (handTo === null) return "say which department it belongs to";
    return localReason(id, REASON_CODES[code] ?? code, detail, handTo);
  }
  return act("/api/reason", { id, code, detail, to });
}

// A claim carries a photo, or a sentence saying why there is none.
export async function claimRepair(id: string, photo: string | null, noPhotoReason = "") {
  if (!serverUp) return localClaimRepair(id, noPhotoReason);
  return act("/api/repaired", { id, photo, no_photo_reason: noPhotoReason });
}

export async function confirmFix(id: string, works: boolean) {
  if (!serverUp) return localConfirm(id, works);
  return act("/api/confirm", { id, works, token: deviceToken() });
}
