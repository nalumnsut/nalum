import { useEffect, useMemo, useRef, useState } from "react";
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
  count: number;
  lat: number;
  lng: number;
}

// Tracks map bounds and zoom for supercluster clustering
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

const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  // Asia - Large countries
  india: { lat: 20.5937, lng: 78.9629, zoom: 5 },
  bharat: { lat: 20.5937, lng: 78.9629, zoom: 5 },
  china: { lat: 35.8617, lng: 104.1954, zoom: 4 },
  russia: { lat: 61.5240, lng: 105.3188, zoom: 3 },
  indonesia: { lat: -0.7893, lng: 113.9213, zoom: 4 },
  pakistan: { lat: 30.3753, lng: 69.3451, zoom: 5 },
  bangladesh: { lat: 23.6850, lng: 90.3563, zoom: 6 },

  // Asia - Medium/Small countries
  japan: { lat: 36.2048, lng: 138.2529, zoom: 6 },
  "south korea": { lat: 35.9078, lng: 127.7669, zoom: 7 },
  korea: { lat: 35.9078, lng: 127.7669, zoom: 7 },
  thailand: { lat: 15.8700, lng: 100.9925, zoom: 6 },
  malaysia: { lat: 4.2105, lng: 101.6964, zoom: 6 },
  philippines: { lat: 12.8797, lng: 121.7740, zoom: 6 },
  vietnam: { lat: 14.0583, lng: 108.2772, zoom: 6 },
  singapore: { lat: 1.3521, lng: 103.8198, zoom: 11 },
  "united arab emirates": { lat: 23.4241, lng: 53.8478, zoom: 7 },
  uae: { lat: 23.4241, lng: 53.8478, zoom: 7 },
  israel: { lat: 31.0461, lng: 34.8516, zoom: 8 },
  "saudi arabia": { lat: 23.8859, lng: 45.0792, zoom: 5 },
  turkey: { lat: 38.9637, lng: 35.2433, zoom: 6 },

  // Americas - North & Central
  "united states": { lat: 37.0902, lng: -95.7129, zoom: 4 },
  "united states of america": { lat: 37.0902, lng: -95.7129, zoom: 4 },
  usa: { lat: 37.0902, lng: -95.7129, zoom: 4 },
  us: { lat: 37.0902, lng: -95.7129, zoom: 4 },
  canada: { lat: 56.1304, lng: -106.3468, zoom: 3 },
  mexico: { lat: 23.6345, lng: -102.5528, zoom: 5 },

  // Americas - South
  brazil: { lat: -14.2350, lng: -51.9253, zoom: 4 },
  argentina: { lat: -38.4161, lng: -63.6167, zoom: 4 },
  peru: { lat: -9.1900, lng: -75.0152, zoom: 5 },
  chile: { lat: -35.6751, lng: -71.5430, zoom: 5 },
  colombia: { lat: 4.5709, lng: -74.2973, zoom: 5 },
  venezuela: { lat: 6.4238, lng: -66.5897, zoom: 5 },

  // Europe - Large countries
  france: { lat: 46.2276, lng: 2.2137, zoom: 6 },
  germany: { lat: 51.1657, lng: 10.4515, zoom: 6 },
  spain: { lat: 40.4637, lng: -3.7492, zoom: 6 },
  italy: { lat: 41.8719, lng: 12.5674, zoom: 6 },
  poland: { lat: 51.9194, lng: 19.1451, zoom: 6 },
  ukraine: { lat: 48.3794, lng: 31.1656, zoom: 5 },

  // Europe - Medium countries
  "united kingdom": { lat: 55.3781, lng: -3.4360, zoom: 6 },
  uk: { lat: 55.3781, lng: -3.4360, zoom: 6 },
  england: { lat: 55.3781, lng: -3.4360, zoom: 6 },
  sweden: { lat: 60.1282, lng: 18.6435, zoom: 5 },
  norway: { lat: 60.4720, lng: 8.4689, zoom: 5 },
  greece: { lat: 39.0742, lng: 21.8243, zoom: 6 },
  romania: { lat: 45.9432, lng: 24.9668, zoom: 6 },
  portugal: { lat: 39.3999, lng: -8.2245, zoom: 6 },
  austria: { lat: 47.5162, lng: 14.5501, zoom: 7 },
  hungary: { lat: 47.1625, lng: 19.5033, zoom: 7 },
  czechia: { lat: 49.8175, lng: 15.4730, zoom: 7 },
  "czech republic": { lat: 49.8175, lng: 15.4730, zoom: 7 },

  // Europe - Small countries
  netherlands: { lat: 52.1326, lng: 5.2913, zoom: 8 },
  switzerland: { lat: 46.8182, lng: 8.2275, zoom: 7 },
  denmark: { lat: 56.2639, lng: 9.5018, zoom: 7 },
  belgium: { lat: 50.5039, lng: 4.4699, zoom: 8 },
  ireland: { lat: 53.4129, lng: -8.2439, zoom: 7 },

  // Africa
  egypt: { lat: 26.8206, lng: 30.8025, zoom: 5 },
  "south africa": { lat: -30.5595, lng: 22.9375, zoom: 5 },
  kenya: { lat: -0.0236, lng: 37.9062, zoom: 6 },
  nigeria: { lat: 9.0820, lng: 8.6753, zoom: 5 },

  // Oceania
  australia: { lat: -25.2744, lng: 133.7751, zoom: 4 },
  "new zealand": { lat: -40.9006, lng: 174.8860, zoom: 6 },
};

interface SuggestionItem {
  type: "city" | "country";
  city?: string;
  country: string;
  label: string;
  lat: number;
  lng: number;
  zoom?: number;
}

function MapSearchControl({
  locations,
  mapInstance,
}: {
  locations: AlumniLocation[];
  mapInstance: L.Map | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: SuggestionItem[] = [];
    const seenKeys = new Set<string>();

    // Extract unique countries where alumni actually reside
    const activeCountries = Array.from(
      new Set(locations.map((loc) => loc.country.trim()))
    );

    // 1. Match active countries where alumni reside
    activeCountries.forEach((countryStr) => {
      const countryLower = countryStr.toLowerCase();
      if (countryLower.startsWith(q) || countryLower.includes(q) || q.includes(countryLower)) {
        const capCountry = countryStr.charAt(0).toUpperCase() + countryStr.slice(1);
        const key = `country:${capCountry.toLowerCase()}`;

        if (!seenKeys.has(key)) {
          seenKeys.add(key);

          const centroidEntry = COUNTRY_CENTROIDS[countryLower];
          let lat: number;
          let lng: number;
          let zoom: number;

          if (centroidEntry) {
            lat = centroidEntry.lat;
            lng = centroidEntry.lng;
            zoom = centroidEntry.zoom;
          } else {
            const countryLocs = locations.filter(
              (l) => l.country.toLowerCase() === countryLower
            );
            lat = countryLocs.reduce((sum, l) => sum + l.lat, 0) / countryLocs.length;
            lng = countryLocs.reduce((sum, l) => sum + l.lng, 0) / countryLocs.length;
            zoom = 4;
          }

          results.push({
            type: "country",
            country: capCountry,
            label: `${capCountry}`,
            lat,
            lng,
            zoom,
          });
        }
      }
    });

    // 2. Match cities from active alumni locations
    locations.forEach((loc) => {
      const cityLower = loc.city.toLowerCase();

      if (cityLower.startsWith(q) || cityLower.includes(q)) {
        const capCity = loc.city.charAt(0).toUpperCase() + loc.city.slice(1);
        const capCountry = loc.country.charAt(0).toUpperCase() + loc.country.slice(1);
        const key = `city:${capCity.toLowerCase()}-${capCountry.toLowerCase()}`;

        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          results.push({
            type: "city",
            city: capCity,
            country: capCountry,
            label: `${capCity}, ${capCountry}`,
            lat: loc.lat,
            lng: loc.lng,
            zoom: 7,
          });
        }
      }
    });

    // Rank: items starting with query come first
    results.sort((a, b) => {
      const aName = a.city ? a.city.toLowerCase() : a.country.toLowerCase();
      const bName = b.city ? b.city.toLowerCase() : b.country.toLowerCase();
      const aStartsWith = aName.startsWith(q);
      const bStartsWith = bName.startsWith(q);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return aName.localeCompare(bName);
    });

    return results.slice(0, 5);
  }, [searchQuery, locations]);

  const selectSuggestion = (item: SuggestionItem) => {
    const selectedText = item.type === "city" ? item.city! : item.country;
    setSearchQuery(selectedText);
    setShowDropdown(false);

    const targetZoom = item.zoom || (item.type === "country" ? 4 : 7);
    mapInstance?.flyTo([item.lat, item.lng], targetZoom, {
      animate: true,
      duration: 0.65,
      easeLinearity: 0.25,
    });

    setSearchResult(item.type === "country" ? `Found ${item.country}` : `Found ${item.city}, ${item.country}`);
    setTimeout(() => setSearchResult(null), 3000);
  };

  const handleSearch = () => {
    setShowDropdown(false);
    if (suggestions.length > 0) {
      selectSuggestion(suggestions[0]);
      return;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q || !mapInstance) return;

    setSearchResult(`No results found for "${q}"`);
    setTimeout(() => setSearchResult(null), 3000);
  };

  if (!mapInstance) return null;

  return (
    <>
      {searchResult && (
        <div
          style={{
            position: "absolute",
            top: "60px",
            left: "50px",
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.95)",
            color: "#333",
            padding: "8px 16px",
            borderRadius: "6px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {searchResult}
        </div>
      )}
      <div
        ref={dropdownRef}
        style={{
          position: "absolute",
          top: "12px",
          left: "50px",
          zIndex: 1000,
          display: "flex",
          gap: "6px",
        }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search city or country..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setShowDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
              if (e.key === "Escape") setShowDropdown(false);
            }}
            style={{
              padding: "7px 30px 7px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "13px",
              width: "220px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              outline: "none",
              background: "#fff",
              color: "#333",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResult(null);
                setShowDropdown(false);
              }}
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: "8px",
                background: "transparent",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: "16px",
                padding: "0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          )}

          {showDropdown && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "4px",
                background: "#ffffff",
                borderRadius: "6px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.18)",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                zIndex: 1001,
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {suggestions.map((item) => (
                <div
                  key={`${item.type}-${item.label}`}
                  onClick={() => selectSuggestion(item)}
                  style={{
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "#1e293b",
                    cursor: "pointer",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "background 0.15s ease",
                  }}
                  className="hover:bg-red-50"
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>
                      {item.city || item.country}
                    </span>
                    {item.city && (
                      <span style={{ color: "#64748b", fontSize: "12px", marginLeft: "6px" }}>
                        {item.country}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: item.type === "country" ? "#fee2e2" : "#f1f5f9",
                      color: item.type === "country" ? "#b91c1c" : "#475569",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
    </>
  );
}

// Continent overlay label rendered at low zoom levels
const CONTINENT_LABELS = [
  { name: "ASIA", lat: 44.5, lng: 95.0 },
];

const createContinentIcon = (label: string) =>
  L.divIcon({
    html: `<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 2px; color: #475569; text-transform: uppercase; white-space: nowrap; pointer-events: none; text-shadow: 0 1px 3px rgba(255,255,255,0.95), 0 0 6px rgba(255,255,255,0.95);">${label}</div>`,
    className: "continent-label-marker",
    iconSize: [60, 20],
    iconAnchor: [30, 10],
  });

const AlumniMap = () => {
  const [locations, setLocations] = useState<AlumniLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(2);
  const [bounds, setBounds] = useState<[number, number, number, number]>([
    -180, -85, 180, 85,
  ]);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchLocations = async () => {
      try {
        const { data } = await api.get("/alumni-map", {
          signal: abortController.signal,
        });
        // Defensive: drop any entries with non-finite coordinates (legacy or
        // malformed data) so Leaflet never receives an invalid LatLng.
        const sanitized = (data.locations || []).filter(
          (loc: AlumniLocation) =>
            loc.lat != null &&
            loc.lng != null &&
            Number.isFinite(Number(loc.lat)) &&
            Number.isFinite(Number(loc.lng))
        );
        setLocations(sanitized);
      } catch (err) {
        if ((err as { code?: string })?.code === "ERR_CANCELED") return;
        console.error("Error fetching alumni locations:", err);
        setError("Failed to load alumni map");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();

    // Cancel the in-flight request if the map unmounts before it resolves
    return () => abortController.abort();
  }, []);

  // Format raw locations as GeoJSON features for supercluster
  const points = useMemo(
    () =>
      locations.map((loc) => ({
        type: "Feature" as const,
        properties: {
          cluster: false,
          city: loc.city,
          country: loc.country,
          count: loc.count || 1,
        },
        geometry: { type: "Point" as const, coordinates: [loc.lng, loc.lat] },
      })),
    [locations]
  );

  const clusterOptions = useMemo(
    () => ({
      radius: 75,
      maxZoom: 17,
      map: (props: { count?: number }) => ({ sum: props.count || 1 }),
      reduce: (
        accumulated: { sum: number },
        props: { count?: number; sum?: number }
      ) => {
        accumulated.sum += props.sum || props.count || 1;
      },
    }),
    []
  );

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: clusterOptions,
  });

  const getClusterPopupContent = (clusterId: number) => {
    if (!supercluster) return null;
    const leaves = supercluster.getLeaves(clusterId, Infinity);
    const countries = Array.from(
      new Set(leaves.map((l) => l.properties.country || "Unknown"))
    ) as string[];
    const countryLabel = countries
      .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
      .join(", ");

    return (
      <div className="text-sm p-1" style={{ color: "#333" }}>
        <div className="font-semibold text-gray-800">
          {countryLabel}
        </div>
      </div>
    );
  };

  const bgPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

  const wrapperClass =
    "relative bg-gradient-to-br from-nsut-maroon via-red-900 to-nsut-maroon text-white py-8 md:py-16 overflow-hidden flex-1 w-full min-h-[calc(100vh-80px)] flex flex-col justify-center";

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
            <h2 className="text-2xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">
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
            <h2 className="text-2xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">
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
            <h2 className="text-2xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">
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
            maxBounds={[
              [-85, -180], // Southwest coordinate
              [85, 180]    // Northeast coordinate
            ]}
            maxBoundsViscosity={1.0}
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
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_2paa_1_20b6047ba4f3a3aa541f1d55"
            />
            {/* English Continent Overlay Labels at low zoom levels */}
            {zoom <= 5 &&
              CONTINENT_LABELS.map((cont) => (
                <Marker
                  key={`continent-${cont.name}`}
                  position={[cont.lat, cont.lng]}
                  icon={createContinentIcon(cont.name)}
                />
              ))}
              {clusters.map((cluster) => {
                const [lng, lat] = cluster.geometry.coordinates;
                const {
                  cluster: isCluster,
                  point_count,
                  city,
                  country,
                } = cluster.properties;

                if (isCluster) {
                  const displayCount = cluster.properties.sum || point_count;
                  const digits =
                    Math.floor(Math.log10(Math.max(displayCount, 1))) + 1;
                  const size = 32 + (digits - 1) * 12;
                  const fontSize = Math.max(11, Math.floor(size * 0.32));

                  // pointer-events:none on the inner div ensures mouse events
                  // fall through to Leaflet's marker layer — not the HTML div —
                  // so the eventHandlers.click always fires on desktop.
                  const icon = L.divIcon({
                    html: `<div class="alumni-map-pin" style="width:${size}px;height:${size}px;border-radius:50%;background:#E53935;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fontSize}px;border:2px solid #b71c1c;box-shadow:0 2px 8px rgba(0,0,0,0.3);pointer-events:none;">${displayCount}</div>`,
                    className: "",
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                  });

                  return (
                    <Marker
                      key={`cluster-${cluster.id}`}
                      position={[lat, lng]}
                      icon={icon}
                      eventHandlers={{
                        click: (e) => {
                          if (!mapInstance || !supercluster) return;
                          e.target.openPopup();
                          const expansionZoom = Math.min(
                            supercluster.getClusterExpansionZoom(cluster.id as number),
                            18
                          );
                          mapInstance.flyTo([lat, lng], expansionZoom, {
                            animate: true,
                            duration: 0.65,
                            easeLinearity: 0.25,
                          });
                        },
                      }}
                    >
                      {/* Popup is always present in the DOM; we control open/
                          close imperatively so the popup pane never sits under
                          the cursor at the moment the user clicks — eliminating
                          the "click eaten by popup" desktop bug. */}
                      <Popup>
                        {getClusterPopupContent(cluster.id as number)}
                      </Popup>
                    </Marker>
                  );
                }

                // ── Single city marker ──────────────────────────────────────
                const count = cluster.properties.count || 1;
                const size = Math.max(20, 20 + Math.log(count) * 8);
                const fontSize = Math.max(9, Math.floor(size * 0.32));
                const icon = L.divIcon({
                  html: `<div class="alumni-map-pin" style="width:${size}px;height:${size}px;border-radius:50%;background:#E53935;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fontSize}px;border:2px solid #b71c1c;box-shadow:0 2px 8px rgba(0,0,0,0.3);pointer-events:none;">${count}</div>`,
                  className: "",
                  iconSize: [size, size],
                  iconAnchor: [size / 2, size / 2],
                });
                return (
                  <Marker
                    key={`point-${city}-${country}-${lat}-${lng}`}
                    position={[lat, lng]}
                    icon={icon}
                    eventHandlers={{
                      click: (e) => {
                        if (!mapInstance) return;
                        e.target.openPopup();
                        const currentZoom = mapInstance.getZoom();

                        if (currentZoom < 13) {
                          const targetZoom = Math.min(currentZoom + 2, 17);
                          mapInstance.flyTo([lat, lng], targetZoom, {
                            animate: true,
                            duration: 0.65,
                            easeLinearity: 0.25,
                          });
                        }
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-sm" style={{ color: "#333" }}>
                        <strong className="capitalize">{city}</strong>
                        <br />
                        <span className="capitalize">{country}</span>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          <MapSearchControl locations={locations} mapInstance={mapInstance} />
        </div>
      </div>
    </div>
  );
};

export default AlumniMap;
