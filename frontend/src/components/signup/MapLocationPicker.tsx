import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2 } from "lucide-react";

// Fix default marker icon issue with bundlers
const markerIcon = L.divIcon({
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#800000;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export interface LocationData {
  locality: string;
  city: string;
  state: string;
  country: string;
  lat?: number;
  lng?: number;
}

interface MapLocationPickerProps {
  value: LocationData;
  onChange: (location: LocationData) => void;
  error?: string;
  variant?: "light" | "dark";
  height?: string;
}

// Reverse geocode coordinates to address using Nominatim
async function reverseGeocode(lat: number, lng: number): Promise<Partial<LocationData>> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "User-Agent": "NSUT-Alumni-Network/1.0" } }
    );
    const data = await response.json();
    const addr = data.address || {};
    return {
      locality: (addr.suburb || addr.neighbourhood || addr.hamlet || addr.village || "").toLowerCase(),
      city: (addr.city || addr.town || addr.village || addr.county || "").toLowerCase(),
      state: (addr.state || addr.state_district || "").toLowerCase(),
      country: (addr.country || "").toLowerCase(),
      lat,
      lng,
    };
  } catch (error) {
    console.error("Reverse geocode failed:", error);
    return { lat, lng };
  }
}

// Component to handle map click events
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to fly the map to a new position
function FlyToPosition({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, { animate: true, duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

const MapLocationPicker = ({ value, onChange, error, variant = "light", height = "220px" }: MapLocationPickerProps) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    value.lat && value.lng ? [value.lat, value.lng] : null
  );
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    setIsGeocoding(true);
    const geocoded = await reverseGeocode(lat, lng);
    onChange({
      locality: geocoded.locality || value.locality,
      city: geocoded.city || value.city,
      state: geocoded.state || value.state,
      country: geocoded.country || value.country,
      lat,
      lng,
    });
    setIsGeocoding(false);
  }, [onChange, value]);

  const handleUseMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPosition([latitude, longitude]);
        setFlyTarget([latitude, longitude]);
        setIsGeocoding(true);
        const geocoded = await reverseGeocode(latitude, longitude);
        onChange({
          locality: geocoded.locality || "",
          city: geocoded.city || "",
          state: geocoded.state || "",
          country: geocoded.country || "",
          lat: latitude,
          lng: longitude,
        });
        setIsGeocoding(false);
        setIsDetecting(false);
      },
      () => {
        setIsDetecting(false);
      }
    );
  }, [onChange]);

  const handleFieldChange = (field: keyof LocationData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  // Forward geocode when user finishes typing address fields
  const handleGeocodeFromFields = useCallback(async () => {
    const parts = [value.locality, value.city, value.state, value.country].filter(Boolean);
    if (parts.length < 2) return; // need at least city + country

    try {
      const query = parts.join(", ");
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { "User-Agent": "NSUT-Alumni-Network/1.0" } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setMarkerPosition([lat, lng]);
        setFlyTarget([lat, lng]);
        onChange({ ...value, lat, lng });
      }
    } catch (error) {
      console.error("Forward geocode failed:", error);
    }
  }, [value, onChange]);

  return (
    <div className="space-y-3">
      {/* Map */}
      <div className={`rounded-lg overflow-hidden border shadow-sm ${variant === "dark" ? "border-white/10" : "border-gray-200"}`} style={{ height }}>
        <MapContainer
          center={markerPosition || [20.5937, 78.9629]}
          zoom={markerPosition ? 13 : 4}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <FlyToPosition position={flyTarget} />
          {markerPosition && (
            <Marker position={markerPosition} icon={markerIcon} />
          )}
        </MapContainer>
      </div>

      {/* Detect location button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleUseMyLocation}
        disabled={isDetecting}
        className={`w-full h-10 ${
          variant === "dark"
            ? "bg-black/20 border-white/10 text-white hover:bg-white/10"
            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
      >
        {isDetecting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Detecting location...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Use My Current Location
          </span>
        )}
      </Button>

      {isGeocoding && (
        <p className={`text-xs flex items-center gap-1 ${variant === "dark" ? "text-gray-400" : "text-gray-500"}`}>
          <Loader2 className="h-3 w-3 animate-spin" />
          Resolving address...
        </p>
      )}

      {/* Instruction text */}
      <p className={`text-xs ${variant === "dark" ? "text-gray-400" : "text-gray-500"}`}>
        Click on the map to pin your location, or type your address below
      </p>

      {/* Address fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="locality" className={`text-sm ${variant === "dark" ? "text-gray-300" : "text-gray-700"}`}>Locality</Label>
          <Input
            id="locality"
            placeholder="e.g. Dwarka Sector 3"
            value={value.locality}
            onChange={(e) => handleFieldChange("locality", e.target.value)}
            onBlur={handleGeocodeFromFields}
            className={`h-10 text-sm ${
              variant === "dark"
                ? "bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                : ""
            }`}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="signup-city" className={`text-sm ${variant === "dark" ? "text-gray-300" : "text-gray-700"}`}>
            City <span className="text-red-500">*</span>
          </Label>
          <Input
            id="signup-city"
            placeholder="e.g. New Delhi"
            value={value.city}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            onBlur={handleGeocodeFromFields}
            className={`h-10 text-sm ${
              variant === "dark"
                ? "bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                : ""
            }`}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="signup-state" className={`text-sm ${variant === "dark" ? "text-gray-300" : "text-gray-700"}`}>State</Label>
          <Input
            id="signup-state"
            placeholder="e.g. Delhi"
            value={value.state}
            onChange={(e) => handleFieldChange("state", e.target.value)}
            onBlur={handleGeocodeFromFields}
            className={`h-10 text-sm ${
              variant === "dark"
                ? "bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                : ""
            }`}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="signup-country" className={`text-sm ${variant === "dark" ? "text-gray-300" : "text-gray-700"}`}>
            Country <span className="text-red-500">*</span>
          </Label>
          <Input
            id="signup-country"
            placeholder="e.g. India"
            value={value.country}
            onChange={(e) => handleFieldChange("country", e.target.value)}
            onBlur={handleGeocodeFromFields}
            className={`h-10 text-sm ${
              variant === "dark"
                ? "bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                : ""
            }`}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default MapLocationPicker;
