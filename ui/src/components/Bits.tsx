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
