import { useState } from "react";
import { useT, type Lang } from "../i18n";
import {
  isValidPhone,
  makeOtp,
  MASTER_OTP,
  prettyPhone,
  saveSession,
  type Role,
  type Session
} from "../session";
import { VillageScene } from "./Art";
import { DeskIcon, ReportIcon } from "./Bits";

// Mobile number + OTP sign in, for residents and for government
// officials. The role picked here decides what the app shows next:
// officials get the Panchayat desk, residents do not see it at all.

const ROLES: { id: Role; label: string; hint: string; Icon: typeof DeskIcon }[] = [
  {
    id: "resident",
    label: "Resident",
    hint: "Report what is broken and close it when it is fixed",
    Icon: ReportIcon
  },
  {
    id: "official",
    label: "Government official",
    hint: "Answer reports at the Panchayat desk",
    Icon: DeskIcon
  }
];

const field =
  "w-full rounded-[var(--r-ctl)] border border-rule bg-sunken px-3.5 py-3 text-[16px] text-ink placeholder:text-ink3 focus:border-primary focus:outline-none";

const primaryBtn =
  "w-full rounded-[var(--r-ctl)] bg-primary py-3.5 text-[16px] font-semibold text-primaryink shadow-[var(--shadow-card)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink3 disabled:shadow-none";

export default function Login({ onDone }: { onDone: (s: Session) => void }) {
  const { lang, setLang, t } = useT();
  const [role, setRole] = useState<Role>("resident");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string | null>(null); // the code we "sent"
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");

  function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setError(t("Enter a valid 10-digit mobile number"));
      return;
    }
    setError("");
    setTyped("");
    setOtp(makeOtp());
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (typed !== otp && typed !== MASTER_OTP) {
      setError(t("That OTP is not right."));
      return;
    }
    const session: Session = { phone, role, signedInAt: Date.now() };
    saveSession(session);
    onDone(session);
  }

  function changeNumber() {
    setOtp(null);
    setTyped("");
    setError("");
  }

  return (
    <div className="flex min-h-full flex-col bg-ground">
      <header className="rounded-b-[26px] bg-brand text-brandink">
        <div className="mx-auto w-full max-w-2xl px-4 pt-7 pb-6">
          <div className="flex items-center justify-between gap-3">
            <h1 lang="en" className="display text-[30px] leading-none">
              Sethu
            </h1>
            <div className="flex overflow-hidden rounded-full bg-brandink/12 p-0.5">
              {(["kn", "en"] as Lang[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  lang={code}
                  className={`micro rounded-full px-2.5 py-1 transition ${
                    lang === code
                      ? "bg-brandink text-brand"
                      : "text-brandink/70 hover:text-brandink"
                  }`}
                >
                  {code === "kn" ? "ಕನ್ನಡ" : "EN"}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-[14px] text-brandink/75">
            {t("Gram Panchayat asset ledger")}
          </p>
          <VillageScene className="mt-3 h-28 w-full text-brandink/80" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-10">
        <div className="rise card p-5">
          <p className="micro text-ink3">{t("Sign in as")}</p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {ROLES.map(({ id, label, hint, Icon }) => {
              const on = role === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={otp !== null}
                  onClick={() => setRole(id)}
                  aria-pressed={on}
                  className={`flex flex-col items-start gap-1.5 rounded-[var(--r-ctl)] border p-3 text-left transition disabled:opacity-60 ${
                    on
                      ? "border-primary bg-primarywash text-primary"
                      : "border-rule text-ink2 hover:border-primary/60"
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[14px] leading-tight font-semibold">{t(label)}</span>
                  <span className="text-[11.5px] leading-snug text-ink3">{t(hint)}</span>
                </button>
              );
            })}
          </div>

          {otp === null ? (
            <form onSubmit={sendOtp} className="mt-5">
              <label htmlFor="phone" className="micro text-ink3">
                {t("Mobile number")}
              </label>
              <div className="mt-1.5 flex gap-2">
                <span
                  lang="en"
                  className="figure flex items-center rounded-[var(--r-ctl)] border border-rule bg-sunken px-3 text-[15px] text-ink2"
                >
                  +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210"
                  className={`${field} figure`}
                />
              </div>
              <p className="mt-2 text-[12.5px] text-ink3">
                {t("A one-time password will be sent to this number.")}
              </p>
              {error && <p className="mt-2 text-[12.5px] text-crit">{error}</p>}
              <button type="submit" className={`${primaryBtn} mt-4`}>
                {t("Send OTP")}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="mt-5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13.5px] text-ink2">
                  {t("OTP sent to")}{" "}
                  <span lang="en" className="figure font-semibold text-ink">
                    +91 {prettyPhone(phone)}
                  </span>
                </p>
                <button type="button" onClick={changeNumber} className="micro shrink-0 text-stamp">
                  {t("Change number")}
                </button>
              </div>

              {/* No SMS in this build, so the code is shown right here. */}
              <div className="mt-3 rounded-[var(--r-ctl)] border border-dashed border-primary/50 bg-primarywash px-4 py-3">
                <p className="micro text-primary">{t("Demo OTP")}</p>
                <p lang="en" className="display figure mt-1 text-[30px] leading-none tracking-[0.25em] text-primary">
                  {otp}
                </p>
                <p className="mt-1.5 text-[12px] text-ink2">
                  {t("No SMS is sent in this build. Type this code, or 123456.")}
                </p>
              </div>

              <label htmlFor="otp" className="micro mt-4 block text-ink3">
                {t("Enter the 6-digit OTP")}
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                className={`${field} figure mt-1.5 text-center text-[22px] tracking-[0.3em]`}
              />
              {error && <p className="mt-2 text-[12.5px] text-crit">{error}</p>}
              <button type="submit" disabled={typed.length < 6} className={`${primaryBtn} mt-4`}>
                {t("Verify and sign in")}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[12.5px] leading-snug text-ink3">
          {t("Officials see the Panchayat desk. Residents file reports and close them.")}
        </p>
      </main>
    </div>
  );
}
