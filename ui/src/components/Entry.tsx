import { derive, issueOf, LEVEL_NAME, STATUS_NAME, type Report } from "../data";
import { ageText, deadlineText, reopenedText, residentsText, useT } from "../i18n";
import { Chip, DeadlineBar, IssueIcon, Rail } from "./Bits";
import { tintStyle } from "./Art";
import Actions from "./Actions";
import { useState } from "react";

/* One entry in the register. Not a card: hairline rules top and bottom,
   a severity rail down the left margin, and the deadline as a ruled bar
   across the foot. The strip under that bar answers the only question a
   resident actually has once a deadline has gone. */
/* The server sends the body that spoke as a code. The dictionary is
   keyed on the name, so this is the one hop between them. */
const BODY_LABEL: Record<string, string> = {
  gp: "Gram Panchayat",
  escom: "CESC Mysuru",
  rdwsd: "Rural Drinking Water & Sanitation Dept",
  pred: "Panchayat Raj Engineering Division",
  pwd: "Public Works Department",
  edu: "Education Department",
  ksrtc: "KSRTC"
};

export default function Entry({
  report,
  offset,
  index,
  staff = false,
  onChanged
}: {
  report: Report;
  offset: number;
  index: number;
  staff?: boolean;
  onChanged?: () => void;
}) {
  const { lang, t } = useT();
  const [trail, setTrail] = useState(false);
  const d = derive(report, offset);
  const issue = issueOf(report.issue);
  const done = report.status === "fixed";

  return (
    <article
      className="rise card p-4"
      style={{ animationDelay: `${Math.min(index, 8) * 24}ms` }}
    >
      <div className="micro figure flex flex-wrap items-center gap-x-2 gap-y-1 text-ink3">
        <span lang="en" className="text-ink2">
          {report.id}
        </span>
        <span aria-hidden="true">·</span>
        <span className="normal-case tracking-normal">{t(report.location)}</span>
        <span aria-hidden="true">·</span>
        <span>{ageText(d.age, lang)}</span>
      </div>

      <div className="mt-1.5 flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={tintStyle(report.issue)}
        >
          <IssueIcon id={report.issue} size={18} />
        </span>
        <Rail tone={done ? "ok" : d.tone} />
        <h3 className="display text-[18px] leading-tight">
          {lang === "kn" ? issue.kannada : issue.name}
        </h3>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[13.5px] text-ink2">{t(STATUS_NAME[report.status])}</span>
        {report.extraResidents > 0 && (
          <Chip>{residentsText(report.extraResidents, lang)}</Chip>
        )}
        {report.reopened > 0 && (
          <Chip tone="crit">{reopenedText(report.reopened, lang)}</Chip>
        )}
        {report.department && <Chip tone="stamp">{t(report.department)}</Chip>}
      </div>

      <DeadlineBar
        d={d}
        done={done}
        left={deadlineText(d.hoursLeft, d.sla, done, lang)}
        right={t(LEVEL_NAME[report.level])}
      />

      {/* Silence is meant to be the ugliest thing in the register.
          It should cost an office more than an inconvenient answer. */}
      {d.silent && (
        <p className="mt-3 rounded-[10px] bg-critwash px-3 py-2 text-[13px] font-semibold text-crit">
          {t("No reason given by the")} {t(report.department ?? "Gram Panchayat")}
        </p>
      )}

      {/* Every reason the office has posted, oldest first. A single
          latest reason lets a department overwrite its own record; the
          stack is what makes a pattern of excuses visible. */}
      {(report.reasons?.length
        ? report.reasons
        : report.reason
          ? [{ ...report.reason, body: "", at: 0 }]
          : []
      ).map((r, n) => (
        <div
          key={n}
          className="mt-3 rounded-[10px] bg-sunken px-3 py-2 text-[13px] text-ink2"
        >
          <p className="font-semibold text-ink">{t(r.headline)}</p>
          {r.detail && <p className="mt-0.5 text-ink3">{t(r.detail)}</p>}
          {"body" in r && r.body && (
            <p className="micro mt-1 text-stamp">
              — {t(BODY_LABEL[r.body] ?? r.body)}
            </p>
          )}
        </div>
      ))}

      {report.history && report.history.length > 0 && (
        <>
          <button
            className="micro mt-3 text-stamp"
            onClick={() => setTrail((v) => !v)}
            aria-expanded={trail}
          >
            {t(trail ? "Hide what happened" : "What happened so far")}
          </button>
          {trail && (
            <ol className="mt-2 border-l-2 border-rule pl-3">
              {report.history.map((h, n) => (
                <li key={n} className="py-1 text-[12.5px] leading-snug text-ink2">
                  {t(h.message)}
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      <Actions report={report} staff={staff} onDone={() => onChanged?.()} />

      {done && report.closedByResident && (
        <p className="mt-3 rounded-[10px] bg-okwash px-3 py-2 text-[13px] font-semibold text-ok">
          {t("The resident who reported it confirmed the repair")}
        </p>
      )}
    </article>
  );
}
