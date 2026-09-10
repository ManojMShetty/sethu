import { derive, issueOf, LEVEL_NAME, STATUS_NAME, type Report } from "../data";
import { ageText, deadlineText, reopenedText, residentsText, useT } from "../i18n";
import { Chip, DeadlineBar, Rail } from "./Bits";

/* One entry in the register. Not a card: hairline rules top and bottom,
   a severity rail down the left margin, and the deadline as a ruled bar
   across the foot. The strip under that bar answers the only question a
   resident actually has once a deadline has gone. */
export default function Entry({
  report,
  offset,
  index
}: {
  report: Report;
  offset: number;
  index: number;
}) {
  const { lang, t } = useT();
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

      <div className="mt-1.5 flex items-center gap-2">
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

      {report.reason && !done && (
        <p className="mt-3 rounded-[10px] bg-sunken px-3 py-2 text-[13px] text-ink2">
          <span className="font-semibold text-ink">{t(report.reason.headline)}</span>
          <span className="text-ink3"> · {t(report.reason.detail)}</span>
        </p>
      )}

      {done && report.closedByResident && (
        <p className="mt-3 rounded-[10px] bg-okwash px-3 py-2 text-[13px] font-semibold text-ok">
          {t("The resident who reported it confirmed the repair")}
        </p>
      )}
    </article>
  );
}
