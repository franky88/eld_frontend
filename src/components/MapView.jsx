import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const STOP_CONFIG = {
  pickup: { color: "#16a34a", label: "Pickup", emoji: "📦" },
  dropoff: { color: "#dc2626", label: "Dropoff", emoji: "🏁" },
  fuel: { color: "#d97706", label: "Fuel", emoji: "⛽" },
  rest: { color: "#7c3aed", label: "Rest", emoji: "🛏" },
};

function pinIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 40" width="28" height="40">
    <filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/></filter>
    <path filter="url(#s)" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="14" r="5.5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -42],
    className: "",
  });
}

export default function MapView({ route }) {
  const routeCoords = polyline.decode(route.geometry);
  const center = routeCoords[Math.floor(routeCoords.length / 2)];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {route.stops.map((stop, i) => {
          const cfg = STOP_CONFIG[stop.type] || STOP_CONFIG.rest;
          return (
            <div
              key={i}
              className="flex items-center gap-1.5 text-xs bg-secondary rounded-full px-3 py-1"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cfg.color }}
              />
              <span className="font-medium">{stop.label}</span>
              <span className="text-muted-foreground">· {stop.eta_hours}h</span>
            </div>
          );
        })}
      </div>
      <div
        className="rounded-xl overflow-hidden border border-border/60"
        style={{ height: 360 }}
      >
        <MapContainer
          center={center}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Polyline
            positions={routeCoords}
            color="#2563eb"
            weight={4}
            opacity={0.85}
          />
          {route.stops.map((stop, i) => {
            const cfg = STOP_CONFIG[stop.type] || STOP_CONFIG.rest;
            return (
              <Marker key={i} position={stop.coords} icon={pinIcon(cfg.color)}>
                <Popup>
                  <div className="text-sm min-w-35">
                    <p className="font-semibold">
                      {cfg.emoji} {cfg.label}
                    </p>
                    <p className="text-gray-600 mt-0.5">{stop.label}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      ETA: +{stop.eta_hours}h
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
