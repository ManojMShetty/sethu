import { useEffect, useRef, useState } from "react";
import type { Stats } from "../data";
import { useT, type Lang } from "../i18n";
import { prettyPhone, type Session } from "../session";
import {
  CheckIcon,
  ClockIcon,
  CloseIcon,
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
  session: Session;
  onSignOut: () => void;
}

// The five figures are the point of the app, so they sit at the top.
// Everything else (who you are, the demo clock, the server light) goes
// behind the menu.
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

const chip =
  "micro rounded-full bg-brandink/12 px-3.5 py-2 text-brandink/80 transition hover:bg-brandink/22";

const roundBtn =
  "flex h-9 w-9 items-center justify-center rounded-full bg-brandink/12 text-brandink transition hover:bg-brandink/22";

export default function Header({
  stats,
  offset,
  online,
  onShift,
  onReset,
  session,
  onSignOut
}: Props) {
  const { lang, setLang, t } = useT();
  const [menu, setMenu] = useState(false);

  // While the drawer is open (and until it has slid out) the header has
  // to sit above the tab bar and the mic.
  const [raised, setRaised] = useState(false);
  useEffect(() => {
    if (menu) {
      setRaised(true);
      return;
    }
    const id = window.setTimeout(() => setRaised(false), 360);
    return () => window.clearTimeout(id);
  }, [menu]);

  // Escape closes the drawer, and the page behind it does not scroll.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    const was = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = was;
    };
  }, [menu]);

  // Keyboard focus follows the drawer in and comes back to the button.
  const burger = useRef<HTMLButtonElement>(null);
  const shut = useRef<HTMLButtonElement>(null);
  const opened = useRef(false);
  useEffect(() => {
    if (menu) {
      opened.current = true;
      shut.current?.focus();
    } else if (opened.current) {
      burger.current?.focus();
    }
  }, [menu]);

  const roleLabel = session.role === "official" ? "Government official" : "Resident";

  return (
    <header className={`sticky top-0 text-brandink ${raised ? "z-[60]" : "z-30"}`}>
      <div className="relative z-10 rounded-b-[26px] bg-brand">
        <div className="mx-auto w-full max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h1 lang="en" className="display text-[26px] leading-none">
              Sethu
            </h1>

            <div className="flex items-center gap-2">
              <div className="flex overflow-hidden rounded-full bg-brandink/12 p-0.5">
                {(["kn", "en"] as Lang[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    lang={code}
                    className={`micro rounded-full px-2.5 py-1 transition ${
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
                ref={burger}
                onClick={() => setMenu((v) => !v)}
                aria-expanded={menu}
                aria-label={t("Menu")}
                className={roundBtn}
              >
                <MenuIcon size={17} />
              </button>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-5 gap-1.5">
            {CELLS.map(({ key, Icon, short, full }) => (
              <div
                key={key}
                title={t(full)}
                className="flex flex-col items-center gap-1 rounded-[14px] bg-brandsoft/55 px-1 py-2.5"
              >
                <span className={TONE[key] ?? "text-brandink/55"}>
                  <Icon size={14} />
                </span>
                <span
                  lang="en"
                  className={`display figure text-[22px] leading-none ${TONE[key] ?? "text-brandink"}`}
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

      <button
        data-open={menu}
        className="scrim fixed inset-0 z-20 cursor-default"
        aria-label={t("Close")}
        onClick={() => setMenu(false)}
      />

      <aside
        data-open={menu}
        aria-hidden={!menu}
        aria-label={t("Menu")}
        className="drawer fixed inset-y-0 right-0 z-30 flex w-[84%] max-w-[330px] flex-col rounded-l-[26px] bg-brand shadow-[var(--shadow-lift)]"
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-[calc(0.875rem+env(safe-area-inset-top))] pb-1">
          <p className="micro text-brandink/50">{t("Menu")}</p>
          <button
            ref={shut}
            onClick={() => setMenu(false)}
            aria-label={t("Close")}
            className={roundBtn}
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="no-bar flex flex-1 flex-col overflow-y-auto px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <p className="micro mb-1.5 text-brandink/50">{t("Signed in as")}</p>
          <div className="rounded-[14px] bg-brandink/12 px-3.5 py-3">
            <p className="text-[14px] font-semibold">{t(roleLabel)}</p>
            <p lang="en" className="figure mt-0.5 text-[13px] text-brandink/70">
              +91 {prettyPhone(session.phone)}
            </p>
            <button className={`${chip} mt-3`} onClick={onSignOut}>
              {t("Sign out")}
            </button>
          </div>

          <div className="mt-5 mb-1.5 flex items-baseline justify-between gap-2">
            <p className="micro text-brandink/50">{t("Demo clock")}</p>
            {offset > 0 && (
              <span lang="en" className="micro figure text-brandink/60">
                +{offset}h {t("simulated")}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button className={chip} onClick={() => onShift(1)}>
              {t("+1 hour")}
            </button>
            <button className={chip} onClick={() => onShift(24)}>
              {t("+24 hours")}
            </button>
            <button
              className="micro px-2 py-1.5 text-brandink/55 transition hover:text-brandink"
              onClick={onReset}
            >
              {t("reset")}
            </button>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-brandink/12 pt-4">
            <p className="text-[13px] leading-snug text-brandink/70">
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
        </div>
      </aside>
    </header>
  );
}
