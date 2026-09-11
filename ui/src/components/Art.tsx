import type { IssueId } from "../data";

// Line sketches that give the screens something to look at besides
// text. They are SVG so they cost nothing to load, work offline, and
// take their colour from the text around them.

const sketch = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};

// The village the app is for: tank, houses, a streetlight, a hand
// pump, the bus, one tree. Sits in the header of the sign-in screen.
export function VillageScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 120"
      preserveAspectRatio="xMidYMax meet"
      className={className}
      aria-hidden="true"
      {...sketch}
    >
      {/* sun */}
      <circle cx="304" cy="26" r="11" fill="currentColor" fillOpacity="0.18" />
      <path d="M304 8v5M304 39v5M286 26h5M317 26h5M291 13l3.5 3.5M313.5 35.5l3.5 3.5M317 13l-3.5 3.5M294.5 35.5 291 39" />
      {/* birds */}
      <path d="M150 28c3-3 6-3 9 0M162 22c3-3 6-3 9 0M232 30c3-3 6-3 9 0" />
      {/* hills and ground */}
      <path d="M0 96c40-18 80-22 120-10s80 4 120-6 80-8 120 8" fill="currentColor" fillOpacity="0.08" />
      <path d="M0 104h360" />
      {/* overhead tank */}
      <rect x="28" y="36" width="34" height="22" rx="5" fill="currentColor" fillOpacity="0.12" />
      <path d="M34 58l-6 46M56 58l6 46M31 76h28M29 90h32M45 36v-6" />
      {/* houses */}
      <path d="M86 104V74l20-18 20 18v30" fill="currentColor" fillOpacity="0.1" />
      <path d="M86 74h40M101 104V88h10v16M118 66v-8h5v13" />
      <path d="M136 104V82l14-13 14 13v22" fill="currentColor" fillOpacity="0.1" />
      <path d="M136 82h28M146 104V92h8v12" />
      {/* streetlight */}
      <path d="M186 104V44c0-6 4-9 10-9h8" />
      <path d="M200 31h10l4 8h-18z" fill="currentColor" fillOpacity="0.25" />
      <path d="M205 44v6M197 46l-3 5M213 46l3 5" strokeDasharray="2 3" />
      {/* hand pump */}
      <path d="M236 104V74h10v30" fill="currentColor" fillOpacity="0.12" />
      <path d="M241 74V66l22-8M236 80h-8v8M230 96v8" />
      {/* bus */}
      <rect x="262" y="66" width="66" height="30" rx="7" fill="currentColor" fillOpacity="0.12" />
      <path d="M262 84h66M270 66v18M286 66v18M302 66v18M318 66v18" />
      <circle cx="276" cy="98" r="5" fill="currentColor" fillOpacity="0.3" />
      <circle cx="314" cy="98" r="5" fill="currentColor" fillOpacity="0.3" />
      {/* tree */}
      <path d="M344 104V82" />
      <circle cx="344" cy="70" r="13" fill="currentColor" fillOpacity="0.14" />
    </svg>
  );
}

// An open register with a pin through it, for the public ledger.
export function LedgerArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true" {...sketch}>
      <path d="M18 22h84v58H18z" fill="currentColor" fillOpacity="0.08" />
      <path d="M18 22l6-8h72l6 8M60 22v58" />
      <path d="M28 38h22M28 48h22M28 58h16M70 38h22M70 48h22M70 58h14" />
      <circle cx="60" cy="14" r="5" fill="currentColor" fillOpacity="0.3" />
      <path d="M60 19v14" />
      <path d="M86 70l6 6 12-14" strokeWidth="2.2" />
    </svg>
  );
}

// A desk with a stamp: where the office answers.
export function DeskArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true" {...sketch}>
      <path d="M10 62h100M20 62v18M100 62v18" />
      <path d="M30 62V40h44v22" fill="currentColor" fillOpacity="0.08" />
      <path d="M30 40l4-8h36l4 8M40 50h24M40 56h16" />
      <path d="M84 62V50c0-5 4-8 8-8h6c4 0 8 3 8 8v12" fill="currentColor" fillOpacity="0.14" />
      <path d="M95 42v-6h4v6" />
      <path d="M78 22c6-8 18-8 24 0" strokeDasharray="2 3" />
    </svg>
  );
}

// A streetlight lit again, with a tick: a job done.
export function RepairArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true" {...sketch}>
      <path d="M40 84V30c0-7 5-11 12-11h10" />
      <path d="M60 14h12l5 10H55z" fill="currentColor" fillOpacity="0.25" />
      <path d="M66 24v8M55 28l-4 6M77 28l4 6M66 40l0 6" strokeDasharray="2 3" />
      <path d="M28 84h24" />
      <circle cx="90" cy="60" r="16" fill="currentColor" fillOpacity="0.12" />
      <path d="M82 60l6 6 11-12" strokeWidth="2.4" />
    </svg>
  );
}

// One colour per kind of problem, so a row can be told apart at a
// glance. Kept away from the semantic colours (ok, late, crit).
export const ISSUE_TINT: Record<IssueId, string> = {
  power: "#f59e0b",
  pipeline: "#3b82f6",
  bus: "#8b5cf6",
  handpump: "#0ea5e9",
  garbage: "#22c55e",
  toilet: "#14b8a6",
  drain: "#06b6d4",
  streetlight: "#eab308",
  road: "#94a3b8"
};

export function tintStyle(id: IssueId) {
  const c = ISSUE_TINT[id];
  return { background: c + "26", color: c };
}
