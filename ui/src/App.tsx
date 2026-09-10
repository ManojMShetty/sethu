import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Entry from "./components/Entry";
import ReportForm from "./components/ReportForm";
import VoiceBubble from "./components/VoiceBubble";
import { deskOrder, ledgerOrder, tally, type Report } from "./data";
import { loadReports, resetClock, shiftClock } from "./api";

type Tab = "report" | "ledger" | "desk";

const TABS: { id: Tab; label: string; kn: string }[] = [
  { id: "report", label: "Report", kn: "ದೂರು" },
  { id: "ledger", label: "Ledger", kn: "ದಾಖಲೆ" },
  { id: "desk", label: "Desk", kn: "ಮೇಜು" }
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

  const [kannada, setKannada] = useState(false);
  const [staff, setStaff] = useState(false);
  const [note, setNote] = useState("");
  const [speakSignal, setSpeakSignal] = useState(0);

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
        kannada={kannada}
        onToggleKannada={() => setKannada((v) => !v)}
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
            onFiled={refresh}
            onSpeak={() => setSpeakSignal((n) => n + 1)}
          />
        )}

        {tab === "ledger" && (
          <div className="mx-auto max-w-2xl">
            <div className="px-4 pt-5 pb-3">
              <h2 className="display text-[24px] leading-tight font-semibold">
                Public ledger
              </h2>
              <p className="mt-1 max-w-[62ch] text-[13.5px] text-ink2">
                Every report in this Panchayat, newest first, with its deadline
                running in the open. Nothing here is hidden from the people who
                filed it.
              </p>
            </div>
            <Rows reports={ledger} offset={offset} kannada={kannada} loading={loading} />
          </div>
        )}

        {tab === "desk" && (
          <div className="mx-auto max-w-2xl">
            <div className="px-4 pt-5 pb-3">
              <h2 className="display text-[24px] leading-tight font-semibold">
                Panchayat desk
              </h2>
              <p className="mt-1 max-w-[62ch] text-[13.5px] text-ink2">
                Sorted by what breaches soonest, not by date. A job closes only
                when the resident who reported it confirms.
              </p>
              {stats.silent > 0 && (
                <p className="micro mt-3 inline-block bg-critwash px-2 py-1.5 text-crit">
                  {stats.silent} past deadline with nothing said
                </p>
              )}
            </div>
            <Rows reports={desk} offset={offset} kannada={kannada} loading={loading} />
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface">
        <div className="mx-auto flex w-full max-w-2xl">
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={on ? "page" : undefined}
                className={`flex-1 border-t-[3px] px-2 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-[14px] font-semibold transition ${
                  on
                    ? "border-teal text-ink"
                    : "border-transparent text-ink3 hover:text-ink2"
                }`}
              >
                {kannada ? t.kn : t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <VoiceBubble
        kannada={kannada}
        openSignal={speakSignal}
        onText={(text) => {
          setNote((n) => (n ? `${n.trim()} ${text}` : text));
          setTab("report");
        }}
      />
    </div>
  );
}

function Rows({
  reports,
  offset,
  kannada,
  loading
}: {
  reports: Report[];
  offset: number;
  kannada: boolean;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-px border-y border-rulesoft">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[118px] animate-pulse bg-surface" />
        ))}
      </div>
    );
  }
  if (reports.length === 0) {
    return (
      <p className="mx-4 my-6 border border-dashed border-rule px-4 py-10 text-center text-[14px] text-ink3">
        No reports yet. The first one starts the ledger.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-px border-y border-rulesoft">
      {reports.map((r, i) => (
        <Entry key={r.id} report={r} offset={offset} kannada={kannada} index={i} />
      ))}
    </div>
  );
}
