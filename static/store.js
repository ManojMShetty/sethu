// store.js
// Picks a backend once, at boot, and then gets out of the way.
//
// app.js talks to Store and to nothing else. It never calls fetch(), and
// it never asks which mode it is in - which is why the same UI code runs
// with a Python server behind it or with nothing behind it at all.

var Store = {

  api: LocalApi,          // safe default: works with no server at all
  mode: "local",

  // A clean 200 from /api/health means server.py is up. Anything else -
  // a 404 from a plain static server, a refused connection, a hang - and
  // we quietly fall back. One second, then we stop waiting.
  async start() {
    try {
      var control = new AbortController();
      var timer = setTimeout(function () { control.abort(); }, 1000);
      var response = await fetch("/api/health", { signal: control.signal });
      clearTimeout(timer);
      if (response.ok) {
        this.api = ServerApi;
        this.mode = "server";
      }
    } catch (error) {
      // No server. LocalApi is already in place. Not an error condition.
    }
    return this.mode;
  },

  listReports()               { return this.api.listReports(); },
  getPhoto(id, kind)          { return this.api.getPhoto(id, kind); },
  addReport(data)             { return this.api.addReport(data); },
  addVoice(id, token)         { return this.api.addVoice(id, token); },
  assign(id, worker)          { return this.api.assign(id, worker); },
  markRepaired(id, photo)     { return this.api.markRepaired(id, photo); },
  confirmFix(id, works, tok)  { return this.api.confirmFix(id, works, tok); },
  shiftClock(body)            { return this.api.shiftClock(body); },
  reset()                     { return this.api.reset(); }
};
