/* ------------------------------------------------------------------
   Talking to server.py, and carrying on without it.

   The Python server is where the rules actually live: it decides what
   has escalated, who owns a category, and whether an office has gone
   silent. This file translates its shapes into the ones the screen
   uses, and nothing more. Where a judgement has already been made on
   the server we take its answer rather than recomputing one.

   If the server is not there, the seed ledger loads instead and the
   demo clock runs locally. That is not a degraded mode we are hiding:
   a projector with no wifi should still show the argument.
   ------------------------------------------------------------------ */

import {
  SEED,
  type IssueId,
  type Level,
  type Report,
  type Status
} from "./data";

const HOUR = 3_600_000;

/* server.py uses the words a Panchayat clerk uses. The UI uses the
   words a resident does. Neither should have to change for the other. */
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
}

interface RawPayload {
  now: number;
  reports: RawReport[];
}

export interface Live {
  reports: Report[];
  /** True when the figures on screen came from server.py. */
  online: boolean;
}

function statusOf(raw: RawReport): Status {
  if (raw.status === "resolved") return "fixed";
  if (raw.status === "awaiting") return "repair_claimed";
  if (raw.status === "assigned")
    return raw.level > 0 ? "in_progress_late" : "assigned";
  if (raw.level >= 2) return "escalated_zp";
  if (raw.level === 1) return "escalated_tp";
  return "waiting";
}

function convert(raw: RawReport, now: number): Report {
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
    department:
      raw.owner_body && raw.owner_body !== "gp" ? raw.owner : undefined,
    reason: last ? { headline: last.label, detail: last.detail } : undefined,
    closedByResident: raw.status === "resolved",
    serverSilent: raw.silent
  };
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
    return {
      reports: payload.reports.map((r) => convert(r, payload.now)),
      online: true
    };
  } catch {
    // No server, a static host, or a dead tower. The ledger still loads.
    return { reports: SEED, online: false };
  }
}

/* The demo clock belongs to the server when there is one, so every
   device watching the projector moves together. */
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
