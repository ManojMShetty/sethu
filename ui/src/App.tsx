import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Entry from "./components/Entry";
import ReportForm, { type Filed } from "./components/ReportForm";
import VoiceBubble from "./components/VoiceBubble";
import { deskOrder, ledgerOrder, tally, type Report } from "./data";
import { loadReports, resetClock, shiftClock } from "./api";
import { useT } from "./i18n";
import { DeskIcon, LedgerIcon, ReportIcon } from "./components/Bits";

type Tab = "report" | "ledger" | "desk";

const TABS: { id: Tab; label: string; Icon: (p: { size?: number }) => React.ReactElement }[] = [
  { id: "report", label: "Report", Icon: ReportIcon },
  { id: "ledger", label: "Ledger", Icon: LedgerIcon },
  { id: "desk", label: "Desk", Icon: DeskIcon }
];

export default function App() {
  const [tab, setTab] = useState<Tab>("ledger");
  const [reports, setReports] = useState<Report[]>([]);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  /* Two clocks, one control. With a server the offset lives there, so
     every device watching the projector moves together and the figures
     agree. Without one it lives here, so the demo still works on a
     laptop with no network. */
  const [offset, setOffset] = useState(0);

  const { lang, setLang, t } = useT();
  const [staff, setStaff] = useState(false);
  const [note, setNote] = useState("");
  const [speakSignal, setSpeakSignal] = useState(0);

  /* What a filed report leaves behind. It is shown at the top of the
     ledger rather than on a screen of its own, because the number only
     means something next to the row it created. */
  const [filed, setFiled] = useState<Filed | null>(null);

  const refresh = useCallback(async () => {
    const live = await loadReports();
    setReports(live.reports);
    setOnline(live.online);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // The ledger is a live document. Poll rather than making people
    // pull to refresh, which nobody does on a projector.
    const timer = window.setInterval(refresh, 12000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function shift(hours: number) {
    if (online && (await shiftClock(hours))) {
      await refresh();
      return;
    }
    setOffset((o) => o + hours);
  }

  async function reset() {
    if (online && (await resetClock())) {
      await refresh();
      return;
    }
    setOffset(0);
  }

  const stats = useMemo(() => tally(reports, offset), [reports, offset]);
  const ledger = useMemo(() => ledgerOrder(reports), [reports]);
  const desk = useMemo(() => deskOrder(reports, offset), [reports, offset]);

  const nextId = `VYS-${String(reports.length + 1).padStart(4, "0")}`;

  return (
    <div className="flex min-h-full flex-col bg-ground">
      <Header
        stats={stats}
        offset={offset}
        online={online}
        onShift={shift}
        onReset={reset}
        lang={lang}
        onLang={setLang}
        staff={staff}
        onToggleRole={() => setStaff((v) => !v)}
      />

      <main className="flex-1 pb-24">
        {tab === "report" && (
          <ReportForm
            nextId={nextId}
            note={note}
            onNote={setNote}
            online={online}
            onFiled={(receipt) => {
              setFiled(receipt);
              setTab("ledger");
              refresh();
            }}
            onSpeak={() => setSpeakSignal((n) => n + 1)}
          />
        )}

        {tab === "ledger" && (
          <div className="mx-auto max-w-2xl">
            <div className="px-4 pt-5 pb-3">
              <h2 className="display text-[25px] leading-tight">{t("Public ledger")}</h2>
              <p className="mt-1 max-w-[62ch] text-[13.5px] text-ink2">
                {t(
                  "Every report in this Panchayat, newest first, with its deadline running in the open. Nothing here is hidden from the people who filed it."
                )}
              </p>
            </div>
            {filed && <Receipt filed={filed} onClose={() => setFiled(null)} />}
            <Rows reports={ledger} offset={offset} loading={loading} />
          </div>
        )}

        {tab === "desk" && (
          <div className="mx-auto max-w-2xl">
            <div className="px-4 pt-5 pb-3">
              <h2 className="display text-[25px] leading-tight">{t("Panchayat desk")}</h2>
              <p className="mt-1 max-w-[62ch] text-[13.5px] text-ink2">
                {t(
                  "Sorted by what breaches soonest, not by date. A job closes only when the resident who reported it confirms."
                )}
              </p>
              {stats.silent > 0 && (
                <p className="micro mt-3 inline-flex items-center rounded-full bg-critwash px-3 py-1.5 text-crit">
                  {stats.silent} {t("past deadline with nothing said")}
                </p>
              )}
            </div>
            <Rows reports={desk} offset={offset} loading={loading} />
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 h-[var(--nav-h)] border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex h-full w-full max-w-2xl">
          {TABS.map(({ id, label, Icon }) => {
            const on = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                aria-current={on ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11.5px] font-semibold transition ${
                  on ? "text-teal" : "text-ink3 hover:text-ink2"
                }`}
              >
                <Icon size={21} />
                {t(label)}
              </button>
            );
          })}
        </div>
      </nav>

      <VoiceBubble
        openSignal={speakSignal}
        onText={(text) => {
          setNote((n) => (n ? `${n.trim()} ${text}` : text));
          setTab("report");
        }}
      />
    </div>
  );
}

/* The one thing a person walks away with. It carries the number they
   would quote at the Panchayat office and the sentence that explains
   what the number now does on its own. */
function Receipt({ filed, onClose }: { filed: Filed; onClose: () => void }) {
  const { t } = useT();

  return (
    <div className="rise card mx-4 mt-1 mb-3 border-t-[3px] border-ok px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="micro text-ok">
          {t(filed.merged ? "Added to a report already open" : "Report filed")}
        </p>
        <button className="micro text-stamp" onClick={onClose}>
          {t("Close")}
        </button>
      </div>
      <p lang="en" className="display figure mt-1 text-[30px] leading-none">
        {filed.id}
      </p>
      <p className="mt-2 max-w-[46ch] text-[13.5px] text-ink2">
        {t(
          filed.merged
            ? "Someone nearby had already reported this. Yours was added to theirs, which carries more weight than a separate one."
            : "The clock started the moment you sent this. It runs whether or not anyone opens it, and only you can close it."
        )}
      </p>
    </div>
  );
}

function Rows({
  reports,
  offset,
  loading
}: {
  reports: Report[];
  offset: number;
  loading: boolean;
}) {
  const { t } = useT();

  if (loading) {
    return (
      <div className="flex flex-col gap-3 px-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-[136px] animate-pulse" />
        ))}
      </div>
    );
  }
  if (reports.length === 0) {
    return (
      <p className="mx-4 my-6 rounded-[var(--r-card)] border border-dashed border-rule px-4 py-10 text-center text-[14px] text-ink3">
        {t("No reports yet. The first one starts the ledger.")}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3 px-4">
      {reports.map((r, i) => (
        <Entry key={r.id} report={r} offset={offset} index={i} />
      ))}
    </div>
  );
}
