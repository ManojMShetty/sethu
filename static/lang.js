// lang.js - Kannada and English
//
// Vyasarajapura speaks Kannada. An English-only form is not a small
// inconvenience there, it is the difference between a resident filing a
// report and walking away from it.
//
// This is a retrofit and it is worth saying why, because the shape looks
// odd otherwise. The proper way is a key at every string in app.js. There
// are about a hundred of them, spread across code that is under test and
// working. Rewriting all of it the night before we present is the kind of
// change that breaks something quiet. So instead this sits on top: it
// watches what actually lands on the screen and swaps the text. app.js
// does not know it exists and does not have to change.
//
// The cost is that the dictionary is keyed on English sentences, so if
// someone edits a string in app.js the Kannada silently falls back to
// English for that one line. That is a real debt. It is also visible the
// moment you switch languages, which is the least bad way to owe it.
//
// Anything not in the table stays in English rather than showing a blank
// or a key name. A resident should never see machinery.

var STRINGS = {

  // ---------- top bar and tabs ----------
  "Gram Panchayat asset ledger": "ಗ್ರಾಮ ಪಂಚಾಯತಿ ಆಸ್ತಿ ದಾಖಲೆ",
  "connecting": "ಸಂಪರ್ಕವಾಗುತ್ತಿದೆ",
  "server": "ಸರ್ವರ್",
  "offline": "ಆಫ್‌ಲೈನ್",
  "local": "ಸ್ಥಳೀಯ",
  "Resident": "ನಿವಾಸಿ",
  "Panchayat staff": "ಪಂಚಾಯತಿ ಸಿಬ್ಬಂದಿ",
  "Report": "ದೂರು",
  "Ledger": "ದಾಖಲೆ",
  "Desk": "ಮೇಜು",

  "open": "ಬಾಕಿ ಇವೆ",
  "past deadline": "ಗಡುವು ಮೀರಿವೆ",
  "fixed and verified": "ಸರಿಪಡಿಸಿ ದೃಢಪಡಿಸಲಾಗಿದೆ",
  "repairs rejected": "ದುರಸ್ತಿ ತಿರಸ್ಕೃತ",
  "late, no reason given": "ತಡ, ಕಾರಣ ಹೇಳಿಲ್ಲ",

  "Demo clock": "ಪ್ರದರ್ಶನ ಗಡಿಯಾರ",
  "+1 hour": "+1 ಗಂಟೆ",
  "+24 hours": "+24 ಗಂಟೆ",
  "reset": "ಮರುಹೊಂದಿಸಿ",

  // ---------- the report form ----------
  "Report what's broken": "ಏನು ಹಾಳಾಗಿದೆ ಎಂದು ತಿಳಿಸಿ",
  "About twenty seconds. The photo is shrunk on your phone so it sends on a weak signal.":
    "ಸುಮಾರು ಇಪ್ಪತ್ತು ಸೆಕೆಂಡು. ಫೋಟೋವನ್ನು ನಿಮ್ಮ ಫೋನಿನಲ್ಲೇ ಚಿಕ್ಕದು ಮಾಡಲಾಗುತ್ತದೆ, ಹಾಗಾಗಿ ಕಡಿಮೆ ನೆಟ್‌ವರ್ಕ್‌ನಲ್ಲೂ ಹೋಗುತ್ತದೆ.",
  "Take a photo": "ಫೋಟೋ ತೆಗೆಯಿರಿ",
  "What is broken?": "ಏನು ಹಾಳಾಗಿದೆ?",
  "Where is it?": "ಎಲ್ಲಿದೆ?",
  "Finding your location": "ನಿಮ್ಮ ಸ್ಥಳ ಹುಡುಕಲಾಗುತ್ತಿದೆ",
  "Retry": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
  "Or pick the nearest landmark": "ಅಥವಾ ಹತ್ತಿರದ ಗುರುತು ಆರಿಸಿ",
  "Is it inside a school or anganwadi?": "ಇದು ಶಾಲೆ ಅಥವಾ ಅಂಗನವಾಡಿ ಒಳಗಿದೆಯೇ?",
  "Neither": "ಎರಡೂ ಅಲ್ಲ",
  "Anything to add?": "ಇನ್ನೇನಾದರೂ ಹೇಳಬೇಕೆ?",
  "Dark since Deepavali. Children walk here at 6am.":
    "ದೀಪಾವಳಿಯಿಂದ ಕತ್ತಲೆ. ಮಕ್ಕಳು ಬೆಳಿಗ್ಗೆ ಇಲ್ಲಿ ನಡೆದು ಹೋಗುತ್ತಾರೆ.",
  "Send report": "ದೂರು ಕಳುಹಿಸಿ",
  "Location pinned": "ಸ್ಥಳ ಗುರುತಿಸಲಾಗಿದೆ",
  "Location unavailable here. Pick a landmark below.":
    "ಇಲ್ಲಿ ಸ್ಥಳ ಸಿಗುತ್ತಿಲ್ಲ. ಕೆಳಗಿನ ಗುರುತು ಆರಿಸಿ.",

  // ---------- what can be broken ----------
  "Power line": "ವಿದ್ಯುತ್ ತಂತಿ",
  "live wire": "ಜೀವಂತ ತಂತಿ",
  "Dry pipeline": "ನಳದಲ್ಲಿ ನೀರಿಲ್ಲ",
  "no water at the tap": "ನಳದಲ್ಲಿ ನೀರು ಬರುತ್ತಿಲ್ಲ",
  "Bus never came": "ಬಸ್ ಬರಲಿಲ್ಲ",
  "no way out of here": "ಊರಿಂದ ಹೊರಗೆ ಹೋಗಲು ದಾರಿ ಇಲ್ಲ",
  "Hand pump": "ಕೈಪಂಪು",
  "only source": "ಇರುವುದು ಇದೊಂದೇ",
  "Garbage": "ಕಸ",
  "health risk": "ಆರೋಗ್ಯಕ್ಕೆ ಅಪಾಯ",
  "Toilet": "ಶೌಚಾಲಯ",
  "sanitation": "ನೈರ್ಮಲ್ಯ",
  "Drain": "ಚರಂಡಿ",
  "standing water": "ನೀರು ನಿಂತಿದೆ",
  "Streetlight": "ಬೀದಿ ದೀಪ",
  "unlit at night": "ರಾತ್ರಿ ಕತ್ತಲೆ",
  "Road hole": "ರಸ್ತೆ ಗುಂಡಿ",
  "slower to fix": "ಸರಿಪಡಿಸಲು ಹೆಚ್ಚು ಸಮಯ",
  "Other": "ಇತರೆ",

  // ---------- landmarks in the village ----------
  "Overhead tank": "ನೀರಿನ ಟ್ಯಾಂಕ್",
  "Bus stop, Sosale road": "ಬಸ್ ನಿಲ್ದಾಣ, ಸೋಸಲೆ ರಸ್ತೆ",
  "Gram Panchayat office": "ಗ್ರಾಮ ಪಂಚಾಯತಿ ಕಚೇರಿ",
  "Government school": "ಸರ್ಕಾರಿ ಶಾಲೆ",
  "Anganwadi centre": "ಅಂಗನವಾಡಿ ಕೇಂದ್ರ",
  "Health sub-centre": "ಆರೋಗ್ಯ ಉಪಕೇಂದ್ರ",
  "Ration shop": "ನ್ಯಾಯಬೆಲೆ ಅಂಗಡಿ",
  "Temple junction": "ದೇವಸ್ಥಾನ ವೃತ್ತ",
  "Borewell, north colony": "ಬೋರ್‌ವೆಲ್, ಉತ್ತರ ಕಾಲೋನಿ",
  "Transformer, Somanathapura road": "ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್, ಸೋಮನಾಥಪುರ ರಸ್ತೆ",

  // ---------- the ledger and the desk ----------
  "Public ledger": "ಸಾರ್ವಜನಿಕ ದಾಖಲೆ",
  "Every report in this Panchayat, with its deadline running in the open.":
    "ಈ ಪಂಚಾಯತಿಯ ಪ್ರತಿಯೊಂದು ದೂರು, ಅದರ ಗಡುವು ಎಲ್ಲರ ಕಣ್ಣ ಮುಂದೆ ಓಡುತ್ತಿದೆ.",
  "No reports yet. The first one starts the ledger.":
    "ಇನ್ನೂ ದೂರುಗಳಿಲ್ಲ. ಮೊದಲನೆಯದು ದಾಖಲೆಯನ್ನು ಶುರು ಮಾಡುತ್ತದೆ.",
  "Panchayat desk": "ಪಂಚಾಯತಿ ಮೇಜು",
  "Sorted by what breaches soonest, not by date. A job closes only when the resident who reported it confirms.":
    "ಯಾವುದು ಬೇಗ ಗಡುವು ಮೀರುತ್ತದೋ ಅದರ ಪ್ರಕಾರ ಜೋಡಿಸಲಾಗಿದೆ, ದಿನಾಂಕದ ಪ್ರಕಾರ ಅಲ್ಲ. ದೂರು ನೀಡಿದ ನಿವಾಸಿ ದೃಢಪಡಿಸಿದಾಗ ಮಾತ್ರ ಕೆಲಸ ಮುಗಿಯುತ್ತದೆ.",
  "Queue is clear. Nothing is open right now.":
    "ಸಾಲು ಖಾಲಿ. ಈಗ ಏನೂ ಬಾಕಿ ಇಲ್ಲ.",

  // ---------- status of a report ----------
  "Waiting to be assigned": "ನಿಯೋಜನೆಗೆ ಕಾಯುತ್ತಿದೆ",
  "Assigned to staff": "ಸಿಬ್ಬಂದಿಗೆ ವಹಿಸಲಾಗಿದೆ",
  "In progress, past deadline": "ನಡೆಯುತ್ತಿದೆ, ಗಡುವು ಮೀರಿದೆ",
  "Repair claimed, waiting for the resident":
    "ದುರಸ್ತಿ ಆಗಿದೆ ಎಂದು ಹೇಳಲಾಗಿದೆ, ನಿವಾಸಿಗಾಗಿ ಕಾಯುತ್ತಿದೆ",
  "Fixed, confirmed by the resident": "ಸರಿಪಡಿಸಲಾಗಿದೆ, ನಿವಾಸಿ ದೃಢಪಡಿಸಿದ್ದಾರೆ",
  "Closed by the resident": "ನಿವಾಸಿ ಮುಚ್ಚಿದ್ದಾರೆ",

  // ---------- who is on the hook ----------
  "Gram Panchayat": "ಗ್ರಾಮ ಪಂಚಾಯತಿ",
  "Taluk Panchayat": "ತಾಲ್ಲೂಕು ಪಂಚಾಯತಿ",
  "Zilla Panchayat": "ಜಿಲ್ಲಾ ಪಂಚಾಯತಿ",
  "CESC Mysuru": "ಸೆಸ್ಕ್ ಮೈಸೂರು",
  "Rural Drinking Water & Sanitation Dept":
    "ಗ್ರಾಮೀಣ ಕುಡಿಯುವ ನೀರು ಮತ್ತು ನೈರ್ಮಲ್ಯ ಇಲಾಖೆ",
  "Panchayat Raj Engineering Division": "ಪಂಚಾಯತ್ ರಾಜ್ ಇಂಜಿನಿಯರಿಂಗ್ ವಿಭಾಗ",
  "Public Works Department": "ಲೋಕೋಪಯೋಗಿ ಇಲಾಖೆ",
  "Education Department": "ಶಿಕ್ಷಣ ಇಲಾಖೆ",
  "KSRTC": "ಕೆಎಸ್‌ಆರ್‌ಟಿಸಿ",

  "Water operator": "ನೀರು ಸರಬರಾಜು ಸಿಬ್ಬಂದಿ",
  "Sanitation worker": "ನೈರ್ಮಲ್ಯ ಕಾರ್ಮಿಕ",
  "Contract electrician": "ಗುತ್ತಿಗೆ ವಿದ್ಯುತ್ ಕೆಲಸಗಾರ",
  "Lineman, Ward 4": "ಲೈನ್‌ಮನ್, ವಾರ್ಡ್ 4",

  // ---------- the reasons an office can give ----------
  "No funds until the Gram Sabha approves this work":
    "ಗ್ರಾಮ ಸಭೆ ಒಪ್ಪಿಗೆ ನೀಡುವವರೆಗೆ ಅನುದಾನ ಇಲ್ಲ",
  "This asset belongs to another department": "ಈ ಆಸ್ತಿ ಬೇರೆ ಇಲಾಖೆಗೆ ಸೇರಿದ್ದು",
  "Waiting for material or a spare part": "ಸಾಮಗ್ರಿ ಅಥವಾ ಬಿಡಿಭಾಗಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ",
  "Work order issued, contractor scheduled":
    "ಕಾರ್ಯಾದೇಶ ನೀಡಲಾಗಿದೆ, ಗುತ್ತಿಗೆದಾರರನ್ನು ನಿಗದಿಪಡಿಸಲಾಗಿದೆ",
  "No staff available for this trade": "ಈ ಕೆಲಸಕ್ಕೆ ಸಿಬ್ಬಂದಿ ಇಲ್ಲ",
  "Needs technical sanction above the Panchayat's limit":
    "ಪಂಚಾಯತಿಯ ಮಿತಿ ಮೀರಿದ ತಾಂತ್ರಿಕ ಮಂಜೂರಾತಿ ಬೇಕು",

  "Tabled for the October Gram Sabha": "ಅಕ್ಟೋಬರ್ ಗ್ರಾಮ ಸಭೆಗೆ ಮುಂದೂಡಲಾಗಿದೆ",
  "Route and timings are the depot's, not ours":
    "ಮಾರ್ಗ ಮತ್ತು ಸಮಯ ಡಿಪೋದ್ದು, ನಮ್ಮದಲ್ಲ",
  "Desilting rods ordered from the taluk store":
    "ಹೂಳು ತೆಗೆಯುವ ರಾಡ್‌ಗಳನ್ನು ತಾಲ್ಲೂಕು ಉಗ್ರಾಣದಿಂದ ತರಿಸಲಾಗಿದೆ",
  "Estimate above our limit, sent to the PRED":
    "ಅಂದಾಜು ನಮ್ಮ ಮಿತಿ ಮೀರಿದೆ, ಪಿಆರ್‌ಇಡಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ",

  // ---------- the report card, opened ----------
  "Close": "ಮುಚ್ಚಿ",
  "What has happened": "ಏನಾಗಿದೆ",
  "No description given.": "ವಿವರಣೆ ನೀಡಿಲ್ಲ.",
  "This affects me too": "ಇದು ನನಗೂ ತೊಂದರೆ",
  "Yes, it works": "ಹೌದು, ಸರಿಯಾಗಿದೆ",
  "No, still broken": "ಇಲ್ಲ, ಇನ್ನೂ ಹಾಳಾಗಿದೆ",
  "Take this job": "ಈ ಕೆಲಸ ತೆಗೆದುಕೊಳ್ಳಿ",
  "Mark repaired and attach proof": "ದುರಸ್ತಿ ಎಂದು ಗುರುತಿಸಿ ಸಾಕ್ಷಿ ಲಗತ್ತಿಸಿ",
  "Post this reason": "ಈ ಕಾರಣ ಹಾಕಿ",
  "Pick a reason": "ಕಾರಣ ಆರಿಸಿ",
  "Hand it to which department?": "ಯಾವ ಇಲಾಖೆಗೆ ವಹಿಸಬೇಕು?",
  "Tell the resident why it is not fixed":
    "ಏಕೆ ಸರಿಪಡಿಸಿಲ್ಲ ಎಂದು ನಿವಾಸಿಗೆ ತಿಳಿಸಿ",
  "Anything to add? The resident sees this.":
    "ಇನ್ನೇನಾದರೂ ಸೇರಿಸಬೇಕೆ? ಇದು ನಿವಾಸಿಗೆ ಕಾಣುತ್ತದೆ.",
  "Repair photo submitted by staff": "ಸಿಬ್ಬಂದಿ ಸಲ್ಲಿಸಿದ ದುರಸ್ತಿ ಫೋಟೋ",
  "Nobody has said why": "ಯಾರೂ ಕಾರಣ ಹೇಳಿಲ್ಲ",
  "Waiting on the resident": "ನಿವಾಸಿಗಾಗಿ ಕಾಯುತ್ತಿದೆ",
  "Is it actually fixed?": "ನಿಜವಾಗಿ ಸರಿಯಾಗಿದೆಯೇ?",
  "The deadline passed, so this moved up a level automatically. No officer approved it, and everyone can see it.":
    "ಗಡುವು ಮೀರಿತು, ಹಾಗಾಗಿ ಇದು ತಾನಾಗಿಯೇ ಒಂದು ಹಂತ ಮೇಲೆ ಹೋಯಿತು. ಯಾವ ಅಧಿಕಾರಿಯೂ ಒಪ್ಪಿಗೆ ನೀಡಿಲ್ಲ, ಮತ್ತು ಇದು ಎಲ್ಲರಿಗೂ ಕಾಣುತ್ತದೆ.",
  "The original date never changes. Only the current deadline restarts.":
    "ದೂರು ನೀಡಿದ ದಿನಾಂಕ ಎಂದಿಗೂ ಬದಲಾಗುವುದಿಲ್ಲ. ಈಗಿನ ಗಡುವು ಮಾತ್ರ ಮತ್ತೆ ಶುರುವಾಗುತ್ತದೆ.",
  "You cannot close this. The person who reported it decides, and the server enforces that - not this screen.":
    "ಇದನ್ನು ನೀವು ಮುಚ್ಚಲಾಗುವುದಿಲ್ಲ. ದೂರು ನೀಡಿದವರೇ ನಿರ್ಧರಿಸುತ್ತಾರೆ, ಮತ್ತು ಅದನ್ನು ಸರ್ವರ್ ಜಾರಿ ಮಾಡುತ್ತದೆ, ಈ ಪರದೆ ಅಲ್ಲ.",

  // ---------- speaking instead of typing ----------
  "Speak instead of typing": "ಟೈಪ್ ಮಾಡುವ ಬದಲು ಮಾತನಾಡಿ",
  "Listening. Tap to stop.": "ಕೇಳಿಸುತ್ತಿದೆ. ನಿಲ್ಲಿಸಲು ತಟ್ಟಿ.",
  "Did not catch that.": "ಅದು ಕೇಳಿಸಲಿಲ್ಲ.",
  "Microphone blocked. Allow it in your browser settings.":
    "ಮೈಕ್ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ನಲ್ಲಿ ಅನುಮತಿ ಕೊಡಿ.",
  "Speech needs a signal. Type it instead.":
    "ಧ್ವನಿಗೆ ನೆಟ್‌ವರ್ಕ್ ಬೇಕು. ಟೈಪ್ ಮಾಡಿ.",

  // ---------- what the app says back to you ----------
  "Choose what is broken first": "ಮೊದಲು ಏನು ಹಾಳಾಗಿದೆ ಎಂದು ಆರಿಸಿ",
  "Pick a reason first": "ಮೊದಲು ಕಾರಣ ಆರಿಸಿ",
  "Posted. The resident can see it.": "ಹಾಕಲಾಗಿದೆ. ನಿವಾಸಿಗೆ ಕಾಣುತ್ತದೆ.",
  "Added. More residents now reporting this.":
    "ಸೇರಿಸಲಾಗಿದೆ. ಈಗ ಹೆಚ್ಚು ನಿವಾಸಿಗಳು ಇದನ್ನು ವರದಿ ಮಾಡಿದ್ದಾರೆ.",
  "Closed. Thank you for checking.": "ಮುಚ್ಚಲಾಗಿದೆ. ಪರಿಶೀಲಿಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದ.",
  "Could not reach the ledger": "ದಾಖಲೆ ತಲುಪಲು ಆಗಲಿಲ್ಲ",
  "Could not load the ledger": "ದಾಖಲೆ ತೆರೆಯಲು ಆಗಲಿಲ್ಲ",
  "That did not work": "ಅದು ಆಗಲಿಲ್ಲ",
  "Add your report to theirs? It carries more weight than a separate one.":
    "ನಿಮ್ಮ ದೂರನ್ನು ಅವರದಕ್ಕೆ ಸೇರಿಸಬೇಕೆ? ಪ್ರತ್ಯೇಕ ದೂರಿಗಿಂತ ಇದಕ್ಕೆ ಹೆಚ್ಚು ತೂಕ.",

  // ---------- the timeline, written by the server ----------
  "Reported by a resident": "ನಿವಾಸಿಯೊಬ್ಬರು ದೂರು ನೀಡಿದರು",
  "Another resident reported the same problem":
    "ಇನ್ನೊಬ್ಬ ನಿವಾಸಿ ಇದೇ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿದರು",
  "Staff submitted repair proof. Waiting for the resident who reported it.":
    "ಸಿಬ್ಬಂದಿ ದುರಸ್ತಿಯ ಸಾಕ್ಷಿ ಸಲ್ಲಿಸಿದ್ದಾರೆ. ದೂರು ನೀಡಿದ ನಿವಾಸಿಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ.",
  "Resident says it is still broken. Reopened, and the clock restarted.":
    "ಇನ್ನೂ ಹಾಳಾಗಿದೆ ಎಂದು ನಿವಾಸಿ ಹೇಳಿದ್ದಾರೆ. ಮತ್ತೆ ತೆರೆಯಲಾಗಿದೆ, ಗಡಿಯಾರ ಮರುಪ್ರಾರಂಭ.",
  "Resident confirmed the repair. Report closed.":
    "ನಿವಾಸಿ ದುರಸ್ತಿಯನ್ನು ದೃಢಪಡಿಸಿದ್ದಾರೆ. ದೂರು ಮುಚ್ಚಲಾಗಿದೆ."
};

// Sentences the app builds at runtime with a number or a name inside them.
// Each rule gets the matched pieces and hands back the Kannada, running
// the pieces back through the table so a place or a department inside a
// sentence is translated too.
var PATTERNS = [
  [/^(\d+) minutes? old$/,       function (m) { return m[1] + " ನಿಮಿಷದ ಹಿಂದೆ"; }],
  [/^(\d+) hours? old$/,         function (m) { return m[1] + " ಗಂಟೆಯ ಹಿಂದೆ"; }],
  [/^(\d+) days? old$/,          function (m) { return m[1] + " ದಿನದ ಹಿಂದೆ"; }],
  [/^(\d+) hours? left of (\d+)$/,
    function (m) { return m[2] + "ರಲ್ಲಿ " + m[1] + " ಗಂಟೆ ಬಾಕಿ"; }],
  [/^Deadline missed by (\d+) hours?$/,
    function (m) { return "ಗಡುವು " + m[1] + " ಗಂಟೆ ಮೀರಿದೆ"; }],
  [/^\+(\d+) more residents?$/,
    function (m) { return "+" + m[1] + " ಇನ್ನಷ್ಟು ನಿವಾಸಿಗಳು"; }],
  [/^reopened (\d+) times?$/,
    function (m) { return m[1] + " ಬಾರಿ ಮತ್ತೆ ತೆರೆದಿದೆ"; }],
  [/^Escalated to (.+)$/,
    function (m) { return one(m[1]) + "ಗೆ ಏರಿಸಲಾಗಿದೆ"; }],
  [/^Escalated to (.+?) automatically\.?$/,
    function (m) { return "ತಾನಾಗಿಯೇ " + one(m[1]) + "ಗೆ ಏರಿಸಲಾಗಿದೆ."; }],
  [/^No reason given by the (.+)$/,
    function (m) { return one(m[1]) + " ಕಾರಣ ಹೇಳಿಲ್ಲ"; }],
  [/^Reported (.+), reopened (\d+) times?$/,
    function (m) { return one(m[1]) + " ದೂರು, " + m[2] + " ಬಾರಿ ಮತ್ತೆ ತೆರೆದಿದೆ"; }],
  [/^(\d+)h · (.+)$/,
    function (m) { return m[1] + " ಗಂಟೆ · " + one(m[2]); }],
  [/^Pinned at (.+)$/,
    function (m) { return "ಗುರುತಿಸಿದ ಸ್ಥಳ " + m[1]; }],
  [/^Added to (.+)$/,
    function (m) { return m[1] + "ಗೆ ಸೇರಿಸಲಾಗಿದೆ"; }],
  [/^Assigned to (.+)$/,
    function (m) { return one(m[1]) + "ಗೆ ವಹಿಸಲಾಗಿದೆ"; }],
  [/^(\d+) KB, small enough for a weak signal$/,
    function (m) { return m[1] + " ಕೆಬಿ, ಕಡಿಮೆ ನೆಟ್‌ವರ್ಕ್‌ಗೂ ಸಾಕು"; }],
  // The line under the title in an opened card:
  //   Government school · 3 residents reporting · deadline 48 hours
  [/^(.+) · (\d+) residents? reporting · deadline (\d+) hours?$/,
    function (m) {
      return one(m[1]) + " · " + m[2] + " ನಿವಾಸಿಗಳು ವರದಿ ಮಾಡಿದ್ದಾರೆ · ಗಡುವು " +
             m[3] + " ಗಂಟೆ";
    }],
  // The line above the title on a card in the list:
  //   VYS-0007 · Government school · 61 hours old
  [/^(\S+) · (.+) · (.+ (?:old|ಹಿಂದೆ))$/,
    function (m) { return m[1] + " · " + one(m[2]) + " · " + one(m[3]); }],
  // Deadline passed. Escalated to Taluk Panchayat automatically. No officer approved this.
  [/^Deadline passed\. Escalated to (.+) automatically\. No officer approved this\.$/,
    function (m) {
      return "ಗಡುವು ಮೀರಿತು. ತಾನಾಗಿಯೇ " + one(m[1]) +
             "ಗೆ ಏರಿಸಲಾಗಿದೆ. ಯಾವ ಅಧಿಕಾರಿಯೂ ಇದನ್ನು ಒಪ್ಪಿಲ್ಲ.";
    }],
  [/^(.+) gave a reason: (.+)$/,
    function (m) { return one(m[1]) + " ಕಾರಣ ನೀಡಿದೆ: " + one(m[2]); }],
  // The detail after a reason label arrives as its own text node.
  [/^· (.+)$/, function (m) { return "· " + one(m[1]); }],
  [/^What the (.+) has said$/,
    function (m) { return one(m[1]) + " ಹೇಳಿರುವುದು"; }],
  [/^This is past its deadline and the (.+) has not given a reason\. Silence is not a status a resident should have to accept\.$/,
    function (m) {
      return "ಇದು ಗಡುವು ಮೀರಿದೆ ಮತ್ತು " + one(m[1]) +
             " ಇದುವರೆಗೆ ಕಾರಣ ಹೇಳಿಲ್ಲ. ಮೌನ ಎಂಬುದು ನಿವಾಸಿ ಒಪ್ಪಿಕೊಳ್ಳಬೇಕಾದ ಸ್ಥಿತಿ ಅಲ್ಲ.";
    }]
];

// Translate one phrase, or hand it straight back if we have nothing.
function one(text) {
  if (Lang.code === "en") return text;
  // Text pulled out of HTML arrives with the source file's line breaks and
  // indentation still in it. Flatten before looking anything up.
  var key = String(text).trim().replace(/\s+/g, " ");
  if (STRINGS[key]) return STRINGS[key];
  for (var i = 0; i < PATTERNS.length; i++) {
    var found = key.match(PATTERNS[i][0]);
    if (found) return PATTERNS[i][1](found);
  }
  return text;
}

var Lang = {

  code: "en",
  original: null,          // English text, kept so we can switch back

  // A phone set to Kannada gets Kannada without anyone tapping anything.
  // Everyone else gets English and a button. Judges included.
  pick: function () {
    var saved = localStorage.getItem("sethu.lang");
    if (saved) return saved;
    return /^kn\b/i.test(navigator.language || "") ? "kn" : "en";
  },

  set: function (code) {
    this.code = code;
    try { localStorage.setItem("sethu.lang", code); } catch (e) {}
    document.documentElement.lang = code;
    var button = document.getElementById("langButton");
    if (button) button.textContent = code === "kn" ? "English" : "ಕನ್ನಡ";
    this.sweep(document.body);
  },

  // Walk what is on screen and swap the text. Attributes carrying text a
  // person reads get the same treatment. We remember the English on the
  // node itself, so switching back is exact rather than a reverse lookup.
  sweep: function (root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim()) continue;
      if (node.parentNode && node.parentNode.tagName === "SCRIPT") continue;
      if (node.sethuEnglish === undefined) node.sethuEnglish = node.nodeValue;
      var english = node.sethuEnglish;
      var flat = english.trim().replace(/\s+/g, " ");
      var swapped = one(flat);
      if (swapped === flat) {
        node.nodeValue = english;
      } else {
        node.nodeValue = english.match(/^\s*/)[0] + swapped +
                         english.match(/\s*$/)[0];
      }
    }

    var fields = root.querySelectorAll ?
                 root.querySelectorAll("[placeholder]") : [];
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      if (field.sethuEnglish === undefined) {
        field.sethuEnglish = field.getAttribute("placeholder");
      }
      field.setAttribute("placeholder", one(field.sethuEnglish));
    }
  },

  start: function () {
    var style = document.createElement("style");
    style.textContent =
      "#langButton{background:none;color:var(--paper);border:1px solid " +
      "rgba(251,250,246,.45);border-radius:3px;padding:8px 11px;font:inherit;" +
      "font-size:13px;font-weight:600;cursor:pointer;min-height:44px}";
    document.head.appendChild(style);

    var self = this;
    var button = document.getElementById("langButton");
    if (button) {
      button.onclick = function () { self.set(self.code === "kn" ? "en" : "kn"); };
    }

    // app.js redraws the ledger every few seconds and rebuilds the popup
    // from scratch. Rather than ask it to call us, watch for the new nodes.
    var pending = false;
    new MutationObserver(function () {
      if (pending || self.code === "en") return;
      pending = true;
      setTimeout(function () { pending = false; self.sweep(document.body); }, 0);
    }).observe(document.body, { childList: true, subtree: true });

    this.set(this.pick());
  }
};

document.addEventListener("DOMContentLoaded", function () { Lang.start(); });
