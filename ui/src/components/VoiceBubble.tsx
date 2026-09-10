import { useCallback, useEffect, useRef, useState } from "react";
import { MicIcon } from "./Bits";
import { useT, type Lang } from "../i18n";

/* A bubble you can put wherever your thumb is.
 *
 * Everything else on the report form is a button. The note is the one
 * place a resident has to write, and that is exactly the person we are
 * most likely to lose: someone who can see the broken tap, can point a
 * camera at it, and cannot spell it out on a phone keyboard.
 *
 * It floats rather than sitting in the form because a phone is held in
 * one hand and thumbs do not all reach the same corner. Drag it, drop
 * it, and it stays there next time.
 *
 * The catch, stated plainly: the browser's recogniser sends audio away
 * and gets text back, so this is the one part of the app that needs a
 * signal. Where it cannot work there is no bubble, rather than a button
 * that does nothing.
 *
 * The language you speak is asked separately from the language the app
 * is in. Those are not the same question: plenty of people here read a
 * form in English and would never dictate one in it, and the recogniser
 * has to be told which of the two before it hears a word. Whatever it
 * hears goes into the note as it was said. Kannada speech becomes
 * Kannada text, not an English translation of it, because the clerk who
 * reads the note reads Kannada and because a resident's own words are
 * the part of a complaint that should survive.
 */

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

const Engine: (new () => Rec) | undefined =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const KEY = "sethu.bubble";
const SPEECH_KEY = "sethu.speech";
const SIZE = 58;
const EDGE = 12;

function clamp(x: number, y: number) {
  return {
    x: Math.max(EDGE, Math.min(window.innerWidth - SIZE - EDGE, x)),
    y: Math.max(EDGE + 60, Math.min(window.innerHeight - SIZE - EDGE, y))
  };
}

export default function VoiceBubble({
  onText,
  openSignal
}: {
  onText: (text: string) => void;
  openSignal: number;
}) {
  const { lang, t } = useT();
  const [pos, setPos] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved) return clamp(saved.x, saved.y);
    } catch {
      /* first run, or storage is off. Not an error. */
    }
    return { x: 9999, y: 9999 };
  });
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState(false);
  const [heard, setHeard] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  /* Remembered, because the person who dictates in Kannada today will
     dictate in Kannada tomorrow. Until they say otherwise, the language
     they are reading the form in is the best guess at the language they
     will speak — so switching the app to Kannada switches the recogniser
     too, and only an explicit choice here stops it following. */
  const picked = useRef(false);
  const [speech, setSpeech] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(SPEECH_KEY);
      if (saved === "kn" || saved === "en") {
        picked.current = true;
        return saved;
      }
    } catch {
      /* storage off */
    }
    return lang;
  });

  useEffect(() => {
    if (!picked.current) setSpeech(lang);
  }, [lang]);

  const session = useRef<Rec | null>(null);
  const moved = useRef(0);
  const grab = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    setPos((p) => (p.x === 9999 ? clamp(window.innerWidth - SIZE - 18, window.innerHeight - 240) : p));
    const onResize = () => setPos((p) => clamp(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const stop = useCallback(() => {
    const s = session.current;
    session.current = null;
    try {
      s?.stop();
    } catch {
      /* already stopped */
    }
    setOpen(false);
  }, []);

  const listen = useCallback(() => {
    if (!Engine) {
      setProblem(t("This browser cannot listen. Type it instead."));
      setOpen(true);
      return;
    }
    setProblem(null);
    setHeard("");
    setOpen(true);

    const rec = new Engine();
    rec.lang = speech === "kn" ? "kn-IN" : "en-IN";
    rec.continuous = true;
    rec.interimResults = true;

    let settled = "";
    rec.onresult = (e: any) => {
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const piece = e.results[i][0].transcript;
        if (e.results[i].isFinal) settled += piece + " ";
        else pending += piece;
      }
      setHeard(settled + pending);
    };
    rec.onerror = (e: any) => {
      setProblem(
        e.error === "not-allowed"
          ? t("Microphone blocked. Allow it in your browser settings.")
          : e.error === "network"
            ? t("Speech needs a signal. Type it instead.")
            : t("Did not catch that.")
      );
    };
    rec.onend = () => {
      if (session.current === rec) session.current = null;
    };

    try {
      rec.start();
      session.current = rec;
    } catch {
      setProblem(t("Could not start the microphone."));
    }
  }, [speech, t]);

  /* The form's own "Speak instead of typing" button opens the same
     sheet. It is a counter rather than a boolean so that pressing it
     twice reopens; the ref is what stops a fresh mount from treating an
     old count as a fresh press and switching the microphone on by
     itself the moment a photo appears. */
  const lastSignal = useRef(openSignal);
  useEffect(() => {
    if (openSignal === lastSignal.current) return;
    lastSignal.current = openSignal;
    listen();
  }, [openSignal, listen]);

  useEffect(() => () => stop(), [stop]);

  /* Changing the language while the sheet is open has to restart the
     recogniser; the engine reads `lang` once, when it starts. */
  function speakIn(next: Lang) {
    picked.current = true;
    setSpeech(next);
    try {
      localStorage.setItem(SPEECH_KEY, next);
    } catch {
      /* storage off; it just asks again next time. */
    }
    if (session.current) {
      const rec = session.current;
      session.current = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
      // Give the engine a moment to release the microphone.
      window.setTimeout(() => listen(), 220);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    grab.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    moved.current = 0;
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    moved.current += Math.abs(e.movementX) + Math.abs(e.movementY);
    setPos(clamp(e.clientX - grab.current.dx, e.clientY - grab.current.dy));
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    try {
      localStorage.setItem(KEY, JSON.stringify(pos));
    } catch {
      /* storage off; the bubble just forgets where it was. */
    }
    // A tap is a drag that went nowhere.
    if (moved.current < 6) (session.current ? stop : listen)();
  }

  if (!Engine && !open) {
    // No recogniser at all: no bubble, no apology. The keyboard is there.
    return null;
  }

  const live = Boolean(session.current);

  return (
    <>
      <button
        aria-label={live ? t("Not listening") : t("Speak instead of typing")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`fixed z-50 flex items-center justify-center rounded-full text-tealink shadow-[var(--shadow-lift)] transition-[background-color,transform] ${
          live ? "listening bg-crit" : "bg-teal"
        } ${dragging ? "scale-110 cursor-grabbing" : "cursor-grab active:scale-95"}`}
        style={{
          left: pos.x,
          top: pos.y,
          width: SIZE,
          height: SIZE,
          touchAction: "none"
        }}
      >
        <MicIcon size={23} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/45 px-3 pb-3"
          onClick={stop}
        >
          <div
            className="rise w-full max-w-md rounded-[22px] bg-surface p-5 shadow-[var(--shadow-lift)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-2 items-end gap-[3px]" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={live ? "w-[3px] bg-crit" : "w-[3px] bg-ink3"}
                    style={{
                      height: live ? undefined : 4,
                      animation: live
                        ? `rise 0.5s ${i * 0.09}s ease-in-out infinite alternate`
                        : undefined,
                      minHeight: 4,
                      ...(live ? { height: 4 + ((i * 5) % 13) } : {})
                    }}
                  />
                ))}
              </span>
              <p className="micro flex-1 text-ink2">
                {problem ? t("Not listening") : live ? t("Listening") : t("Ready")}
              </p>
              <button className="micro text-stamp" onClick={stop}>
                {t("Close")}
              </button>
            </div>

            {/* Asked here rather than in settings, because this is the
                moment a person finds out it matters. */}
            <div className="mt-3 flex items-center gap-2">
              <span className="micro shrink-0 text-ink3">{t("I am speaking")}</span>
              <div className="flex gap-1">
                {(["kn", "en"] as Lang[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => speakIn(code)}
                    aria-pressed={speech === code}
                    className={`micro rounded-full px-3 py-1.5 transition ${
                      speech === code
                        ? "bg-teal text-tealink"
                        : "bg-sunken text-ink2 hover:text-ink"
                    }`}
                  >
                    {code === "kn" ? "ಕನ್ನಡ" : "English"}
                  </button>
                ))}
              </div>
            </div>

            <p
              className="mt-3 min-h-[3.5rem] text-[16px] leading-snug"
              lang={speech === "kn" ? "kn" : "en"}
            >
              {problem ? (
                <span className="text-crit">{problem}</span>
              ) : heard ? (
                heard
              ) : (
                <span className="text-ink3">
                  {speech === "kn"
                    ? "ಈಗ ಮಾತನಾಡಿ. ಏನು ಹಾಳಾಗಿದೆ ಮತ್ತು ಎಲ್ಲಿ ಎಂದು ಹೇಳಿ."
                    : "Speak now. Say what is broken and where."}
                </span>
              )}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 rounded-[var(--r-ctl)] bg-teal py-3.5 text-[15px] font-semibold text-tealink disabled:bg-sunken disabled:text-ink3"
                disabled={!heard.trim()}
                onClick={() => {
                  onText(heard.trim());
                  stop();
                }}
              >
                {t("Add to the report")}
              </button>
              {!live && !problem && (
                <button
                  className="rounded-[var(--r-ctl)] border border-rule px-4 text-[15px] font-semibold text-ink2"
                  onClick={listen}
                >
                  {t("Again")}
                </button>
              )}
            </div>

            <p className="mt-3 text-[12px] text-ink3">
              {t("Your words go in exactly as you say them.")}{" "}
              {t("Dictation needs a signal. The photo, the deadline and the send do not.")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
