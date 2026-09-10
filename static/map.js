// map.js - put the pin on a map instead of guessing from a list
//
// The landmark dropdown was always a fallback, and a poor one. Ten names
// hardcoded for one village is fine until someone stands next to the
// eleventh pole. A map is what a person actually means by "here": they
// can see the road they are on and put the pin on the thing that is
// broken, to within a few metres.
//
// So the order of preference is now:
//
//   1. GPS. If the phone knows where it is, the pin starts there and the
//      map is confirmation, not work. Most reports need no interaction.
//   2. The map. GPS is wrong more often than people expect, especially
//      indoors and on village edges where the towers are far apart. Drag
//      the pin and the report follows it.
//   3. The dropdown, and only if the map could not load at all. It is
//      the one option that needs no network, which is why it stays.
//
// The cost, stated plainly because it cuts against the rest of the app:
// a map is tiles, and tiles are network. Everything else on this form
// works with a dead tower. This does not. When it cannot load we do not
// show a grey box and an apology, we put the dropdown back and get out
// of the way.
//
// Tiles come from OpenStreetMap, which is free and fine at the volume a
// Panchayat generates. A district-wide rollout needs its own tile server
// or a paid one; their usage policy is explicit about that, and it is
// the kind of thing that stops working on the day it matters if nobody
// reads it first.

var MapPin = {

  // Vyasarajapura, T. Narasipura taluk. Where the map opens when the
  // phone has no idea where it is.
  HOME: { lat: 12.2758, lng: 76.8816 },
  ZOOM: 16,

  // Drop the pin within this many metres of a known landmark and the
  // report gets that landmark's name instead of a pair of numbers. A
  // name is what the person reading the ledger can act on.
  SNAP_METRES: 300,

  map: null,
  marker: null,

  // ---------------------------------------------------------- geometry

  metresBetween: function (lat1, lng1, lat2, lng2) {
    var R = 6371000;
    var p1 = lat1 * Math.PI / 180;
    var p2 = lat2 * Math.PI / 180;
    var dp = (lat2 - lat1) * Math.PI / 180;
    var dl = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  },

  nearestLandmark: function (lat, lng) {
    var list = window.LANDMARKS || [];
    var best = null;
    var bestDistance = this.SNAP_METRES;
    for (var i = 0; i < list.length; i++) {
      var away = this.metresBetween(lat, lng, list[i].lat, list[i].lng);
      if (away <= bestDistance) { best = list[i]; bestDistance = away; }
    }
    return best;
  },

  // ------------------------------------------------- the actual answer

  // app.js reads myLatitude, myLongitude and myPlace when the report is
  // sent. This is the only place we write them, so there is one way for
  // a location to be set no matter which of the three routes set it.
  setPoint: function (lat, lng) {
    window.myLatitude = lat;
    window.myLongitude = lng;

    var near = this.nearestLandmark(lat, lng);
    window.myPlace = near ? near.name : null;

    var text = document.getElementById("locationText");
    if (text) {
      text.textContent = near ? near.name
        : "Pinned at " + lat.toFixed(5) + ", " + lng.toFixed(5);
      if (typeof Lang !== "undefined") Lang.sweep(text.parentNode);
    }
  },

  movePin: function (lat, lng, recentre) {
    if (!this.marker) return;
    this.marker.setLatLng([lat, lng]);
    if (recentre) this.map.setView([lat, lng], Math.max(this.map.getZoom(), 16));
    this.setPoint(lat, lng);
  },

  locate: function () {
    if (!navigator.geolocation) return;
    var self = this;
    navigator.geolocation.getCurrentPosition(function (position) {
      self.movePin(position.coords.latitude, position.coords.longitude, true);
    }, function () {
      // app.js has already told the user in words. Leave the pin where
      // it is rather than yanking it back to the village centre.
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  },

  // ------------------------------------------------------------- setup

  build: function () {
    var box = document.getElementById("mapBox");
    if (!box || typeof L === "undefined") return this.degrade();

    this.map = L.map(box, { zoomControl: true })
                .setView([this.HOME.lat, this.HOME.lng], this.ZOOM);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(this.map);

    this.marker = L.marker([this.HOME.lat, this.HOME.lng], { draggable: true })
                   .addTo(this.map);

    var self = this;
    this.marker.on("dragend", function () {
      var at = self.marker.getLatLng();
      self.setPoint(at.lat, at.lng);
    });
    // Tapping is easier than dragging on a phone held in one hand.
    this.map.on("click", function (event) {
      self.movePin(event.latlng.lat, event.latlng.lng, false);
    });

    var hint = document.getElementById("mapHint");
    if (hint) hint.textContent = "Drag the pin to the exact spot";

    // The map is the primary answer now, so the list of ten names only
    // gets in the way. It comes back in degrade() if we never got here.
    var select = document.getElementById("placeSelect");
    if (select) {
      select.classList.add("hidden");
      var label = select.previousElementSibling;
      select.onchange = function () {
        var list = window.LANDMARKS || [];
        for (var i = 0; i < list.length; i++) {
          if (list[i].name === select.value) {
            self.movePin(list[i].lat, list[i].lng, true);
          }
        }
      };
      if (label && label.tagName === "LABEL") label.classList.add("hidden");
    }

    // Leaflet measures its container when it is created. The report
    // screen is hidden while you are on the ledger, so coming back
    // leaves it rendered at zero height until we ask it to look again.
    var reportTab = document.getElementById("tabReport");
    if (reportTab) {
      reportTab.addEventListener("click", function () {
        setTimeout(function () { self.map.invalidateSize(); }, 60);
      });
    }

    // app.js already asked for the position; asking again reuses the
    // same permission and the cached fix, so there is no second prompt.
    var retry = document.getElementById("locationButton");
    if (retry) retry.addEventListener("click", function () { self.locate(); });
    this.locate();
  },

  // No tiles, no map. Put the dropdown back and say why in one line.
  degrade: function () {
    var box = document.getElementById("mapBox");
    if (box) box.parentNode.removeChild(box);
    var hint = document.getElementById("mapHint");
    if (hint) {
      hint.textContent = "Map could not load. Pick a landmark instead.";
    }
    if (typeof Lang !== "undefined") Lang.sweep(document.body);
  },

  // ------------------------------------------------------------- boot

  strings: function () {
    if (typeof STRINGS === "undefined") return;
    STRINGS["Drag the pin to the exact spot"] =
      "ಪಿನ್ ಅನ್ನು ಸರಿಯಾದ ಜಾಗಕ್ಕೆ ಎಳೆಯಿರಿ";
    STRINGS["Map could not load. Pick a landmark instead."] =
      "ನಕ್ಷೆ ತೆರೆಯಲಿಲ್ಲ. ಬದಲಿಗೆ ಹತ್ತಿರದ ಗುರುತು ಆರಿಸಿ.";
  },

  begin: function () {
    this.strings();

    var style = document.createElement("style");
    style.textContent =
      "#mapBox{height:230px;margin-top:8px;border:1px solid var(--line);" +
      "border-radius:3px;background:var(--wash)}" +
      "#mapHint{display:block;font-size:12px;color:var(--ink-3);margin-top:6px}" +
      "@media (min-width:900px){#mapBox{height:320px}}" +
      ".leaflet-container{font:inherit}";
    document.head.appendChild(style);

    var anchor = document.getElementById("placeSelect");
    if (!anchor) return;

    var box = document.createElement("div");
    box.id = "mapBox";
    anchor.parentNode.insertBefore(box, anchor);

    var hint = document.createElement("small");
    hint.id = "mapHint";
    anchor.parentNode.insertBefore(hint, anchor);

    // Leaflet is fetched rather than bundled, so a phone with no signal
    // fails here and lands in degrade() instead of hanging on a blank
    // square. The timeout is what catches a captive portal, which
    // answers the request but never returns the file.
    var self = this;
    var settled = false;
    function finish(ok) {
      if (settled) return;
      settled = true;
      if (ok) self.build(); else self.degrade();
    }

    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
    document.head.appendChild(css);

    var script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
    script.onload = function () { finish(true); };
    script.onerror = function () { finish(false); };
    document.head.appendChild(script);

    setTimeout(function () { finish(false); }, 6000);
  }
};

document.addEventListener("DOMContentLoaded", function () { MapPin.begin(); });
