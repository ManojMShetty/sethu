/* ------------------------------------------------------------------
   The rules the whole product rests on, in one file.

   Two numbers decide everything on screen: how many hours a category
   gets, and how many hours have passed. Nobody approves an escalation
   and nobody can pause a clock, which is the entire point.
   ------------------------------------------------------------------ */

export type IssueId =
  | "power"
  | "pipeline"
  | "bus"
  | "handpump"
  | "garbage"
  | "toilet"
  | "drain"
  | "streetlight"
  | "road";

export type Status =
  | "waiting"
  | "assigned"
  | "repair_claimed"
  | "in_progress_late"
  | "escalated_tp"
  | "escalated_zp"
  | "fixed";

export type Level = "gram" | "taluk" | "zilla";

export interface Issue {
  id: IssueId;
  name: string;
  kannada: string;
  sla: number;
  why: string;
}

export interface Report {
  id: string;
  location: string;
  ageHoursAtBase: number;
  /** Hours since the deadline last restarted. Only differs from
      ageHoursAtBase on a report a resident reopened. */
  sinceDeadlineStart?: number;
  issue: IssueId;
  status: Status;
  level: Level;
  extraResidents: number;
  reopened: number;
  department?: string;
  /** What the office has posted. Null means nobody has explained. */
  reason?: { headline: string; detail: string };
  closedByResident?: boolean;
  /** Set only by the server, which is the authority on this. */
  serverSilent?: boolean;

  /* Everything below comes from the server. Offline seed rows leave it
     empty, which is honest: there is no ledger without a server. */

  /** Every reason ever posted on this report, oldest first. */
  reasons?: { headline: string; detail: string; body: string; at: number }[];
  /** The public trail: filed, assigned, escalated, explained, closed. */
  history?: { message: string; at: number }[];
  /** Whose desk it is on now, as a body code the actions need. */
  ownerBody?: string;
  /** True when this device is the one that filed it. Only that device
      can close it, and the server enforces that regardless. */
  mine?: boolean;
}

/* The hours are not invented. A live wire is the shortest because it
   can kill someone tonight; a road hole gets a week because filling
   one needs material and a contractor, and a deadline nobody can meet
   is a deadline everybody learns to ignore. */
export const ISSUES: Issue[] = [
  { id: "power", name: "Power line", kannada: "ವಿದ್ಯುತ್ ತಂತಿ", sla: 12, why: "live wire" },
  { id: "pipeline", name: "Dry pipeline", kannada: "ನಳದಲ್ಲಿ ನೀರಿಲ್ಲ", sla: 24, why: "no water at the tap" },
  { id: "bus", name: "Bus never came", kannada: "ಬಸ್ ಬರಲಿಲ್ಲ", sla: 24, why: "no way out of here" },
  { id: "handpump", name: "Hand pump", kannada: "ಕೈಪಂಪು", sla: 24, why: "only source" },
  { id: "garbage", name: "Garbage", kannada: "ಕಸ", sla: 24, why: "health risk" },
  { id: "toilet", name: "Toilet", kannada: "ಶೌಚಾಲಯ", sla: 48, why: "sanitation" },
  { id: "drain", name: "Drain", kannada: "ಚರಂಡಿ", sla: 48, why: "standing water" },
  { id: "streetlight", name: "Streetlight", kannada: "ಬೀದಿ ದೀಪ", sla: 72, why: "unlit at night" },
  { id: "road", name: "Road hole", kannada: "ರಸ್ತೆ ಗುಂಡಿ", sla: 168, why: "slower to fix" }
];

export const issueOf = (id: IssueId): Issue =>
  ISSUES.find((i) => i.id === id) ?? ISSUES[0];

export const LEVEL_NAME: Record<Level, string> = {
  gram: "Gram Panchayat",
  taluk: "Taluk Panchayat",
  zilla: "Zilla Panchayat"
};

export const STATUS_NAME: Record<Status, string> = {
  waiting: "Waiting to be assigned",
  assigned: "Assigned to staff",
  repair_claimed: "Repair claimed, waiting for the resident",
  in_progress_late: "In progress, past deadline",
  escalated_tp: "Escalated to Taluk Panchayat",
  escalated_zp: "Escalated to Zilla Panchayat",
  fixed: "Fixed, confirmed by the resident"
};

/* Vyasarajapura, T. Narasipura taluk, Mysuru district. Ages are hours
   old at clock offset 0, so the demo clock is the only thing that
   moves and every figure on screen derives from it. */
export const SEED: Report[] = [
  {
    id: "VYS-0001",
    location: "Overhead tank",
    ageHoursAtBase: 62,
    issue: "pipeline",
    status: "escalated_zp",
    level: "zilla",
    extraResidents: 1,
    reopened: 2,
    reason: {
      headline: "No funds until the Gram Sabha approves this work",
      detail: "Tabled for the October Gram Sabha"
    }
  },
  {
    id: "VYS-0002",
    location: "Transformer, Somanathapura road",
    ageHoursAtBase: 31,
    issue: "power",
    status: "escalated_zp",
    level: "zilla",
    extraResidents: 2,
    reopened: 0,
    department: "CESC Mysuru"
  },
  {
    id: "VYS-0003",
    location: "Bus stop, Sosale road",
    ageHoursAtBase: 40,
    issue: "bus",
    status: "in_progress_late",
    level: "taluk",
    extraResidents: 3,
    reopened: 0,
    department: "KSRTC",
    reason: {
      headline: "This asset belongs to another department",
      detail: "Route and timings are the depot's, not ours"
    }
  },
  {
    id: "VYS-0004",
    location: "Borewell, north colony",
    ageHoursAtBase: 19,
    issue: "handpump",
    status: "repair_claimed",
    level: "gram",
    extraResidents: 4,
    reopened: 0
  },
  {
    id: "VYS-0005",
    location: "Ration shop",
    ageHoursAtBase: 54,
    issue: "drain",
    status: "escalated_tp",
    level: "taluk",
    extraResidents: 0,
    reopened: 0,
    reason: {
      headline: "Waiting for material or a spare part",
      detail: "Desilting rods ordered from the taluk store"
    }
  },
  {
    id: "VYS-0006",
    location: "Government school",
    ageHoursAtBase: 9,
    issue: "garbage",
    status: "waiting",
    level: "gram",
    extraResidents: 1,
    reopened: 0
  },
  {
    id: "VYS-0007",
    location: "Government school",
    ageHoursAtBase: 61,
    issue: "toilet",
    status: "escalated_tp",
    level: "taluk",
    extraResidents: 2,
    reopened: 0,
    department: "Education Department"
  },
  {
    id: "VYS-0008",
    location: "Anganwadi centre",
    ageHoursAtBase: 11,
    issue: "toilet",
    status: "assigned",
    level: "gram",
    extraResidents: 3,
    reopened: 0,
    department: "Education Department"
  },
  {
    id: "VYS-0009",
    location: "Temple junction",
    ageHoursAtBase: 26,
    issue: "road",
    status: "waiting",
    level: "gram",
    extraResidents: 4,
    reopened: 0,
    reason: {
      headline: "Needs technical sanction above the Panchayat's limit",
      detail: "Estimate above our limit, sent to the PRED"
    }
  },
  {
    id: "VYS-0010",
    location: "Health sub-centre",
    ageHoursAtBase: 6,
    issue: "streetlight",
    status: "waiting",
    level: "gram",
    extraResidents: 0,
    reopened: 0
  },
  {
    id: "VYS-0011",
    location: "Gram Panchayat office",
    ageHoursAtBase: 3,
    issue: "pipeline",
    status: "waiting",
    level: "gram",
    extraResidents: 1,
    reopened: 0
  },
  {
    id: "VYS-0012",
    location: "Bus stop, Sosale road",
    ageHoursAtBase: 72,
    issue: "streetlight",
    status: "fixed",
    level: "gram",
    extraResidents: 2,
    reopened: 0,
    closedByResident: true
  },
  {
    id: "VYS-0013",
    location: "Overhead tank",
    ageHoursAtBase: 96,
    issue: "drain",
    status: "fixed",
    level: "gram",
    extraResidents: 3,
    reopened: 1,
    closedByResident: true
  }
];

/* ---------------------------------------------------------- the maths */

export interface Derived {
  age: number;
  sla: number;
  hoursLeft: number;
  elapsedRatio: number;
  overdue: boolean;
  /** Past its deadline and nobody has posted a reason. */
  silent: boolean;
  tone: "ok" | "late" | "crit";
}

export function derive(report: Report, offset: number): Derived {
  const sla = issueOf(report.issue).sla;
  const age = report.ageHoursAtBase + offset;
  const elapsed = (report.sinceDeadlineStart ?? report.ageHoursAtBase) + offset;
  const hoursLeft = sla - elapsed;
  const done = report.status === "fixed";
  const overdue = !done && hoursLeft < 0;

  const tone: Derived["tone"] = done
    ? "ok"
    : hoursLeft < 0
      ? "crit"
      : elapsed / sla >= 0.8
        ? "late"
        : "ok";

  return {
    age,
    sla,
    hoursLeft,
    elapsedRatio: Math.max(0, Math.min(1, elapsed / sla)),
    overdue,
    silent: report.serverSilent ?? (overdue && !report.reason),
    tone
  };
}

export interface Stats {
  open: number;
  late: number;
  fixed: number;
  rejected: number;
  silent: number;
}

export function tally(reports: Report[], offset: number): Stats {
  let open = 0,
    late = 0,
    fixed = 0,
    rejected = 0,
    silent = 0;

  for (const r of reports) {
    const d = derive(r, offset);
    if (r.status === "fixed") {
      if (r.closedByResident) fixed++;
    } else {
      open++;
      if (d.overdue) late++;
      if (d.silent) silent++;
    }
    rejected += r.reopened;
  }
  return { open, late, fixed, rejected, silent };
}

/* The desk is sorted by what breaches soonest, not by date. Anything
   already past its deadline comes first, most overdue at the top. */
export function deskOrder(reports: Report[], offset: number): Report[] {
  return reports
    .filter((r) => r.status !== "fixed")
    .slice()
    .sort((a, b) => derive(a, offset).hoursLeft - derive(b, offset).hoursLeft);
}

export function ledgerOrder(reports: Report[]): Report[] {
  return reports.slice().sort((a, b) => a.ageHoursAtBase - b.ageHoursAtBase);
}
