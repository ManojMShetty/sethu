/* ------------------------------------------------------------------
   Kannada and English.

   Vyasarajapura speaks Kannada. An English-only screen is not a small
   inconvenience there, it is the difference between a resident filing a
   report and walking away from it. So the toggle has to turn over the
   whole interface, not a handful of nouns.

   The table is keyed on the English sentence rather than on invented
   keys. That is a deliberate trade: it keeps the components readable
   (t("Send report"), not t("form.submit")) and it means an untranslated
   string falls back to English rather than showing a key name to a
   resident. The cost is that editing an English string silently drops
   its translation, which is visible the moment you switch languages.

   Numbers stay in Latin digits. Kannada numerals exist but nobody in
   the village reads a bus timetable in them.
   ------------------------------------------------------------------ */

export type Lang = "en" | "kn";

const KN: Record<string, string> = {
  // ---------- chrome ----------
  "Gram Panchayat asset ledger": "ಗ್ರಾಮ ಪಂಚಾಯತಿ ಆಸ್ತಿ ದಾಖಲೆ",
  server: "ಸರ್ವರ್",
  offline: "ಆಫ್‌ಲೈನ್",
  "Reading the live ledger from server.py":
    "server.py ಇಂದ ನೇರ ದಾಖಲೆ ಓದಲಾಗುತ್ತಿದೆ",
  "No server reachable. Showing the seed ledger.":
    "ಸರ್ವರ್ ಸಿಗುತ್ತಿಲ್ಲ. ಸಂಗ್ರಹಿಸಿದ ದಾಖಲೆ ತೋರಿಸಲಾಗುತ್ತಿದೆ.",
  Resident: "ನಿವಾಸಿ",
  "Panchayat staff": "ಪಂಚಾಯತಿ ಸಿಬ್ಬಂದಿ",
  Report: "ದೂರು",
  Ledger: "ದಾಖಲೆ",
  Desk: "ಮೇಜು",

  open: "ಬಾಕಿ ಇವೆ",
  "past deadline": "ಗಡುವು ಮೀರಿವೆ",
  "fixed and verified": "ಸರಿಪಡಿಸಿ ದೃಢಪಡಿಸಲಾಗಿದೆ",
  "repairs rejected": "ದುರಸ್ತಿ ತಿರಸ್ಕೃತ",
  "late, no reason given": "ತಡ, ಕಾರಣ ಹೇಳಿಲ್ಲ",

  /* Short forms for the tally strip. The long sentence above is still
     what a screen reader and the tooltip say; these are only what fits
     under a figure on a phone. */
  Open: "ಬಾಕಿ",
  Late: "ತಡ",
  Fixed: "ಸರಿ",
  Rejected: "ತಿರಸ್ಕೃತ",
  Silent: "ಮೌನ",

  Menu: "ಮೆನು",
  Role: "ಪಾತ್ರ",

  "Demo clock": "ಪ್ರದರ್ಶನ ಗಡಿಯಾರ",
  "+1 hour": "+1 ಗಂಟೆ",
  "+24 hours": "+24 ಗಂಟೆ",
  reset: "ಮರುಹೊಂದಿಸಿ",
  simulated: "ಕೃತಕ ಸಮಯ",

  // ---------- the report form ----------
  "Report what's broken": "ಏನು ಹಾಳಾಗಿದೆ ಎಂದು ತಿಳಿಸಿ",
  "About twenty seconds. The photo is shrunk on your phone so it sends on a weak signal.":
    "ಸುಮಾರು ಇಪ್ಪತ್ತು ಸೆಕೆಂಡು. ಫೋಟೋವನ್ನು ನಿಮ್ಮ ಫೋನಿನಲ್ಲೇ ಚಿಕ್ಕದು ಮಾಡಲಾಗುತ್ತದೆ, ಹಾಗಾಗಿ ಕಡಿಮೆ ನೆಟ್‌ವರ್ಕ್‌ನಲ್ಲೂ ಹೋಗುತ್ತದೆ.",
  Photo: "ಫೋಟೋ",
  "Optional, but it is what stops an argument later.":
    "ಕಡ್ಡಾಯವಲ್ಲ, ಆದರೆ ಮುಂದೆ ವಾದ ಬರದಂತೆ ತಡೆಯುವುದು ಇದೇ.",
  "Take a photo, or choose one": "ಫೋಟೋ ತೆಗೆಯಿರಿ, ಅಥವಾ ಒಂದನ್ನು ಆರಿಸಿ",
  Retake: "ಮತ್ತೆ ತೆಗೆಯಿರಿ",
  "small enough for a weak signal": "ಕಡಿಮೆ ನೆಟ್‌ವರ್ಕ್‌ಗೂ ಸಾಕು",
  "What is broken?": "ಏನು ಹಾಳಾಗಿದೆ?",
  "The choice sets the deadline.": "ಈ ಆಯ್ಕೆಯೇ ಗಡುವನ್ನು ನಿಗದಿ ಮಾಡುತ್ತದೆ.",
  "live wire": "ಜೀವಕ್ಕೆ ಅಪಾಯ",
  "no water at the tap": "ಕುಡಿಯುವ ನೀರಿಲ್ಲ",
  "no way out of here": "ಊರು ಬಿಡಲು ದಾರಿ ಇಲ್ಲ",
  "only source": "ಇರುವುದು ಇದೊಂದೇ",
  "health risk": "ಆರೋಗ್ಯಕ್ಕೆ ಅಪಾಯ",
  sanitation: "ನೈರ್ಮಲ್ಯ",
  "standing water": "ನಿಂತ ನೀರು",
  "unlit at night": "ರಾತ್ರಿ ಕತ್ತಲೆ",
  "slower to fix": "ಸರಿಪಡಿಸಲು ಹೆಚ್ಚು ಸಮಯ",
  "Where is it?": "ಎಲ್ಲಿದೆ?",
  "GPS first. Move the pin if it is wrong.":
    "ಮೊದಲು ಜಿಪಿಎಸ್. ತಪ್ಪಿದ್ದರೆ ಪಿನ್ ಸರಿಸಿ.",
  "Is it inside a school or anganwadi?": "ಇದು ಶಾಲೆ ಅಥವಾ ಅಂಗನವಾಡಿ ಒಳಗಿದೆಯೇ?",
  Neither: "ಎರಡೂ ಅಲ್ಲ",
  "Government school": "ಸರ್ಕಾರಿ ಶಾಲೆ",
  "Anganwadi centre": "ಅಂಗನವಾಡಿ ಕೇಂದ್ರ",
  "A school toilet is not a Panchayat asset. This routes to the Education Department instead.":
    "ಶಾಲೆಯ ಶೌಚಾಲಯ ಪಂಚಾಯತಿಯ ಆಸ್ತಿ ಅಲ್ಲ. ಇದು ಶಿಕ್ಷಣ ಇಲಾಖೆಗೆ ಹೋಗುತ್ತದೆ.",
  "Anything to add?": "ಇನ್ನೇನಾದರೂ ಹೇಳಬೇಕೆ?",
  "Optional. The Panchayat sees this.": "ಕಡ್ಡಾಯವಲ್ಲ. ಇದು ಪಂಚಾಯತಿಗೆ ಕಾಣುತ್ತದೆ.",
  "Dark since Deepavali. Children walk here at 6am.":
    "ದೀಪಾವಳಿಯಿಂದ ಕತ್ತಲೆ. ಮಕ್ಕಳು ಬೆಳಿಗ್ಗೆ ಇಲ್ಲಿ ನಡೆದು ಹೋಗುತ್ತಾರೆ.",
  "Speak instead of typing": "ಟೈಪ್ ಮಾಡುವ ಬದಲು ಮಾತನಾಡಿ",
  "Speak in Kannada or English": "ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ",
  "Send report": "ದೂರು ಕಳುಹಿಸಿ",
  "Sending…": "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…",
  "Choose what is broken first.": "ಮೊದಲು ಏನು ಹಾಳಾಗಿದೆ ಎಂದು ಆರಿಸಿ.",
  "Report filed": "ದೂರು ದಾಖಲಾಗಿದೆ",
  "Added to a report already open": "ಈಗಾಗಲೇ ಇರುವ ದೂರಿಗೆ ಸೇರಿಸಲಾಗಿದೆ",
  "The clock started the moment you sent this. It runs whether or not anyone opens it, and only you can close it.":
    "ನೀವು ಕಳುಹಿಸಿದ ಕ್ಷಣದಿಂದಲೇ ಗಡಿಯಾರ ಶುರುವಾಗಿದೆ. ಯಾರಾದರೂ ತೆರೆದರೂ ತೆರೆಯದಿದ್ದರೂ ಅದು ಓಡುತ್ತದೆ, ಮತ್ತು ಅದನ್ನು ಮುಚ್ಚಬಲ್ಲವರು ನೀವು ಮಾತ್ರ.",
  "Someone nearby had already reported this. Yours was added to theirs, which carries more weight than a separate one.":
    "ಹತ್ತಿರದ ಯಾರೋ ಇದನ್ನು ಈಗಾಗಲೇ ವರದಿ ಮಾಡಿದ್ದಾರೆ. ನಿಮ್ಮದನ್ನು ಅವರದಕ್ಕೆ ಸೇರಿಸಲಾಗಿದೆ, ಪ್ರತ್ಯೇಕ ದೂರಿಗಿಂತ ಇದಕ್ಕೆ ಹೆಚ್ಚು ತೂಕ.",
  "File another": "ಇನ್ನೊಂದು ದೂರು",
  Back: "ಹಿಂದೆ",
  Next: "ಮುಂದೆ",
  "Skip the photo": "ಫೋಟೋ ಬೇಡ",

  // ---------- the map ----------
  "Use my location": "ನನ್ನ ಸ್ಥಳ ಬಳಸಿ",
  "Locate me again": "ಮತ್ತೆ ಸ್ಥಳ ಹುಡುಕಿ",
  "Location is off. Drop the pin by hand.":
    "ಸ್ಥಳ ಸೇವೆ ಆಫ್ ಆಗಿದೆ. ಪಿನ್ ಅನ್ನು ಕೈಯಿಂದ ಇಡಿ.",
  "Finding your location…": "ನಿಮ್ಮ ಸ್ಥಳ ಹುಡುಕಲಾಗುತ್ತಿದೆ…",
  "Drop the pin on what is broken": "ಹಾಳಾದ ಜಾಗದ ಮೇಲೆ ಪಿನ್ ಇಡಿ",
  "Drag the pin to the exact spot": "ಪಿನ್ ಅನ್ನು ಸರಿಯಾದ ಜಾಗಕ್ಕೆ ಎಳೆಯಿರಿ",
  "Map could not load. Pick the nearest landmark instead.":
    "ನಕ್ಷೆ ತೆರೆಯಲಿಲ್ಲ. ಬದಲಿಗೆ ಹತ್ತಿರದ ಗುರುತು ಆರಿಸಿ.",
  "Or pick the nearest landmark": "ಅಥವಾ ಹತ್ತಿರದ ಗುರುತು ಆರಿಸಿ",
  "Pinned at": "ಗುರುತಿಸಿದ ಸ್ಥಳ",

  // landmarks
  "Overhead tank": "ನೀರಿನ ಟ್ಯಾಂಕ್",
  "Bus stop, Sosale road": "ಬಸ್ ನಿಲ್ದಾಣ, ಸೋಸಲೆ ರಸ್ತೆ",
  "Gram Panchayat office": "ಗ್ರಾಮ ಪಂಚಾಯತಿ ಕಚೇರಿ",
  "Health sub-centre": "ಆರೋಗ್ಯ ಉಪಕೇಂದ್ರ",
  "Ration shop": "ನ್ಯಾಯಬೆಲೆ ಅಂಗಡಿ",
  "Temple junction": "ದೇವಸ್ಥಾನ ವೃತ್ತ",
  "Borewell, north colony": "ಬೋರ್‌ವೆಲ್, ಉತ್ತರ ಕಾಲೋನಿ",
  "Transformer, Somanathapura road": "ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್, ಸೋಮನಾಥಪುರ ರಸ್ತೆ",
  "Location pinned": "ಸ್ಥಳ ಗುರುತಿಸಲಾಗಿದೆ",

  // ---------- ledger and desk ----------
  "Public ledger": "ಸಾರ್ವಜನಿಕ ದಾಖಲೆ",
  "Every report in this Panchayat, newest first, with its deadline running in the open. Nothing here is hidden from the people who filed it.":
    "ಈ ಪಂಚಾಯತಿಯ ಪ್ರತಿಯೊಂದು ದೂರು, ಹೊಸದು ಮೊದಲು, ಅದರ ಗಡುವು ಎಲ್ಲರ ಕಣ್ಣ ಮುಂದೆ ಓಡುತ್ತಿದೆ. ದೂರು ನೀಡಿದವರಿಂದ ಇಲ್ಲಿ ಏನನ್ನೂ ಮುಚ್ಚಿಡಲಾಗಿಲ್ಲ.",
  "Panchayat desk": "ಪಂಚಾಯತಿ ಮೇಜು",
  "Sorted by what breaches soonest, not by date. A job closes only when the resident who reported it confirms.":
    "ಯಾವುದು ಬೇಗ ಗಡುವು ಮೀರುತ್ತದೋ ಅದರ ಪ್ರಕಾರ ಜೋಡಿಸಲಾಗಿದೆ, ದಿನಾಂಕದ ಪ್ರಕಾರ ಅಲ್ಲ. ದೂರು ನೀಡಿದ ನಿವಾಸಿ ದೃಢಪಡಿಸಿದಾಗ ಮಾತ್ರ ಕೆಲಸ ಮುಗಿಯುತ್ತದೆ.",
  "No reports yet. The first one starts the ledger.":
    "ಇನ್ನೂ ದೂರುಗಳಿಲ್ಲ. ಮೊದಲನೆಯದು ದಾಖಲೆಯನ್ನು ಶುರು ಮಾಡುತ್ತದೆ.",
  "The resident who reported it confirmed the repair":
    "ದೂರು ನೀಡಿದ ನಿವಾಸಿ ದುರಸ್ತಿಯನ್ನು ದೃಢಪಡಿಸಿದ್ದಾರೆ",
  "No reason given by the": "ಕಾರಣ ಹೇಳಿಲ್ಲ:",

  // ---------- statuses and levels ----------
  "Waiting to be assigned": "ನಿಯೋಜನೆಗೆ ಕಾಯುತ್ತಿದೆ",
  "Assigned to staff": "ಸಿಬ್ಬಂದಿಗೆ ವಹಿಸಲಾಗಿದೆ",
  "Repair claimed, waiting for the resident":
    "ದುರಸ್ತಿ ಆಗಿದೆ ಎಂದು ಹೇಳಲಾಗಿದೆ, ನಿವಾಸಿಗಾಗಿ ಕಾಯುತ್ತಿದೆ",
  "In progress, past deadline": "ನಡೆಯುತ್ತಿದೆ, ಗಡುವು ಮೀರಿದೆ",
  "Escalated to Taluk Panchayat": "ತಾಲ್ಲೂಕು ಪಂಚಾಯತಿಗೆ ಏರಿಸಲಾಗಿದೆ",
  "Escalated to Zilla Panchayat": "ಜಿಲ್ಲಾ ಪಂಚಾಯತಿಗೆ ಏರಿಸಲಾಗಿದೆ",
  "Fixed, confirmed by the resident": "ಸರಿಪಡಿಸಲಾಗಿದೆ, ನಿವಾಸಿ ದೃಢಪಡಿಸಿದ್ದಾರೆ",
  "Closed by the resident": "ನಿವಾಸಿ ಮುಚ್ಚಿದ್ದಾರೆ",

  "Gram Panchayat": "ಗ್ರಾಮ ಪಂಚಾಯತಿ",
  "Taluk Panchayat": "ತಾಲ್ಲೂಕು ಪಂಚಾಯತಿ",
  "Zilla Panchayat": "ಜಿಲ್ಲಾ ಪಂಚಾಯತಿ",
  "CESC Mysuru": "ಸೆಸ್ಕ್ ಮೈಸೂರು",
  "Education Department": "ಶಿಕ್ಷಣ ಇಲಾಖೆ",
  KSRTC: "ಕೆಎಸ್‌ಆರ್‌ಟಿಸಿ",
  "Rural Drinking Water & Sanitation Dept":
    "ಗ್ರಾಮೀಣ ಕುಡಿಯುವ ನೀರು ಮತ್ತು ನೈರ್ಮಲ್ಯ ಇಲಾಖೆ",
  "Panchayat Raj Engineering Division": "ಪಂಚಾಯತ್ ರಾಜ್ ಇಂಜಿನಿಯರಿಂಗ್ ವಿಭಾಗ",
  "Public Works Department": "ಲೋಕೋಪಯೋಗಿ ಇಲಾಖೆ",

  // ---------- reasons an office posts ----------
  "No funds until the Gram Sabha approves this work":
    "ಗ್ರಾಮ ಸಭೆ ಒಪ್ಪಿಗೆ ನೀಡುವವರೆಗೆ ಅನುದಾನ ಇಲ್ಲ",
  "Tabled for the October Gram Sabha": "ಅಕ್ಟೋಬರ್ ಗ್ರಾಮ ಸಭೆಗೆ ಮುಂದೂಡಲಾಗಿದೆ",
  "This asset belongs to another department": "ಈ ಆಸ್ತಿ ಬೇರೆ ಇಲಾಖೆಗೆ ಸೇರಿದ್ದು",
  "Route and timings are the depot's, not ours":
    "ಮಾರ್ಗ ಮತ್ತು ಸಮಯ ಡಿಪೋದ್ದು, ನಮ್ಮದಲ್ಲ",
  "Waiting for material or a spare part": "ಸಾಮಗ್ರಿ ಅಥವಾ ಬಿಡಿಭಾಗಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ",
  "Work order issued, contractor scheduled":
    "ಕಾರ್ಯಾದೇಶ ನೀಡಲಾಗಿದೆ, ಗುತ್ತಿಗೆದಾರರನ್ನು ನಿಗದಿಪಡಿಸಲಾಗಿದೆ",
  "No staff available for this trade": "ಈ ಕೆಲಸಕ್ಕೆ ಸಿಬ್ಬಂದಿ ಇಲ್ಲ",
  "Desilting rods ordered from the taluk store":
    "ಹೂಳು ತೆಗೆಯುವ ರಾಡ್‌ಗಳನ್ನು ತಾಲ್ಲೂಕು ಉಗ್ರಾಣದಿಂದ ತರಿಸಲಾಗಿದೆ",
  "Needs technical sanction above the Panchayat's limit":
    "ಪಂಚಾಯತಿಯ ಮಿತಿ ಮೀರಿದ ತಾಂತ್ರಿಕ ಮಂಜೂರಾತಿ ಬೇಕು",
  "Estimate above our limit, sent to the PRED":
    "ಅಂದಾಜು ನಮ್ಮ ಮಿತಿ ಮೀರಿದೆ, ಪಿಆರ್‌ಇಡಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ",
  "past deadline with nothing said": "ಗಡುವು ಮೀರಿ ಏನೂ ಹೇಳಿಲ್ಲ",

  // ---------- the microphone ----------
  Listening: "ಕೇಳಿಸುತ್ತಿದೆ",
  Ready: "ಸಿದ್ಧ",
  "Not listening": "ಕೇಳಿಸುತ್ತಿಲ್ಲ",
  Close: "ಮುಚ್ಚಿ",
  Again: "ಮತ್ತೆ",
  "Add to the report": "ದೂರಿಗೆ ಸೇರಿಸಿ",
  "Speak now. Say what is broken and where.":
    "ಈಗ ಮಾತನಾಡಿ. ಏನು ಹಾಳಾಗಿದೆ ಮತ್ತು ಎಲ್ಲಿ ಎಂದು ಹೇಳಿ.",
  "I am speaking": "ನಾನು ಮಾತನಾಡುವ ಭಾಷೆ",
  "Your words go in exactly as you say them.":
    "ನೀವು ಹೇಳಿದ್ದು ಹೇಳಿದ ಹಾಗೆಯೇ ದಾಖಲಾಗುತ್ತದೆ.",
  "Kannada": "ಕನ್ನಡ",
  "English": "ಇಂಗ್ಲಿಷ್",
  "Dictation needs a signal. The photo, the deadline and the send do not.":
    "ಧ್ವನಿಗೆ ನೆಟ್‌ವರ್ಕ್ ಬೇಕು. ಫೋಟೋ, ಗಡುವು ಮತ್ತು ಕಳುಹಿಸುವುದಕ್ಕೆ ಬೇಕಿಲ್ಲ.",
  "This browser cannot listen. Type it instead.":
    "ಈ ಬ್ರೌಸರ್ ಕೇಳಲಾರದು. ಬದಲಿಗೆ ಟೈಪ್ ಮಾಡಿ.",
  "Microphone blocked. Allow it in your browser settings.":
    "ಮೈಕ್ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ನಲ್ಲಿ ಅನುಮತಿ ಕೊಡಿ.",
  "Speech needs a signal. Type it instead.":
    "ಧ್ವನಿಗೆ ನೆಟ್‌ವರ್ಕ್ ಬೇಕು. ಬದಲಿಗೆ ಟೈಪ್ ಮಾಡಿ.",
  "Did not catch that.": "ಅದು ಕೇಳಿಸಲಿಲ್ಲ.",
  "Could not start the microphone.": "ಮೈಕ್ ಶುರು ಮಾಡಲಾಗಲಿಲ್ಲ."
};

export function makeT(lang: Lang) {
  return (english: string): string =>
    lang === "kn" ? KN[english] ?? english : english;
}

/* Sentences the app builds with a number in them. Kannada puts the unit
   after the figure the same way English does here, but the word order
   around it differs enough that a format string is clearer than
   stitching translated fragments together. */
export function ageText(hours: number, lang: Lang): string {
  const h = Math.max(0, Math.round(hours));
  if (h < 1) return lang === "kn" ? "ಈಗಷ್ಟೇ" : "just now";
  if (h < 48)
    return lang === "kn"
      ? `${h} ಗಂಟೆಯ ಹಿಂದೆ`
      : `${h} ${h === 1 ? "hour" : "hours"} old`;
  const d = Math.round(h / 24);
  return lang === "kn"
    ? `${d} ದಿನದ ಹಿಂದೆ`
    : `${d} ${d === 1 ? "day" : "days"} old`;
}

export function deadlineText(
  hoursLeft: number,
  sla: number,
  done: boolean,
  lang: Lang
): string {
  if (done)
    return lang === "kn" ? "ನಿವಾಸಿ ಮುಚ್ಚಿದ್ದಾರೆ" : "Closed by the resident";
  if (hoursLeft < 0) {
    const late = Math.abs(Math.round(hoursLeft));
    return lang === "kn"
      ? `ಗಡುವು ${late} ಗಂಟೆ ಮೀರಿದೆ`
      : `Deadline missed by ${late} hours`;
  }
  const left = Math.round(hoursLeft);
  return lang === "kn"
    ? `${sla}ರಲ್ಲಿ ${left} ಗಂಟೆ ಬಾಕಿ`
    : `${left} hours left of ${sla}`;
}

export function residentsText(n: number, lang: Lang): string {
  return lang === "kn" ? `+${n} ಇನ್ನಷ್ಟು ನಿವಾಸಿಗಳು` : `+${n} more residents`;
}

export function reopenedText(n: number, lang: Lang): string {
  return lang === "kn" ? `${n} ಬಾರಿ ಮತ್ತೆ ತೆರೆದಿದೆ` : `reopened ${n}×`;
}

/* ------------------------------------------------------------------
   Carrying the language down the tree.

   Every component on the screen needs the language and almost none of
   them need anything else from the top, so passing a `kannada` prop
   through five layers was making the signatures worse the further down
   it went. A context is the right shape for a value that is read
   everywhere and written in one place.
   ------------------------------------------------------------------ */

import { createContext, useContext } from "react";

const TRANSLATORS: Record<Lang, (english: string) => string> = {
  en: makeT("en"),
  kn: makeT("kn")
};

/* Kannada is the default, not the alternative. This is a Karnataka
   village; English is the second language here whatever the rest of the
   software people get handed assumes. */
export const LANG_KEY = "sethu.lang";

export function firstLanguage(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "kn" || saved === "en") return saved;
  } catch {
    /* storage off; fall through to the browser's own answer. */
  }
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "kn";
}

interface Language {
  lang: Lang;
  setLang: (next: Lang) => void;
}

export const LangContext = createContext<Language>({
  lang: "en",
  setLang: () => {}
});

export function useT() {
  const { lang, setLang } = useContext(LangContext);
  return { lang, setLang, t: TRANSLATORS[lang] };
}

export function stepText(n: number, total: number, lang: Lang): string {
  return lang === "kn"
    ? `${total} ಹಂತಗಳಲ್ಲಿ ${n}ನೇ ಹಂತ`
    : `Step ${n} of ${total}`;
}
