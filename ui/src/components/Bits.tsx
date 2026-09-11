import type { Derived } from "../data";

/* Border, fill and weight are spent by role here rather than stamped on
   everything: a chip that names a department carries the stamp colour
   because it says who is on the hook; a chip that counts neighbours is
   quiet because it is only a number. */

export function Chip({
  children,
  tone = "quiet"
}: {
  children: React.ReactNode;
  tone?: "quiet" | "stamp" | "crit";
}) {
  const skin =
    tone === "stamp"
      ? "bg-stampwash text-stamp"
      : tone === "crit"
        ? "bg-critwash text-crit"
        : "bg-sunken text-ink2";
  // A department name is a stamp and reads like one. A count of
  // neighbours is just a number and should not shout.
  const type = tone === "stamp" ? "micro" : "micro plain";
  return (
    <span
      className={`${type} figure inline-flex items-center rounded-full px-2.5 py-1 ${skin}`}
    >
      {children}
    </span>
  );
}

const TONE_TEXT = {
  ok: "text-ok",
  late: "text-late",
  crit: "text-crit"
} as const;

const TONE_FILL = {
  ok: "bg-ok",
  late: "bg-late",
  crit: "bg-crit"
} as const;

const TONE_TRACK = {
  ok: "bg-okwash",
  late: "bg-latewash",
  crit: "bg-critwash"
} as const;

/* The loudest object on an entry, because it is the idea the whole
   product rests on: a track that fills as the clock runs out, with the
   figure it is counting sitting right on it. */
export function DeadlineBar({
  d,
  left,
  right,
  done
}: {
  d: Derived;
  left: string;
  right: string;
  done: boolean;
}) {
  const tone = done ? "ok" : d.tone;
  const width = done ? 100 : Math.round(d.elapsedRatio * 100);

  return (
    <div className="mt-3">
      <div
        className={`flex items-baseline justify-between gap-3 text-[12.5px] font-semibold ${TONE_TEXT[tone]}`}
      >
        <span className="figure">{left}</span>
        <span className="figure text-ink3">{right}</span>
      </div>
      <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${TONE_TRACK[tone]}`}>
        <div
          className={`h-full rounded-full ${TONE_FILL[tone]} transition-[width] duration-500 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/* On a ruled row the severity lived in a rail down the margin. A card
   has its own edge, so it becomes a dot beside the title instead. */
export function Rail({ tone }: { tone: "ok" | "late" | "crit" }) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${TONE_FILL[tone]}`}
      aria-hidden="true"
    />
  );
}

export function MicIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" />
      <path
        d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function CrosshairIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path
        d="M12 1.5v3.5M12 19v3.5M1.5 12h3.5M19 12h3.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* The tally strip runs on icons rather than five long labels, because
   at phone width the labels were the widest thing in the app and the
   figures are what people read anyway. Each one still carries its full
   sentence as a title and a label for anyone who needs it. */
function Glyph({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function OpenIcon({ size = 15 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M7 9.5h10M7 13.5h6.5" />
    </Glyph>
  );
}

export function ClockIcon({ size = 15 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.4l3.4 2" />
    </Glyph>
  );
}

export function CheckIcon({ size = 15 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 12.4l2.8 2.7 5.3-5.6" />
    </Glyph>
  );
}

export function RejectIcon({ size = 15 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M9.5 7.5H15a4.5 4.5 0 0 1 0 9H7" />
      <path d="M11 4.5 8 7.5l3 3" />
    </Glyph>
  );
}

export function SilentIcon({ size = 15 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M20 12.2c0 3.4-3.6 6.2-8 6.2-.8 0-1.6-.1-2.4-.3L5 19.8l1.3-3C4.9 15.6 4 14 4 12.2 4 8.8 7.6 6 12 6c1.2 0 2.3.2 3.3.6" />
      <path d="M4.5 4.5l15 15" />
    </Glyph>
  );
}

export function MenuIcon({ size = 20 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Glyph>
  );
}

export function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Glyph>
  );
}

/* One drawn mark per category. A list of nine names is a wall of text
   in either language; nine pictures is something a person can point at
   without reading, which is the whole reason they are here. */
export function IssueIcon({ id, size = 22 }: { id: string; size?: number }) {
  const art: Record<string, React.ReactNode> = {
    power: (
      <>
        <path d="M13.5 3 5.5 13.5h5.5L10 21l8.5-10.5H13z" />
      </>
    ),
    pipeline: (
      <>
        <path d="M7 4v5h6a3 3 0 0 1 3 3v1" />
        <path d="M4.5 9h5" />
        <path d="M16 18.5c0 .8-.7 1.5-1.5 1.5S13 19.3 13 18.5c0-1 1.5-2.5 1.5-2.5S16 17.5 16 18.5z" />
      </>
    ),
    bus: (
      <>
        <rect x="4" y="4" width="16" height="13" rx="2.5" />
        <path d="M4 11h16M8 4v7M16 4v7" />
        <path d="M7.5 17v2M16.5 17v2" />
      </>
    ),
    handpump: (
      <>
        <path d="M9 20V8h4l4-3v6" />
        <path d="M6.5 20h9" />
        <path d="M13 8h4" />
      </>
    ),
    garbage: (
      <>
        <path d="M5 7h14l-1 12.5a1.5 1.5 0 0 1-1.5 1.4h-9A1.5 1.5 0 0 1 6 19.5z" />
        <path d="M9.5 7V4.5h5V7M10 11v6M14 11v6" />
      </>
    ),
    toilet: (
      <>
        <path d="M5.5 4v6.5a6 6 0 0 0 6 6h.5l1.5 4" />
        <path d="M5.5 10.5h12a6 6 0 0 1-6 6" />
        <path d="M8.5 20.5h7" />
      </>
    ),
    drain: (
      <>
        <rect x="3.5" y="7" width="17" height="10" rx="2" />
        <path d="M8 7v10M12 7v10M16 7v10" />
      </>
    ),
    streetlight: (
      <>
        <path d="M12 21V9" />
        <path d="M12 9c0-3 2-5 5-5" />
        <path d="M8.5 21h7" />
        <path d="M14 9h6l-3 4z" />
      </>
    ),
    road: (
      <>
        <path d="M8 3 5 21M16 3l3 18" />
        <path d="M12 4v3M12 10.5v3M12 17v3" />
      </>
    )
  };

  return <Glyph size={size}>{art[id] ?? art.road}</Glyph>;
}

export function ReportIcon({ size = 22 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M6.5 8h2l1.2-2h4.6L15.5 8h2A2.5 2.5 0 0 1 20 10.5v6A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-6A2.5 2.5 0 0 1 6.5 8z" />
      <circle cx="12" cy="13.2" r="3" />
    </Glyph>
  );
}

export function LedgerIcon({ size = 22 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Glyph>
  );
}

export function DeskIcon({ size = 22 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M9 4.5h6v2H9z" />
      <path d="M9 5.5H6.5A1.5 1.5 0 0 0 5 7v12a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V7a1.5 1.5 0 0 0-1.5-1.5H15" />
      <path d="M8.5 12.5l2 2 4.5-4.5" />
    </Glyph>
  );
}

// A photo with a tick on it: the official's proof that a job is done.
export function ProofIcon({ size = 22 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M4 16.5V7a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 7v4.5" />
      <path d="M4 16.5l4.5-4.5 3.5 3.5 2-2" />
      <path d="M13.5 18.5l2 2 4.5-4.5" />
    </Glyph>
  );
}
