import { useRef, useState } from "react";
import {
  assignReport,
  BODY_NAMES,
  claimRepair,
  confirmFix,
  giveReason,
  REASON_CODES
} from "../api";
import type { Report } from "../data";
import { useT } from "../i18n";

/* ------------------------------------------------------------------
   Where an office answers, and where a resident answers back.

   This is the loop the whole product is for, so it is worth saying what
   each control is allowed to do. An official can explain and can claim
   a repair. Neither closes anything. The only control on this screen
   that writes "fixed" belongs to the person who filed the report, and
   even that is checked again on the server, because a rule enforced in
   a browser is a convention, not a rule.

   Every refusal shown here is the server's own sentence. We do not
   rewrite it, and we do not pre-empt it by hiding the button: a person
   should find out that a late job cannot be signed off until it has
   been explained by being told so, not by wondering where a button
   went.
   ------------------------------------------------------------------ */

function Line({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 border-t border-rulesoft pt-3">{children}</div>;
}

const btn =
  "rounded-[10px] px-3 py-2 text-[13px] font-semibold transition disabled:opacity-50";

export default function Actions({
  report,
  staff,
  onDone
}: {
  report: Report;
  staff: boolean;
  onDone: () => void;
}) {
  const { t } = useT();
  const [sheet, setSheet] = useState<null | "assign" | "reason">(null);
  const [worker, setWorker] = useState("");
  const [code, setCode] = useState("");
  const [detail, setDetail] = useState("");
  const [handTo, setHandTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const proof = useRef<HTMLInputElement>(null);

  if (report.status === "fixed") return null;

  /* Which server statuses each action is actually for. A report that
     has escalated is still open, so it can still be assigned; a repair
     can only be claimed once somebody is on the job. Showing a button
     the server would reject on a technicality teaches nothing — the one
     refusal worth putting in front of a clerk is the one about
     explaining a late job, and that one still comes through. */
  const open =
    report.status === "waiting" ||
    report.status === "escalated_tp" ||
    report.status === "escalated_zp";
  const withStaff =
    report.status === "assigned" || report.status === "in_progress_late";

  async function run(work: Promise<string | null>) {
    setBusy(true);
    const failed = await work;
    setBusy(false);
    setProblem(failed);
    if (!failed) {
      setSheet(null);
      setWorker("");
      setCode("");
      setDetail("");
      setHandTo("");
      onDone();
    }
  }

  /* Shrunk before it goes anywhere, same as the resident's photo. The
     engineer's phone is not necessarily a better phone. */
  function sendProof(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        run(claimRepair(report.id, canvas.toDataURL("image/jpeg", 0.62)));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  /* ---------------- the resident's half ---------------- */

  if (!staff) {
    if (report.status !== "repair_claimed") return null;
    if (!report.mine) {
      return (
        <Line>
          <p className="text-[13px] text-ink3">
            {t("Repair claimed. Waiting for the resident who reported it.")}
          </p>
        </Line>
      );
    }
    return (
      <Line>
        <p className="text-[13px] text-ink2">
          {t("Staff say this is repaired. Only you can close it.")}
        </p>
        <div className="mt-2.5 flex gap-2">
          <button
            disabled={busy}
            className={`${btn} flex-1 bg-ok text-white`}
            onClick={() => run(confirmFix(report.id, true))}
          >
            {t("It is fixed")}
          </button>
          <button
            disabled={busy}
            className={`${btn} flex-1 border border-crit text-crit`}
            onClick={() => run(confirmFix(report.id, false))}
          >
            {t("Still broken")}
          </button>
        </div>
        {problem && <p className="mt-2 text-[12.5px] text-crit">{problem}</p>}
      </Line>
    );
  }

  /* ---------------- the office's half ---------------- */

  return (
    <Line>
      <div className="flex flex-wrap gap-2">
        {open && (
          <button
            className={`${btn} border border-rule text-ink2`}
            onClick={() => setSheet(sheet === "assign" ? null : "assign")}
          >
            {t("Assign to staff")}
          </button>
        )}

        <button
          className={`${btn} bg-teal text-tealink`}
          onClick={() => setSheet(sheet === "reason" ? null : "reason")}
        >
          {t("Give a reason")}
        </button>

        {withStaff && (
          <>
            <input
              ref={proof}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && sendProof(e.target.files[0])}
            />
            <button
              disabled={busy}
              className={`${btn} border border-rule text-ink2`}
              onClick={() => proof.current?.click()}
            >
              {t("Submit repair proof")}
            </button>
          </>
        )}
      </div>

      {sheet === "assign" && (
        <div className="mt-2.5 flex gap-2">
          <input
            value={worker}
            onChange={(e) => setWorker(e.target.value)}
            placeholder={t("Who is taking this job?")}
            className="min-w-0 flex-1 rounded-[10px] border border-rule bg-sunken px-3 py-2 text-[14px]"
          />
          <button
            disabled={busy || !worker.trim()}
            className={`${btn} bg-teal text-tealink`}
            onClick={() => run(assignReport(report.id, worker))}
          >
            {t("Assign")}
          </button>
        </div>
      )}

      {sheet === "reason" && (
        <div className="mt-2.5">
          <div className="flex flex-col gap-1.5">
            {Object.entries(REASON_CODES).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setCode(id)}
                aria-pressed={code === id}
                className={`rounded-[10px] px-3 py-2 text-left text-[13px] leading-snug transition ${
                  code === id
                    ? "bg-teal text-tealink"
                    : "bg-sunken text-ink2 hover:text-ink"
                }`}
              >
                {t(label)}
              </button>
            ))}
          </div>

          {/* Handing a report on moves who owns it. It does not move the
              deadline, and the server is the one that makes sure. */}
          {code === "not_our_asset" && (
            <select
              value={handTo}
              onChange={(e) => setHandTo(e.target.value)}
              className="mt-2 w-full rounded-[10px] border border-rule bg-surface px-3 py-2.5 text-[14px]"
            >
              <option value="">{t("Which department does it belong to?")}</option>
              {Object.entries(BODY_NAMES)
                .filter(([id]) => id !== report.ownerBody)
                .map(([id, name]) => (
                  <option key={id} value={id}>
                    {t(name)}
                  </option>
                ))}
            </select>
          )}

          <textarea
            rows={2}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={t("Anything the resident should know")}
            className="mt-2 w-full resize-y rounded-[10px] border border-rule bg-sunken px-3 py-2 text-[14px]"
          />

          <p className="micro mt-2 text-ink3">
            {t("A reason does not pause the deadline.")}
          </p>

          <button
            disabled={busy || !code}
            className={`${btn} mt-2 w-full bg-teal py-3 text-[15px] text-tealink`}
            onClick={() => run(giveReason(report.id, code, detail, handTo))}
          >
            {t("Post this where everyone can see it")}
          </button>
        </div>
      )}

      {problem && <p className="mt-2 text-[12.5px] text-crit">{problem}</p>}
    </Line>
  );
}
