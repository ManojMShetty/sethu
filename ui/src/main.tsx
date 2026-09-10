import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { firstLanguage, LangContext, LANG_KEY, type Lang } from "./i18n";
import "./index.css";

/* The language sits above the app rather than inside it, so that every
   component can read it with a hook instead of being handed it through
   whichever parent happens to be in the way. */
function Root() {
  const [lang, setLangState] = useState<Lang>(firstLanguage);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* storage off; it asks the browser again next time. */
    }
  }, []);

  // Screen readers and the browser's own font picking both go by this.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <App />
    </LangContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
