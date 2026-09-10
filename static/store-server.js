// store-server.js
// One of the two backends. Talks to server.py.
//
// Every method returns an object with .ok on it. app.js checks .ok on
// EVERY call - a server that says "no" must never surface as a success
// toast, which is the single easiest way to lie to yourself on stage.

var ServerApi = {

  name: "server",

  async post(path, body) {
    var response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    var data = await response.json();
    data.status = response.status;      // 403 and 409 are answers, not crashes
    return data;
  },

  async listReports() {
    var response = await fetch("/api/reports", { cache: "no-store" });
    if (!response.ok) throw new Error("ledger unavailable");
    return await response.json();       // { now, rules, reports: [...] }
  },

  // Photos are fetched one at a time, only when a card is opened. They
  // never travel in the ledger payload, which is what makes polling
  // affordable on the weak signal we compress photos for.
  async getPhoto(id, kind) {
    var url = "/api/photo?id=" + encodeURIComponent(id) +
              "&kind=" + encodeURIComponent(kind);
    var response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()).photo;
  },

  addReport(data)             { return this.post("/api/report", data); },
  addVoice(id, token)         { return this.post("/api/voice",
                                                 { id: id, token: token }); },
  assign(id, worker)          { return this.post("/api/assign",
                                                 { id: id, worker: worker }); },
  markRepaired(id, photo)     { return this.post("/api/repaired",
                                                 { id: id, photo: photo }); },
  confirmFix(id, works, tok)  { return this.post("/api/confirm",
                                    { id: id, works: works, token: tok }); },
  shiftClock(body)            { return this.post("/api/clock", body); },
  reset()                     { return this.post("/api/reset", {}); }
};
