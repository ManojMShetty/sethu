// voice.js - speak the note instead of typing it
//
// Everything else on the report form is a button. The note is the one
// place a resident has to write, and in Vyasarajapura that is exactly the
// person we are most likely to lose: someone who can see the broken tap,
// can point a camera at it, and cannot spell it out on a phone keyboard.
//
// So the mic sits on the note field and nowhere else. It is not a way to
// drive the app by talking. It fills one box.
//
// What this uses and what that costs:
//
//   The browser's own speech recognition. No key, no server of ours, no
//   model to ship. Chrome on Android sends the audio to Google and sends
//   text back, which means THIS PART NEEDS A SIGNAL. The rest of the form
//   works with no network at all. Say that out loud rather than letting
//   someone find it: the photo, the category, the location and the send
//   all survive a dead tower. The dictation does not.
//
//   It also needs https. On a plain-http origin the browser refuses and
//   gives no warning, so we check and hide the button instead of showing
//   one that does nothing.
//
// Where it is not available at all, there is no button and no apology.
// The keyboard is still there.

var Voice = {

  engine: window.SpeechRecognition || window.webkitSpeechRecognition,
  session: null,          // the running recogniser, if any
  target: null,           // the textarea it is filling

  available: function () {
    return Boolean(this.engine) && window.isSecureContext;
  },

  // Kannada speech into a Kannada form. If someone switches the app to
  // English mid-report the next tap listens in Indian English instead.
  listeningLanguage: function () {
    return (typeof Lang !== "undefined" && Lang.code === "kn") ? "kn-IN" : "en-IN";
  },

  attach: function (area) {
    if (!this.available()) return;
    if (area.sethuVoice) return;
    area.sethuVoice = true;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "voiceButton";
    button.textContent = "Speak instead of typing";

    area.parentNode.insertBefore(button, area.nextSibling);

    var self = this;
    button.onclick = function () {
      if (self.session && self.target === area) self.stop();
      else self.start(area, button);
    };
  },

  start: function (area, button) {
    this.stop();

    var recogniser = new this.engine();
    recogniser.lang = this.listeningLanguage();
    recogniser.continuous = true;
    recogniser.interimResults = true;

    // Whatever was already typed stays. Speech is added to it, so a
    // resident can type a word, say the rest, and not lose either.
    var existing = area.value ? area.value.replace(/\s+$/, "") + " " : "";
    var settled = "";

    var self = this;

    recogniser.onresult = function (event) {
      var pending = "";
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) settled += piece + " ";
        else pending += piece;
      }
      area.value = existing + settled + pending;
    };

    recogniser.onerror = function (event) {
      if (event.error === "no-speech") self.say("Did not catch that.");
      else if (event.error === "not-allowed")
        self.say("Microphone blocked. Allow it in your browser settings.");
      else if (event.error === "network")
        self.say("Speech needs a signal. Type it instead.");
      self.stop();
    };

    // Fires when we stop it and also when the browser gives up on its own
    // after a silence, so the button has to be reset from here, not from
    // the click handler.
    recogniser.onend = function () {
      if (self.session === recogniser) self.reset();
    };

    recogniser.start();

    this.session = recogniser;
    this.target = area;
    button.className = "voiceButton listening";
    button.textContent = "Listening. Tap to stop.";
    this.button = button;
  },

  stop: function () {
    if (!this.session) return;
    var finished = this.session;
    this.session = null;
    try { finished.stop(); } catch (error) { /* already stopped */ }
    this.reset();
  },

  reset: function () {
    this.session = null;
    this.target = null;
    if (this.button) {
      this.button.className = "voiceButton";
      this.button.textContent = "Speak instead of typing";
      this.button = null;
    }
  },

  say: function (text) {
    if (typeof showMessage === "function") showMessage(text);
  },

  start_: null,

  begin: function () {
    if (!this.available()) return;

    var style = document.createElement("style");
    style.textContent =
      ".voiceButton{width:100%;margin-top:8px;padding:13px;font:inherit;" +
      "font-size:15px;font-weight:600;cursor:pointer;border-radius:3px;" +
      "min-height:48px;background:var(--wash);color:var(--ink-2);" +
      "border:1px dashed var(--line)}" +
      ".voiceButton.listening{background:#F6E2DF;color:var(--zilla);" +
      "border:1px solid var(--zilla)}";
    document.head.appendChild(style);

    var self = this;
    function scan() {
      var areas = document.querySelectorAll("textarea");
      for (var i = 0; i < areas.length; i++) self.attach(areas[i]);
    }
    scan();

    // The staff reason box is built fresh every time a card is opened, so
    // its textarea does not exist at load. Watch for it rather than asking
    // app.js to call us.
    new MutationObserver(scan).observe(document.body,
                                       { childList: true, subtree: true });
  }
};

document.addEventListener("DOMContentLoaded", function () { Voice.begin(); });
