import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useT } from "../i18n";
import { CrosshairIcon } from "./Bits";

/* Put the pin on a map rather than guessing from a list.
 *
 * A dropdown of ten landmark names is fine until someone stands next to
 * the eleventh pole. A map is what a person actually means by "here":
 * they can see the road they are on and drop the pin on the thing that
 * is broken, to within a few metres.
 *
 * Order of preference: GPS first, because if the phone knows where it
 * is the report needs no interaction at all. The map second, because
 * GPS is wrong more often than people expect on village edges where
 * the towers are far apart. The landmark list only if the tiles never
 * arrive, since it is the one option that needs no network.
 *
 * That is the honest cost of this screen: tiles are network. Everything
 * else on the form works with a dead tower.
 */

export interface Spot {
  lat: number;
  lng: number;
  name: string | null;
}

/* Vyasarajapura, T. Narasipura taluk. Anchored on Somanathapura's
   recorded position, so the district and the roads are right and the
   points are good to about a kilometre. Confirm the NAMES in the
   village; that is the one thing the internet cannot give you. */
export const LANDMARKS = [
  { name: "Overhead tank", lat: 12.2769, lng: 76.8821 },
  { name: "Bus stop, Sosale road", lat: 12.2762, lng: 76.8808 },
  { name: "Gram Panchayat office", lat: 12.2755, lng: 76.8813 },
  { name: "Anganwadi centre", lat: 12.2751, lng: 76.8825 },
  { name: "Government school", lat: 12.2747, lng: 76.8809 },
  { name: "Health sub-centre", lat: 12.2764, lng: 76.8831 },
  { name: "Ration shop", lat: 12.2758, lng: 76.8803 },
  { name: "Temple junction", lat: 12.2743, lng: 76.8818 },
  { name: "Borewell, north colony", lat: 12.2775, lng: 76.8814 },
  { name: "Transformer, Somanathapura road", lat: 12.2752, lng: 76.8836 }
];

const HOME = { lat: 12.2758, lng: 76.8816 };
const SNAP_METRES = 300;

function metresBetween(a: Spot, b: { lat: number; lng: number }) {
  const R = 6371000;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dp = ((b.lat - a.lat) * Math.PI) / 180;
  const dl = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* Drop the pin near a known landmark and the report takes its name. A
   name is what the person reading the ledger can act on; a pair of
   decimals is not. */
function nameFor(at: Spot): string | null {
  let best: string | null = null;
  let closest = SNAP_METRES;
  for (const spot of LANDMARKS) {
    const away = metresBetween(at, spot);
    if (away <= closest) {
      best = spot.name;
      closest = away;
    }
  }
  return best;
}

export default function MapPicker({
  value,
  onChange
}: {
  value: Spot | null;
  onChange: (spot: Spot) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [ready, setReady] = useState<"loading" | "ok" | "failed">("loading");
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);
  const { t } = useT();

  function place(lat: number, lng: number, recentre: boolean) {
    const spot: Spot = { lat, lng, name: null };
    spot.name = nameFor(spot);
    marker.current?.setLatLng([lat, lng]);
    if (recentre) map.current?.setView([lat, lng], 16);
    onChange(spot);
  }

  useEffect(() => {
    if (!host.current || map.current) return;

    const m = L.map(host.current, { zoomControl: true, attributionControl: true })
      .setView([HOME.lat, HOME.lng], 16);

    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    });
    // A captive portal answers the request and never returns the tile,
    // so a timeout is what actually catches "no usable network".
    const giveUp = window.setTimeout(
      () => setReady((r) => (r === "loading" ? "failed" : r)),
      6000
    );
    // Leaflet fires "load" when it has finished trying, which includes
    // finishing by failing on every tile. So a failure has to be sticky
    // or the grey square wins the race and we never fall back.
    let failures = 0;
    tiles.on("tileerror", () => {
      failures += 1;
      if (failures >= 2) setReady("failed");
    });
    tiles.on("load", () => {
      window.clearTimeout(giveUp);
      setReady((r) => (r === "failed" ? r : "ok"));
    });
    tiles.addTo(m);

    // A default Leaflet marker needs image assets resolved through the
    // bundler. A drawn pin needs nothing and matches the palette.
    const pin = L.divIcon({
      className: "",
      iconSize: [26, 34],
      iconAnchor: [13, 32],
      html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 33C13 33 24 20.5 24 13A11 11 0 1 0 2 13c0 7.5 11 20 11 20z"
              fill="var(--c-teal)" stroke="var(--c-surface)" stroke-width="2"/>
        <circle cx="13" cy="13" r="4" fill="var(--c-surface)"/>
      </svg>`
    });

    marker.current = L.marker([HOME.lat, HOME.lng], { draggable: true, icon: pin }).addTo(m);
    marker.current.on("dragend", () => {
      const at = marker.current!.getLatLng();
      place(at.lat, at.lng, false);
    });
    // Tapping is easier than dragging on a phone held in one hand.
    m.on("click", (e: L.LeafletMouseEvent) => place(e.latlng.lat, e.latlng.lng, false));

    map.current = m;
    findMe();

    return () => {
      window.clearTimeout(giveUp);
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function findMe() {
    if (!navigator.geolocation) {
      setDenied(true);
      return;
    }
    setLocating(true);
    setDenied(false);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        place(p.coords.latitude, p.coords.longitude, true);
        setLocating(false);
      },
      () => {
        // Refused, or no fix. Either way the map is still usable by
        // hand, so say that instead of showing an error.
        setLocating(false);
        setDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  const label = value
    ? value.name
      ? t(value.name)
      : `${t("Pinned at")} ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
    : t("Drop the pin on what is broken");

  return (
    <div>
      {/* The one control on this screen that saves a person any work,
          so it is a button and not a link in the corner. Once there is
          a pin it steps back to an outline, because by then the map is
          the thing to look at. */}
      <button
        onClick={findMe}
        disabled={locating}
        className={`flex w-full items-center justify-center gap-2 rounded-[var(--r-ctl)] border py-3.5 text-[15px] font-semibold transition ${
          value
            ? "border-rule text-ink2 hover:border-teal hover:text-teal"
            : "border-teal bg-teal text-tealink shadow-[var(--shadow-card)] hover:opacity-90"
        } disabled:opacity-60`}
      >
        <CrosshairIcon size={18} />
        {locating
          ? t("Finding your location…")
          : value
            ? t("Locate me again")
            : t("Use my location")}
      </button>

      {denied && (
        <p className="mt-2 rounded-[10px] bg-amberwash px-3 py-2 text-[12.5px] text-late">
          {t("Location is off. Drop the pin by hand.")}
        </p>
      )}

      <div className="mt-2.5 flex items-center gap-3 rounded-[var(--r-ctl)] bg-sunken px-3.5 py-2.5">
        <span className="figure min-w-0 flex-1 truncate text-[13.5px] text-ink2">
          {label}
        </span>
      </div>

      <div
        ref={host}
        className="mt-2.5 h-[240px] w-full max-w-full overflow-hidden rounded-[var(--r-ctl)] bg-sunken sm:h-[320px]"
        style={{ display: ready === "failed" ? "none" : undefined }}
      />

      {ready === "ok" && (
        <p className="micro mt-1.5 text-ink3">{t("Drag the pin to the exact spot")}</p>
      )}

      {/* No tiles, no map. Put the list back and say why in one line,
          rather than leaving a grey square and an apology. */}
      {ready === "failed" && (
        <div className="mt-2.5 rounded-[var(--r-ctl)] bg-sunken p-3">
          <p className="text-[13px] text-crit">
            {t("Map could not load. Pick the nearest landmark instead.")}
          </p>
          <select
            id="landmark-select"
            className="mt-2 w-full rounded-[10px] border border-rule bg-surface px-3 py-2.5 text-[15px]"
            value={value?.name ?? ""}
            onChange={(e) => {
              const spot = LANDMARKS.find((l) => l.name === e.target.value);
              if (spot) onChange({ ...spot });
            }}
          >
            <option value="">{t("Or pick the nearest landmark")}</option>
            {LANDMARKS.map((l) => (
              <option key={l.name} value={l.name}>
                {t(l.name)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
