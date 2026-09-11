import { useEffect, useState } from "react";
import { fetchFixPhoto } from "../api";
import { issueOf, type Report } from "../data";
import { useT } from "../i18n";
import { tintStyle } from "./Art";
import { IssueIcon } from "./Bits";
import Actions from "./Actions";

// The resident's side of a completed job. Staff say a repair is done;
// the resident looks at the proof and either closes the report or
// sends it back. Nothing is closed until they do.

export default function Completed({
  reports,
  onChanged
}: {
  reports: Report[];
  onChanged: () => void;
}) {
  const { lang, t } = useT();
  const waiting = reports.filter((r) => r.status === "repair_claimed");
  const done = reports.filter((r) => r.status === "fixed");

  // With server.py the list carries only a flag; the photo itself is
  // fetched one at a time. Offline it is already on the report.
  const [photos, setPhotos] = useState<Record<string, string>>({});
  useEffect(() => {
    for (const r of waiting) {
      if (r.hasFixPhoto && !r.fixPhoto && !(r.id in photos)) {
        setPhotos((p) => ({ ...p, [r.id]: "" }));
        fetchFixPhoto(r.id).then((src) => {
          if (src) setPhotos((p) => ({ ...p, [r.id]: src }));
        });
      }
    }
  }, [waiting, photos]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="px-4 pt-5 pb-3">
        <h2 className="display text-[25px] leading-tight">{t("Completed work")}</h2>
        <p className="mt-1 max-w-[62ch] text-[13.5px] text-ink2">
          {t(
            "Staff say these are repaired. Look at the proof and close the ones that are actually fixed. Only you can close a report you filed."
          )}
        </p>
      </div>

      {waiting.length === 0 ? (
        <p className="mx-4 my-4 rounded-[var(--r-card)] border border-dashed border-rule px-4 py-8 text-center text-[14px] text-ink3">
          {t("Nothing is waiting for you. When staff mark a repair done, it shows up here.")}
        </p>
      ) : (
        <div className="flex flex-col gap-3 px-4">
          {waiting.map((r) => {
            const issue = issueOf(r.issue);
            const photo = r.fixPhoto || photos[r.id];
            const said = r.history?.length ? r.history[r.history.length - 1].message : "";
            return (
              <article key={r.id} className="rise card p-4">
                <div className="micro figure flex flex-wrap items-center gap-x-2 gap-y-1 text-ink3">
                  <span lang="en" className="text-ink2">
                    {r.id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="normal-case tracking-normal">{t(r.location)}</span>
                </div>

                <div className="mt-1.5 flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={tintStyle(r.issue)}
                  >
                    <IssueIcon id={r.issue} size={18} />
                  </span>
                  <h3 className="display text-[18px] leading-tight">
                    {lang === "kn" ? issue.kannada : issue.name}
                  </h3>
                </div>

                {photo ? (
                  <div className="mt-3">
                    <p className="micro text-ink3">{t("Photo from the office")}</p>
                    <img
                      src={photo}
                      alt={t("Photo from the office")}
                      className="mt-1.5 max-h-[45vh] w-full max-w-full rounded-[var(--r-ctl)] object-cover"
                    />
                  </div>
                ) : r.hasFixPhoto ? (
                  <p className="mt-3 text-[13px] text-ink3">{t("Loading photo…")}</p>
                ) : (
                  <div className="mt-3 rounded-[10px] bg-latewash px-3 py-2 text-[13px] text-late">
                    <p className="font-semibold">
                      {t(said ? "No photo was given. The office said:" : "No photo or note came with this claim.")}
                    </p>
                    {said && <p className="mt-0.5">{said}</p>}
                  </div>
                )}

                <Actions report={r} staff={false} onDone={onChanged} />
              </article>
            );
          })}
        </div>
      )}

      {done.length > 0 && (
        <div className="mx-4 mt-5">
          <p className="micro text-ink3">{t("Fixed and confirmed")}</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {done.map((r) => (
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
                <span className="micro shrink-0 text-ok">{t("Fixed")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
