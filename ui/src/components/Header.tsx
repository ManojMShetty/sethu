import { useEffect, useState } from "react";
import type { Stats } from "../data";
import { useT, type Lang } from "../i18n";
import {
  CheckIcon,
  ClockIcon,
  MenuIcon,
  OpenIcon,
  RejectIcon,
  SilentIcon
} from "./Bits";

interface Props {
  stats: Stats;
  offset: number;
  online: boolean;
  onShift: (hours: number) => void;
  onReset: () => void;
  lang: Lang;
  onLang: (next: Lang) => void;
  staff: boolean;
  onToggleRole: () => void;
}

/* The five figures are the argument the app makes, so they sit above
   everything and recalculate the moment the clock moves. Everything
   else that used to live up here — who you are, what the demo clock is
   doing, whether a server answered — is machinery, and machinery goes
   behind the menu. */
const CELLS = [
  { key: "open", Icon: OpenIcon, short: "Open", full: "open" },
  { key: "late", Icon: ClockIcon, short: "Late", full: "past deadline" },
  { key: "fixed", Icon: CheckIcon, short: "Fixed", full: "fixed and verified" },
  { key: "rejected", Icon: RejectIcon, short: "Rejected", full: "repairs rejected" },
  { key: "silent", Icon: SilentIcon, short: "Silent", full: "late, no reason given" }
] as const;

const TONE: Record<string, string> = {
  late: "text-late",
  silent: "text-crit"
};

export default function Header({
  stats,
  offset,
  online,
  onShift,
  onReset,
  lang,
  onLang,
  staff,
  onToggleRole
}: Props) {
  const { t } = useT();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const chip =
    "micro border border-brandink/25 px-2.5 py-1.5 transition hover:border-brandink/60";

  return (
    <header className="sticky top-0 z-30 text-brandink">
      <div className="relative z-30 bg-brand">
        <div className="mx-auto w-full max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h1 lang="en" className="display text-[25px] leading-none font-semibold">
              Sethu
            </h1>

            <div className="flex items-center gap-2">
              {/* Both languages stay on screen. A toggle that shows only
                  the other one asks the person who cannot read the
                  current language to guess what the button does. */}
              <div className="flex overflow-hidden rounded-full border border-brandink/25">
                {(["kn", "en"] as Lang[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => onLang(code)}
                    aria-pressed={lang === code}
                    lang={code}
                    className={`micro px-2.5 py-1 transition ${
                      lang === code
                        ? "bg-brandink text-brand"
                        : "text-brandink/70 hover:text-brandink"
                    }`}
                  >
                    {code === "kn" ? "ಕನ್ನಡ" : "EN"}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setMenu((v) => !v)}
                aria-expanded={menu}
                aria-label={t("Menu")}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brandink/25 text-brandink transition hover:border-brandink/60"
              >
                <MenuIcon size={17} />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-1">
            {CELLS.map(({ key, Icon, short, full }) => (
              <div
                key={key}
                className="flex flex-col items-center gap-0.5"
                title={t(full)}
              >
                <span className={`flex items-center gap-1 ${TONE[key] ?? "text-brandink/55"}`}>
                  <Icon size={13} />
                </span>
                <span
                  lang="en"
                  className={`display figure text-[24px] leading-none font-semibold ${
                    TONE[key] ?? "text-brandink"
                  }`}
                >
                  {stats[key as keyof Stats]}
                </span>
                <span className="micro text-center leading-tight text-brandink/60">
                  {t(short)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {menu && (
        <>
          <button
            className="fixed inset-0 z-20 cursor-default bg-ink/35"
            aria-label={t("Close")}
            onClick={() => setMenu(false)}
          />
          {/* Stage machinery, and we say so on it rather than hiding it. */}
          <div className="rise absolute inset-x-0 top-full z-30 border-t border-brandink/20 bg-brand">
            <div className="mx-auto w-full max-w-2xl px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] text-brandink/70">
                  {t("Gram Panchayat asset ledger")}
                </p>
                <span
                  className="micro inline-flex shrink-0 items-center gap-1.5 text-brandink/70"
                  title={t(
                    online
                      ? "Reading the live ledger from server.py"
                      : "No server reachable. Showing the seed ledger."
                  )}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-ok" : "bg-late"}`} />
                  {t(online ? "server" : "offline")}
                </span>
              </div>

              <p className="micro mt-4 mb-1.5 text-brandink/50">{t("Role")}</p>
              <div className="flex gap-1.5">
                {[false, true].map((asStaff) => (
                  <button
                    key={String(asStaff)}
                    onClick={() => staff !== asStaff && onToggleRole()}
                    aria-pressed={staff === asStaff}
                    className={`${chip} ${
                      staff === asStaff ? "bg-brandink text-brand" : "text-brandink/80"
                    }`}
                  >
                    {t(asStaff ? "Panchayat staff" : "Resident")}
                  </button>
                ))}
              </div>

              <div className="mt-4 mb-1.5 flex items-baseline justify-between">
                <p className="micro text-brandink/50">{t("Demo clock")}</p>
                {offset > 0 && (
                  <span lang="en" className="micro figure text-brandink/60">
                    +{offset}h {t("simulated")}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <button className={`${chip} text-brandink/80`} onClick={() => onShift(1)}>
                  {t("+1 hour")}
                </button>
                <button className={`${chip} text-brandink/80`} onClick={() => onShift(24)}>
                  {t("+24 hours")}
                </button>
                <button
                  className="micro px-2 py-1.5 text-brandink/55 transition hover:text-brandink"
                  onClick={onReset}
                >
                  {t("reset")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
