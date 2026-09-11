import { useRef, useState } from "react";
import { claimRepair } from "../api";
import { derive, issueOf, type Report } from "../data";
import { deadlineText, useT } from "../i18n";
import { kbOf, shrinkPhoto } from "../photo";
import { IssueIcon } from "./Bits";

// Where an official uploads proof that a repair was done. Officials do
// not file reports, so this takes the place of the report form for
// them. Only jobs with staff on them are listed, because a repair can
// only be claimed for a job somebody was assigned to, and the resident
// who filed the report still has the last word.

const primaryBtn =
  "w-full rounded-[var(--r-ctl)] bg-primary py-3.5 text-[16px] font-semibold text-primaryink shadow-[var(--shadow-card)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink3 disabled:shadow-none";

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
  const [picked, setPicked] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ src: string; kb: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null); // id just claimed
  const fileRef = useRef<HTMLInputElement>(null);

  const jobs = reports.filter(
    (r) => r.status === "assigned" || r.status === "in_progress_late"
  );
  const waiting = reports.filter((r) => r.status === "repair_claimed");

  async function takePhoto(file: File) {
    try {
      const src = await shrinkPhoto(file);
      setPhoto({ src, kb: kbOf(src) });
      setProblem(null);
    } catch {
      setProblem(t("That file is not a photo."));
    }
  }

  async function submit() {
    if (!picked) return setProblem(t("Pick a job first."));
    if (!photo) return setProblem(t("Add a photo of the repair first."));
    setBusy(true);
    const failed = await claimRepair(picked, photo.src);
    setBusy(false);
    setProblem(failed);
    if (!failed) {
      setSent(picked);
      setPicked(null);
      setPhoto(null);
      onDone();
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="px-4 pt-5 pb-3">
        <h2 className="display text-[25px] leading-tight">{t("Upload repair proof")}</h2>
        <p className="mt-1 max-w-[62ch] text-[13.5px] text-ink2">
          {t(
            "Pick the job you repaired and add a photo of it. The resident who reported it is then asked to confirm."
          )}
        </p>
      </div>

      {sent && (
        <div className="rise card mx-4 mb-3 border-t-[3px] border-ok px-4 py-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="micro text-ok">{t("Proof submitted")}</p>
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

      <div className="card mx-4 p-4">
        <p className="micro text-ink3">{t("Which job did you repair?")}</p>

        {jobs.length === 0 ? (
          <p className="mt-2 rounded-[var(--r-ctl)] border border-dashed border-rule px-4 py-6 text-center text-[13.5px] text-ink3">
            {t("No job has staff on it yet. Assign one from the desk first.")}
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-1.5">
            {jobs.map((r) => {
              const on = picked === r.id;
              const issue = issueOf(r.issue);
              const d = derive(r, offset);
              return (
                <button
                  key={r.id}
                  onClick={() => setPicked(on ? null : r.id)}
                  aria-pressed={on}
                  className={`flex items-center gap-3 rounded-[var(--r-ctl)] border px-3 py-2.5 text-left transition ${
                    on
                      ? "border-primary bg-primarywash"
                      : "border-rule hover:border-primary/60"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      on ? "bg-primary text-primaryink" : "bg-sunken text-ink2"
                    }`}
                  >
                    <IssueIcon id={r.issue} size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="micro figure block text-ink3">
                      <span lang="en">{r.id}</span> · {t(r.location)}
                    </span>
                    <span className="block text-[15px] font-semibold text-ink">
                      {lang === "kn" ? issue.kannada : issue.name}
                    </span>
                    <span
                      className={`figure block text-[12.5px] ${
                        d.overdue ? "text-crit" : "text-ink2"
                      }`}
                    >
                      {deadlineText(d.hoursLeft, d.sla, false, lang)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <p className="micro mt-5 text-ink3">{t("Photo of the repair")}</p>
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
          <button
            className="mt-2 flex min-h-[22vh] w-full items-center justify-center rounded-[var(--r-ctl)] border-2 border-dashed border-rule bg-sunken px-4 text-[15px] font-medium text-ink2 transition hover:border-primary hover:text-ink"
            onClick={() => fileRef.current?.click()}
          >
            {t("Take a photo, or choose one")}
          </button>
        )}

        {problem && <p className="mt-3 text-[12.5px] text-crit">{problem}</p>}

        <button
          disabled={busy || !picked || !photo}
          onClick={submit}
          className={`${primaryBtn} mt-4`}
        >
          {t(busy ? "Submitting…" : "Submit proof")}
        </button>
      </div>

      {waiting.length > 0 && (
        <div className="mx-4 mt-4">
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
