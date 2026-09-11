import { useRef, useState } from "react";
import { claimRepair } from "../api";
import { derive, deskOrder, issueOf, STATUS_NAME, type Report } from "../data";
import { deadlineText, useT } from "../i18n";
import { kbOf, shrinkPhoto } from "../photo";
import { RepairArt, tintStyle } from "./Art";
import { IssueIcon } from "./Bits";

// Where an official marks a job completed. Every open problem is
// listed; pressing Completed on one asks for a photo of the repair.
// Staff who have no photo must say why instead, and that sentence goes
// on the public record with the claim. Either way the resident who
// filed the report still has the last word.

const TONE = { ok: "text-ok", late: "text-late", crit: "text-crit" } as const;

const primaryBtn =
  "rounded-[var(--r-ctl)] bg-primary px-5 py-3 text-[15px] font-semibold text-primaryink shadow-[var(--shadow-card)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink3 disabled:shadow-none";

const quietBtn =
  "rounded-[var(--r-ctl)] border border-rule px-4 py-3 text-[15px] font-semibold text-ink2 transition hover:border-primary hover:text-primary";

export default function ProofForm({
  reports,
  offset,
  onDone
}: {
  reports: Report[];
  offset: number;
  onDone: () => void;
}) {
  const { lang, t } = useT();
  const [picked, setPicked] = useState<string | null>(null); // job being completed
  const [photo, setPhoto] = useState<{ src: string; kb: number } | null>(null);
  const [noPhoto, setNoPhoto] = useState(false);
  const [why, setWhy] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null); // id just claimed
  const fileRef = useRef<HTMLInputElement>(null);

  // Same order as the desk: whatever breaches soonest comes first.
  const open = deskOrder(reports, offset).filter((r) => r.status !== "repair_claimed");
  const waiting = reports.filter((r) => r.status === "repair_claimed");

  function start(id: string) {
    setPicked(id);
    setPhoto(null);
    setNoPhoto(false);
    setWhy("");
    setProblem(null);
    setSent(null);
  }

  function cancel() {
    setPicked(null);
    setPhoto(null);
    setNoPhoto(false);
    setWhy("");
    setProblem(null);
  }

  async function takePhoto(file: File) {
    try {
      const src = await shrinkPhoto(file);
      setPhoto({ src, kb: kbOf(src) });
      setNoPhoto(false);
      setProblem(null);
    } catch {
      setProblem(t("That file is not a photo."));
    }
  }

  const reason = why.trim();
  const canSubmit = !busy && (photo !== null || (noPhoto && reason.length > 0));

  async function submit() {
    if (!picked) return;
    if (!photo && !reason) {
      setProblem(t("Add a photo, or say why there is none."));
      return;
    }
    setBusy(true);
    const failed = await claimRepair(picked, photo?.src ?? null, photo ? "" : reason);
    setBusy(false);
    setProblem(failed);
    if (!failed) {
      const id = picked;
      cancel();
      setSent(id);
      onDone();
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-end justify-between gap-4 px-4 pt-5 pb-3">
        <div>
          <h2 className="display text-[25px] leading-tight">{t("Mark a job completed")}</h2>
          <p className="mt-1 max-w-[62ch] text-[13.5px] text-ink2">
            {t(
              "Every open problem is listed. Press Completed on the one you fixed, then add a photo of the repair. The resident who reported it is then asked to confirm."
            )}
          </p>
        </div>
        <RepairArt className="w-20 shrink-0 text-primary sm:w-24" />
      </div>

      {sent && (
        <div className="rise card mx-4 mb-3 border-t-[3px] border-ok px-4 py-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="micro text-ok">{t("Marked completed")}</p>
            <button className="micro text-stamp" onClick={() => setSent(null)}>
              {t("Close")}
            </button>
          </div>
          <p lang="en" className="display figure mt-1 text-[30px] leading-none">
            {sent}
          </p>
          <p className="mt-2 max-w-[46ch] text-[13.5px] text-ink2">
            {t("The resident who reported it has been asked to confirm. Only they can close it.")}
          </p>
        </div>
      )}

      {open.length === 0 ? (
        <p className="mx-4 my-6 rounded-[var(--r-card)] border border-dashed border-rule px-4 py-10 text-center text-[14px] text-ink3">
          {t("Nothing is open. Every report is either fixed or waiting on a resident.")}
        </p>
      ) : (
        <div className="flex flex-col gap-3 px-4">
          {open.map((r) => {
            const issue = issueOf(r.issue);
            const d = derive(r, offset);
            const active = picked === r.id;
            return (
              <article key={r.id} className="card p-4">
                <div className="micro figure flex flex-wrap items-center gap-x-2 gap-y-1 text-ink3">
                  <span lang="en" className="text-ink2">
                    {r.id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="normal-case tracking-normal">{t(r.location)}</span>
                </div>

                <div className="mt-1.5 flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={tintStyle(r.issue)}
                  >
                    <IssueIcon id={r.issue} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="display text-[17px] leading-tight">
                      {lang === "kn" ? issue.kannada : issue.name}
                    </h3>
                    <p className="text-[12.5px] text-ink2">{t(STATUS_NAME[r.status])}</p>
                    <p className={`figure text-[12.5px] font-semibold ${TONE[d.tone]}`}>
                      {deadlineText(d.hoursLeft, d.sla, false, lang)}
                    </p>
                  </div>
                  {!active && (
                    <button className={`${primaryBtn} shrink-0`} onClick={() => start(r.id)}>
                      {t("Completed")}
                    </button>
                  )}
                </div>

                {active && (
                  <div className="rise mt-3 border-t border-rulesoft pt-3">
                    <p className="micro text-ink3">{t("Photo of the repair")}</p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) takePhoto(file);
                        e.target.value = "";
                      }}
                    />

                    {photo ? (
                      <div className="mt-2">
                        <img
                          src={photo.src}
                          alt={t("Photo of the repair")}
                          className="max-h-[40vh] w-full max-w-full rounded-[var(--r-ctl)] object-cover"
                        />
                        <p className="micro figure mt-2 flex items-center justify-between text-ink3">
                          <span>
                            {photo.kb} KB · {t("small enough for a weak signal")}
                          </span>
                          <button className="text-stamp" onClick={() => fileRef.current?.click()}>
                            {t("Retake")}
                          </button>
                        </p>
                      </div>
                    ) : (
                      <>
                        <button
                          className="mt-2 flex min-h-[18vh] w-full items-center justify-center rounded-[var(--r-ctl)] border-2 border-dashed border-rule bg-sunken px-4 text-[15px] font-medium text-ink2 transition hover:border-primary hover:text-ink"
                          onClick={() => fileRef.current?.click()}
                        >
                          {t("Take a photo, or choose one")}
                        </button>

                        {/* No photo is allowed, but never silently: the
                            reason is written down where the resident can
                            read it before deciding. */}
                        {noPhoto ? (
                          <div className="mt-3">
                            <label htmlFor={`why-${r.id}`} className="micro text-ink3">
                              {t("Tell the resident why there is no photo")}
                            </label>
                            <textarea
                              id={`why-${r.id}`}
                              rows={3}
                              autoFocus
                              value={why}
                              onChange={(e) => setWhy(e.target.value)}
                              placeholder={t(
                                "The ESCOM crew replaced the pole; nobody from the office was there to take a photo."
                              )}
                              className="mt-1.5 w-full resize-y rounded-[var(--r-ctl)] border border-rule bg-sunken px-3.5 py-3 text-[15px] text-ink placeholder:text-ink3 focus:border-primary focus:outline-none"
                            />
                            <p className="micro mt-1.5 text-ink3">
                              {t("This goes on the public record next to your claim.")}
                            </p>
                          </div>
                        ) : (
                          <button
                            className="micro mt-2.5 text-stamp"
                            onClick={() => setNoPhoto(true)}
                          >
                            {t("I don't have a photo")}
                          </button>
                        )}
                      </>
                    )}

                    {problem && <p className="mt-3 text-[12.5px] text-crit">{problem}</p>}

                    <div className="mt-3 flex gap-2">
                      <button className={quietBtn} onClick={cancel} disabled={busy}>
                        {t("Cancel")}
                      </button>
                      <button
                        className={`${primaryBtn} flex-1`}
                        disabled={!canSubmit}
                        onClick={submit}
                      >
                        {t(busy ? "Submitting…" : "Submit")}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {waiting.length > 0 && (
        <div className="mx-4 mt-5">
          <p className="micro text-ink3">{t("Waiting on residents")}</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {waiting.map((r) => (
              <li
                key={r.id}
                className="flex items-baseline justify-between gap-3 rounded-[10px] bg-surface px-3 py-2 text-[13px]"
              >
                <span className="text-ink2">
                  <span lang="en" className="figure font-semibold text-ink">
                    {r.id}
                  </span>{" "}
                  · {lang === "kn" ? issueOf(r.issue).kannada : issueOf(r.issue).name}
                </span>
                <span className="micro shrink-0 text-ink3">{t(r.location)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
