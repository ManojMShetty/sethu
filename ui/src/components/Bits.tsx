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
    <span className={`${type} figure inline-flex items-center rounded-[2px] px-1.5 py-[3px] ${skin}`}>
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
   product rests on. It is a ruled bar rather than a rounded pill: the
   register it replaces drew straight lines. */
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
    <div className={`relative h-8 ${TONE_TRACK[tone]}`}>
      <div
        className={`absolute inset-y-0 left-0 ${TONE_FILL[tone]} opacity-[0.22] transition-[width] duration-500 ease-out`}
        style={{ width: `${width}%` }}
      />
      {!done && d.overdue && (
        <div className={`absolute inset-y-0 right-0 w-[3px] ${TONE_FILL[tone]}`} />
      )}
      <div
        className={`relative flex h-8 items-center justify-between px-3 text-[12.5px] font-semibold ${TONE_TEXT[tone]}`}
      >
        <span className="figure">{left}</span>
        <span className="figure tracking-wide">{right}</span>
      </div>
    </div>
  );
}

export function Rail({ tone }: { tone: "ok" | "late" | "crit" }) {
  return <div className={`w-[3px] shrink-0 ${TONE_FILL[tone]}`} aria-hidden="true" />;
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
