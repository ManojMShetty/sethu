import { useRef, useState } from "react";
import { ISSUES, type IssueId } from "../data";
import { fileReport } from "../api";
import MapPicker, { type Spot } from "./MapPicker";
import { MicIcon } from "./Bits";

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

/* A resident is standing in front of the broken thing, in the sun, on a
   phone they did not choose. So: four steps down one page, no wizard to
   get lost in, and the only place anyone has to type is optional. */
function Step({
  n,
  title,
  hint,
  children
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-rulesoft bg-surface px-4 py-4 first:border-t-0">
      <div className="flex items-baseline gap-2.5">
        <span className="micro figure flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal text-tealink">
          {n}
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] leading-tight font-semibold">{title}</h3>
          {hint && <p className="mt-0.5 text-[12.5px] text-ink3">{hint}</p>}
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
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
  onFiled: () => void;
}) {
  const [issue, setIssue] = useState<IssueId | null>(null);
  const [place, setPlace] = useState<string>("Neither");
  const [photo, setPhoto] = useState<{ src: string; kb: number } | null>(null);
  const [pin, setPin] = useState<Spot | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [merged, setMerged] = useState(false);
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
    setMerged(Boolean(answer?.duplicate));
    setSent(answer?.id ?? nextId);
    onFiled();
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

  if (sent) {
    return (
      <div className="rise mx-auto max-w-2xl px-4 py-10">
        <div className="border-t-[3px] border-ok bg-surface px-5 py-8 text-center">
          <p className="micro text-ok">
            {merged ? "Added to a report already open" : "Report filed"}
          </p>
          <p className="display figure mt-2 text-[38px] leading-none font-semibold">{sent}</p>
          <p className="mx-auto mt-3 max-w-[38ch] text-[14px] text-ink2">
            {merged
              ? "Someone nearby had already reported this. Yours was added to theirs, which carries more weight than a separate one."
              : "The clock started the moment you sent this. It runs whether or not anyone opens it, and only you can close it."}
          </p>
          <button
            className="micro mt-6 rounded-[3px] bg-teal px-4 py-2.5 text-tealink"
            onClick={() => {
              setSent(null);
              setIssue(null);
              setPhoto(null);
              setPin(null);
              onNote("");
            }}
          >
            File another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-surface px-4 pt-5 pb-1">
        <h2 className="display text-[24px] leading-tight font-semibold">
          Report what's broken
        </h2>
        <p className="mt-1 text-[13.5px] text-ink2">
          About twenty seconds. The photo is shrunk on your phone so it sends on
          a weak signal.
        </p>
      </div>

      <Step n={1} title="Photo" hint="Optional, but it is what stops an argument later.">
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
              alt="What you photographed"
              className="w-full max-w-full border border-rule object-cover"
            />
            <p className="micro figure mt-2 flex items-center justify-between text-ink3">
              <span>{photo.kb} KB · small enough for a weak signal</span>
              <button className="text-stamp" onClick={() => fileRef.current?.click()}>
                Retake
              </button>
            </p>
          </div>
        ) : (
          <button
            className="w-full border border-dashed border-rule bg-sunken py-8 text-[14px] font-medium text-ink2 transition hover:border-teal hover:text-ink"
            onClick={() => fileRef.current?.click()}
          >
            Take a photo, or choose one
          </button>
        )}
      </Step>

      <Step n={2} title="What is broken?" hint="The choice sets the deadline.">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {ISSUES.map((i) => {
            const on = issue === i.id;
            return (
              <button
                key={i.id}
                onClick={() => setIssue(i.id)}
                aria-pressed={on}
                className={`flex min-h-[58px] flex-col justify-center border px-2.5 py-2 text-left transition ${
                  on
                    ? "border-teal bg-teal text-tealink"
                    : "border-rule bg-surface hover:border-teal/50"
                }`}
              >
                <span className="text-[14px] leading-tight font-semibold">{i.name}</span>
                <span
                  className={`figure mt-0.5 text-[11px] ${on ? "text-tealink/70" : "text-ink3"}`}
                >
                  {i.sla}h · {i.why}
                </span>
              </button>
            );
          })}
        </div>
      </Step>

      <Step n={3} title="Where is it?" hint="GPS first. Move the pin if it is wrong.">
        <MapPicker value={pin} onChange={setPin} />

        <p className="micro mt-3 mb-1.5 text-ink3">Is it inside a school or anganwadi?</p>
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
              {p}
            </button>
          ))}
        </div>
        {place !== "Neither" && (
          <p className="mt-2 text-[12.5px] text-stamp">
            A school toilet is not a Panchayat asset. This routes to the Education
            Department instead.
          </p>
        )}
      </Step>

      <Step n={4} title="Anything to add?" hint="Optional. The Panchayat sees this.">
        <textarea
          id="note-input"
          rows={3}
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Dark since Deepavali. Children walk here at 6am."
          className="w-full resize-y border border-rule bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-ink3"
        />
        <button
          onClick={onSpeak}
          className="mt-2 flex w-full items-center justify-center gap-2 border border-dashed border-rule bg-sunken py-3 text-[14px] font-semibold text-ink2 transition hover:border-teal hover:text-ink"
        >
          <MicIcon size={17} />
          Speak instead of typing
        </button>
      </Step>

      <div className="border-t border-rulesoft bg-surface px-4 py-4">
        <button
          disabled={!issue || sending}
          onClick={send}
          className="w-full bg-teal py-3.5 text-[16px] font-semibold text-tealink transition disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink3"
        >
          {sending ? "Sending…" : "Send report"}
        </button>
        {!issue && (
          <p className="mt-2 text-center text-[12.5px] text-ink3">
            Choose what is broken first.
          </p>
        )}
      </div>
    </div>
  );
}
