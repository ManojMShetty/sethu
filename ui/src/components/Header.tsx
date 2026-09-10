import { useState } from "react";
import type { Stats } from "../data";

interface Props {
  stats: Stats;
  offset: number;
  online: boolean;
  onShift: (hours: number) => void;
  onReset: () => void;
  kannada: boolean;
  onToggleKannada: () => void;
  staff: boolean;
  onToggleRole: () => void;
}

/* The five figures are the argument the app makes, so they sit above
   everything and recalculate the moment the clock moves. "Late, no
   reason given" is last because it is the one nobody else counts. */
function StatCell({
  n,
  label,
  tone
}: {
  n: number;
  label: string;
  tone?: "crit" | "late";
}) {
  const colour =
    tone === "crit" ? "text-crit" : tone === "late" ? "text-late" : "text-brandink";
  return (
    <div className="flex shrink-0 flex-col gap-0.5 pr-6 last:pr-0">
      <span className={`display figure text-[27px] leading-none font-semibold ${colour}`}>
        {n}
      </span>
      <span className="micro whitespace-nowrap text-brandink/65">{label}</span>
    </div>
  );
}

export default function Header({
  stats,
  offset,
  online,
  onShift,
  onReset,
  kannada,
  onToggleKannada,
  staff,
  onToggleRole
}: Props) {
  const [clockOpen, setClockOpen] = useState(false);

  const pill =
    "micro rounded-full border border-brandink/25 px-2.5 py-1 text-brandink/85 transition hover:border-brandink/60 hover:text-brandink";

  return (
    <header className="sticky top-0 z-30 bg-brand text-brandink">
      <div className="mx-auto w-full max-w-2xl px-4 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="display text-[26px] leading-none font-semibold">Sethu</h1>
            <p className="mt-1 text-[12px] text-brandink/65">Gram Panchayat asset ledger</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <span
              className="micro inline-flex items-center gap-1.5 rounded-full border border-brandink/25 px-2.5 py-1 text-brandink/85"
              title={
                online
                  ? "Reading the live ledger from server.py"
                  : "No server reachable. Showing the seed ledger."
              }
            >
              <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-ok" : "bg-late"}`} />
              {online ? "server" : "offline"}
            </span>
            <button className={pill} onClick={onToggleKannada} aria-pressed={kannada}>
              {kannada ? "English" : "ಕನ್ನಡ"}
            </button>
            <button className={pill} onClick={onToggleRole} aria-pressed={staff}>
              {staff ? "Panchayat staff" : "Resident"}
            </button>
          </div>
        </div>

        <div className="no-bar fade-right mt-3.5 flex overflow-x-auto pb-3">
          <StatCell n={stats.open} label="open" />
          <StatCell n={stats.late} label="past deadline" tone="late" />
          <StatCell n={stats.fixed} label="fixed and verified" />
          <StatCell n={stats.rejected} label="repairs rejected" />
          <StatCell n={stats.silent} label="late, no reason given" tone="crit" />
        </div>
      </div>

      {/* Stage machinery, and we say so on it rather than hiding it. */}
      <div className="border-t border-brandink/15">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-2">
          <button
            className="micro flex items-center gap-1.5 text-brandink/70 transition hover:text-brandink"
            onClick={() => setClockOpen((v) => !v)}
            aria-expanded={clockOpen}
          >
            <span
              className="inline-block transition-transform"
              style={{ transform: clockOpen ? "rotate(90deg)" : "none" }}
            >
              ▸
            </span>
            Demo clock
          </button>

          {clockOpen && (
            <div className="flex flex-1 items-center gap-1.5">
              <button
                className="micro rounded-[3px] bg-brandink/12 px-2.5 py-1.5 transition hover:bg-brandink/22"
                onClick={() => onShift(1)}
              >
                +1 hour
              </button>
              <button
                className="micro rounded-[3px] bg-brandink/12 px-2.5 py-1.5 transition hover:bg-brandink/22"
                onClick={() => onShift(24)}
              >
                +24 hours
              </button>
              <button
                className="micro rounded-[3px] px-2 py-1.5 text-brandink/60 transition hover:text-brandink"
                onClick={onReset}
              >
                reset
              </button>
            </div>
          )}

          {offset > 0 && (
            <span className="micro figure ml-auto text-brandink/60">+{offset}h simulated</span>
          )}
        </div>
      </div>
    </header>
  );
}
