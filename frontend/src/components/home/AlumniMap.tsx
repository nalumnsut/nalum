import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import useSupercluster from "use-supercluster";
import "leaflet/dist/leaflet.css";
import api from "@/lib/api";

interface AlumniLocation {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// Tracks map bounds and zoom, stores them in ref-backed state
function MapController({
  setBounds,
  setZoom,
  onMapReady,
}: {
  setBounds: (b: [number, number, number, number]) => void;
  setZoom: (z: number) => void;
  onMapReady: (m: L.Map) => void;
}) {
  const map = useMap();

  const update = () => {
    const b = map.getBounds();
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(map.getZoom());
  };

  useMapEvents({ moveend: update, zoomend: update });

  useEffect(() => {
    onMapReady(map);
    update();
  }, []);

  return null;
}

const AlumniMap = () => {
  const [locations, setLocations] = useState<AlumniLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(2);
  const [bounds, setBounds] = useState<[number, number, number, number]>([
    -180, -85, 180, 85,
  ]);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !mapInstance) return;
    const match = locations.find(
      (loc) =>
        loc.city.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q),
    );
    if (match) {
      mapInstance.flyTo([match.lat, match.lng], 7, {
        animate: true,
        duration: 1.2,
      });
    }
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data } = await api.get("/alumni-map");
        setLocations(data.locations || []);
      } catch (err) {
        console.error("Error fetching alumni locations:", err);
        setError("Failed to load alumni map");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Format raw locations as GeoJSON features for supercluster
  const points = locations.map((loc) => ({
    type: "Feature" as const,
    properties: { cluster: false, city: loc.city, country: loc.country },
    geometry: { type: "Point" as const, coordinates: [loc.lng, loc.lat] },
  }));

  const { clusters } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 75, maxZoom: 17 },
  });

  const bgPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

  const wrapperClass =
    "relative bg-gradient-to-br from-nsut-maroon via-red-900 to-nsut-maroon text-white py-12 md:py-20 overflow-hidden";

  if (isLoading) {
    return (
      <div className={wrapperClass}>
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: bgPattern }}
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
              Alumni Network Map
            </h2>
          </div>
          <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={wrapperClass}>
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: bgPattern }}
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
              Alumni Network Map
            </h2>
          </div>
          <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className={wrapperClass}>
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: bgPattern }}
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
              Alumni Network Map
            </h2>
          </div>
          <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-600">No alumni locations available yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: bgPattern }}
        />
      </div>
      {/* Decorative gradient accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-nsut-yellow/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-nsut-yellow/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">
            Alumni Network Map
          </h2>
          <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto">
            Discover where our alumni are located around the world
          </p>
        </div>

      <div className="w-full h-[400px] md:h-[500px] relative">
        <div className="rounded-lg overflow-hidden shadow-lg h-full relative">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            minZoom={2}
            maxZoom={18}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <MapController
              setBounds={setBounds}
              setZoom={setZoom}
              onMapReady={setMapInstance}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              {clusters.map((cluster) => {
                const [lng, lat] = cluster.geometry.coordinates;
                const {
                  cluster: isCluster,
                  point_count,
                  city,
                  country,
                } = cluster.properties;

                if (isCluster) {
                  const digits =
                    Math.floor(Math.log10(Math.max(point_count, 1))) + 1;
                  const size = 32 + (digits - 1) * 12;
                  const fontSize = Math.max(11, Math.floor(size * 0.32));
                  const icon = L.divIcon({
                    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#E53935;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fontSize}px;border:2px solid #b71c1c;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${point_count}</div>`,
                    className: "",
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                  });
                  return (
                    <Marker
                      key={`cluster-${cluster.id}`}
                      position={[lat, lng]}
                      icon={icon}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>{point_count} alumni</strong> in this area
                        </div>
                      </Popup>
                    </Marker>
                  );
                }

                const singleSize = 32;
                const singleFontSize = Math.floor(singleSize * 0.32);
                const singleIcon = L.divIcon({
                  html: `<div style="width:${singleSize}px;height:${singleSize}px;border-radius:50%;background:#E53935;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${singleFontSize}px;border:2px solid #b71c1c;box-shadow:0 2px 8px rgba(0,0,0,0.3);">1</div>`,
                  className: "",
                  iconSize: [singleSize, singleSize],
                  iconAnchor: [singleSize / 2, singleSize / 2],
                });
                return (
                  <Marker
                    key={`point-${city}-${country}-${lat}-${lng}`}
                    position={[lat, lng]}
                    icon={singleIcon}
                >
                  <Popup>
                    <div className="text-sm">
                        <strong>{city}</strong>
                        <br />
                        {country}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          {mapInstance && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "50px",
                zIndex: 1000,
                display: "flex",
                gap: "6px",
              }}
            >
              <input
                type="text"
                placeholder="Search city or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                style={{
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  fontSize: "13px",
                  width: "220px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  outline: "none",
                  background: "#fff",
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  padding: "7px 14px",
                  borderRadius: "6px",
                  background: "#E53935",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                Go
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlumniMap;
