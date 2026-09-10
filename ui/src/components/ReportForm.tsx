import { useRef, useState } from "react";
import { ISSUES, type IssueId } from "../data";
import { fileReport } from "../api";
import MapPicker, { type Spot } from "./MapPicker";
import { MicIcon } from "./Bits";
import { stepText, useT } from "../i18n";

/* Three screens, not one long page.
 *
 * The scrolling version put every question in front of a person at
 * once, which reads as a form to fill in. Standing in front of a broken
 * hand pump on a phone in the sun, one question at a time is the easier
 * thing: photo, then what, then where, then send. Nothing is hidden by
 * it, because the rail across the top says how many screens there are
 * and Back goes to any of them without losing an answer.
 */

/* One token per browser, kept forever. It is how the server knows
   whether you are the person who filed a report, which decides whether
   you are allowed to close it. Nothing else in the app depends on
   knowing who you are. */
function deviceToken(): string {
  try {
    let t = localStorage.getItem("sethu.token");
    if (!t) {
      t = "tok-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("sethu.token", t);
    }
    return t;
  } catch {
    return "tok-anonymous";
  }
}

const PLACES = ["Neither", "Government school", "Anganwadi centre"] as const;
const SCREENS = 3;

export interface Filed {
  id: string;
  merged: boolean;
}

export default function ReportForm({
  nextId,
  onSpeak,
  note,
  onNote,
  online,
  onFiled
}: {
  nextId: string;
  onSpeak: () => void;
  note: string;
  onNote: (v: string) => void;
  online: boolean;
  onFiled: (filed: Filed) => void;
}) {
  const { lang, t } = useT();
  const [step, setStep] = useState(1);
  const [issue, setIssue] = useState<IssueId | null>(null);
  const [place, setPlace] = useState<string>("Neither");
  const [photo, setPhoto] = useState<{ src: string; kb: number } | null>(null);
  const [pin, setPin] = useState<Spot | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send() {
    if (!issue) return;
    setSending(true);
    const answer = online
      ? await fileReport({
          issue,
          note,
          lat: pin?.lat ?? null,
          lng: pin?.lng ?? null,
          place: pin?.name ?? null,
          placeKind:
            place === "Government school"
              ? "school"
              : place === "Anganwadi centre"
                ? "anganwadi"
                : null,
          token: deviceToken(),
          photo: photo?.src
        })
      : null;
    setSending(false);

    // The receipt is shown on the ledger, next to the entry it created,
    // rather than on a dead-end screen the person has to leave.
    onFiled({ id: answer?.id ?? nextId, merged: Boolean(answer?.duplicate) });

    setStep(1);
    setIssue(null);
    setPhoto(null);
    setPin(null);
    setPlace("Neither");
    onNote("");
  }

  /* Shrunk on the phone before it ever hits the network. A 4 MB camera
     photo will not leave a village on two bars; a 60 KB one will. */
  function takePhoto(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const src = canvas.toDataURL("image/jpeg", 0.62);
        setPhoto({ src, kb: Math.round((src.length * 0.75) / 1024) });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  const TITLES = ["Photo", "What is broken?", "Where is it?"];
  const HINTS = [
    "Optional, but it is what stops an argument later.",
    "The choice sets the deadline.",
    "GPS first. Move the pin if it is wrong."
  ];

  const blocked = step === 2 && !issue;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-surface px-4 pt-4 pb-3">
        <p className="micro text-ink3">{stepText(step, SCREENS, lang)}</p>
        <h2 className="display mt-0.5 text-[24px] leading-tight font-semibold">
          {t(TITLES[step - 1])}
        </h2>
        <p className="mt-1 text-[13px] text-ink2">{t(HINTS[step - 1])}</p>

        {/* A rail rather than dots: it reads as distance covered, which
            is the only thing a person wants to know here. */}
        <div className="mt-3 flex gap-1" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-[3px] flex-1 transition-colors ${
                n <= step ? "bg-teal" : "bg-sunken"
              }`}
            />
          ))}
        </div>
      </div>

      <div
        key={step}
        className="rise min-h-[52vh] border-t border-rulesoft bg-surface px-4 py-4"
      >
        {step === 1 && (
          <>
            <input
              ref={fileRef}
              id="photo-input"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && takePhoto(e.target.files[0])}
            />
            {photo ? (
              <div>
                <img
                  src={photo.src}
                  alt={t("Photo")}
                  className="w-full max-w-full border border-rule object-cover"
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
                className="w-full border border-dashed border-rule bg-sunken py-16 text-[15px] font-medium text-ink2 transition hover:border-teal hover:text-ink"
                onClick={() => fileRef.current?.click()}
              >
                {t("Take a photo, or choose one")}
              </button>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {ISSUES.map((i) => {
                const on = issue === i.id;
                return (
                  <button
                    key={i.id}
                    onClick={() => setIssue(i.id)}
                    aria-pressed={on}
                    className={`flex min-h-[62px] flex-col justify-center border px-2.5 py-2 text-left transition ${
                      on
                        ? "border-teal bg-teal text-tealink"
                        : "border-rule bg-surface hover:border-teal/50"
                    }`}
                  >
                    <span className="text-[14px] leading-tight font-semibold">
                      {lang === "kn" ? i.kannada : i.name}
                    </span>
                    <span
                      className={`figure mt-0.5 text-[11px] ${on ? "text-tealink/70" : "text-ink3"}`}
                    >
                      {i.sla}h · {t(i.why)}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="micro mt-5 mb-1.5 text-ink3">{t("Anything to add?")}</p>
            <textarea
              id="note-input"
              rows={3}
              value={note}
              onChange={(e) => onNote(e.target.value)}
              placeholder={t("Dark since Deepavali. Children walk here at 6am.")}
              className="w-full resize-y border border-rule bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-ink3"
            />
            <button
              onClick={onSpeak}
              className="mt-2 flex w-full items-center justify-center gap-2 border border-dashed border-rule bg-sunken py-3 text-[14px] font-semibold text-ink2 transition hover:border-teal hover:text-ink"
            >
              <MicIcon size={17} />
              {t("Speak instead of typing")}
            </button>
            <p className="micro mt-1.5 text-center text-ink3">
              {t("Speak in Kannada or English")}
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <MapPicker value={pin} onChange={setPin} />

            <p className="micro mt-4 mb-1.5 text-ink3">
              {t("Is it inside a school or anganwadi?")}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {PLACES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlace(p)}
                  aria-pressed={place === p}
                  className={`min-h-[44px] border px-2 py-2 text-[13px] font-medium transition ${
                    place === p
                      ? "border-teal bg-teal text-tealink"
                      : "border-rule bg-surface hover:border-teal/50"
                  }`}
                >
                  {t(p)}
                </button>
              ))}
            </div>
            {place !== "Neither" && (
              <p className="mt-2 text-[12.5px] text-stamp">
                {t(
                  "A school toilet is not a Panchayat asset. This routes to the Education Department instead."
                )}
              </p>
            )}
          </>
        )}
      </div>

      {/* Sits on top of the tab bar rather than at the end of the page,
          so Next is under the thumb on every screen including the tall
          one with the map on it. */}
      <div className="h-24" />
      <div className="fixed inset-x-0 bottom-[var(--nav-h)] z-20 border-t border-rule bg-surface">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-2.5">
          {step > 1 && (
            <button
              className="border border-rule px-5 py-3 text-[15px] font-semibold text-ink2 transition hover:border-teal hover:text-ink"
              onClick={() => setStep((n) => n - 1)}
            >
              {t("Back")}
            </button>
          )}
          <button
            disabled={blocked || sending}
            onClick={() => (step < SCREENS ? setStep((n) => n + 1) : send())}
            className="flex-1 bg-teal py-3 text-[16px] font-semibold text-tealink transition disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink3"
          >
            {step < SCREENS
              ? t(step === 1 && !photo ? "Skip the photo" : "Next")
              : t(sending ? "Sending…" : "Send report")}
          </button>
        </div>
        {blocked && (
          <p className="pb-2 text-center text-[12.5px] text-ink3">
            {t("Choose what is broken first.")}
          </p>
        )}
      </div>
    </div>
  );
}
