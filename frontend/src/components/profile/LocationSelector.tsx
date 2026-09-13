import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { COUNTRIES } from "@/constants/countries";
import { toast } from "sonner";
import { validateTextInput } from "@/lib/validation";
import api from "@/lib/api";

interface LocationSelectorProps {
  city: string;
  country: string;
  onLocationChange: (
    city: string,
    country: string,
    lat?: number,
    lng?: number,
  ) => void;
  variant?: "light" | "dark";
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  city,
  country,
  onLocationChange,
  variant = "dark",
}) => {
  const [cityInput, setCityInput] = useState(city || "");
  const [countryInput, setCountryInput] = useState(
    (country || "").toLowerCase().trim(),
  );
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize internal inputs if parent props change (e.g. async profile load)
  useEffect(() => {
    setCityInput((prev) => {
      const cleanPropCity = (city || "").trim();
      return cleanPropCity.toLowerCase() !== prev.trim().toLowerCase()
        ? cleanPropCity
        : prev;
    });
  }, [city]);

  useEffect(() => {
    setCountryInput((prev) => {
      const cleanPropCountry = (country || "").toLowerCase().trim();
      return cleanPropCountry !== prev.toLowerCase().trim()
        ? cleanPropCountry
        : prev;
    });
  }, [country]);

  const handleUseMyLocation = () => {
    if (isLoading) return;
    setIsLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode through our backend proxy (Nominatim requires a server User-Agent)
          const response = await api.post("/geocode/reverse", {
            lat: latitude,
            lng: longitude,
          });

          const data = response.data || {};
          const detectedCity = data.displayCity || data.city || "";
          const detectedCountry = data.normalizedCountry || data.country || "";
          const displayCountry = data.displayCountry || detectedCountry;

          const lowerCity = (data.normalizedCity || detectedCity).toLowerCase().trim();
          const lowerCountry = detectedCountry.toLowerCase().trim();

          if (detectedCity) {
            setCityInput(detectedCity);
          }
          if (lowerCountry) {
            setCountryInput(lowerCountry);
          }

          onLocationChange(
            lowerCity,
            lowerCountry,
            latitude,
            longitude,
          );

          if (detectedCity && lowerCountry) {
            toast.success(
              `Location detected: ${detectedCity}${displayCountry ? `, ${displayCountry}` : ""}`,
            );
          } else if (detectedCity && !lowerCountry) {
            toast.warning(
              `City detected: ${detectedCity}. Please select your country manually.`,
            );
          } else if (!detectedCity && lowerCountry) {
            toast.warning(
              `Country detected: ${displayCountry}. Please enter your city manually.`,
            );
          } else {
            toast.error(
              "Could not determine your city or country. Please enter them manually.",
            );
          }
        } catch (error: unknown) {
          console.error("Reverse geocoding error:", error);
          let message =
            "Failed to detect location name. Please enter city and country manually.";
          if (
            error &&
            typeof error === "object" &&
            "response" in error &&
            error.response &&
            typeof error.response === "object" &&
            "data" in error.response &&
            error.response.data &&
            typeof error.response.data === "object" &&
            "error" in error.response.data &&
            typeof (error.response.data as { error: unknown }).error === "string"
          ) {
            message = (error.response.data as { error: string }).error;
          }
          toast.error(message);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Location permission denied. Please enter your location manually.");
        setIsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const handleManualUpdate = (overrideCity?: string, overrideCountry?: string) => {
    const effectiveCity = (overrideCity !== undefined ? overrideCity : cityInput).trim();
    const effectiveCountry = (overrideCountry !== undefined ? overrideCountry : countryInput).trim().toLowerCase();

    if (effectiveCity) {
      const cityValidation = validateTextInput(effectiveCity);
      if (!cityValidation.isValid) {
        toast.error(cityValidation.message);
        return;
      }
    }

    if (effectiveCountry) {
      const countryValidation = validateTextInput(effectiveCountry);
      if (!countryValidation.isValid) {
        toast.error(countryValidation.message);
        return;
      }
    }

    // Pass city and country to profile form state. The server-side
    // geocoding queue will resolve lat/lng asynchronously at 1 req/sec.
    onLocationChange(effectiveCity.toLowerCase(), effectiveCountry);
  };

  const lowerCountryInput = countryInput.toLowerCase().trim();
  const countryList =
    lowerCountryInput && !COUNTRIES.includes(lowerCountryInput)
      ? [lowerCountryInput, ...COUNTRIES]
      : COUNTRIES;
  const sortedCountries = ["india", ...countryList.filter((c) => c !== "india")];

  return (
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="city"
          className={variant === "light" ? "text-foreground" : "text-gray-300"}
        >
          City <span className="text-destructive">*</span>
        </Label>
        <Input
          id="city"
          value={cityInput}
          onChange={(e) => {
            setCityInput(e.target.value);
            onLocationChange(
              e.target.value.trim().toLowerCase(),
              countryInput.trim().toLowerCase(),
            );
          }}
          onBlur={(e) => handleManualUpdate(e.target.value, undefined)}
          placeholder="Enter your city"
          className={
            variant === "light"
              ? "bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
              : "bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
          }
        />
      </div>

      <div>
        <Label
          htmlFor="country"
          className={variant === "light" ? "text-foreground" : "text-gray-300"}
        >
          Country <span className="text-destructive">*</span>
        </Label>
        <Select
          value={countryInput}
          onValueChange={(val) => {
            const lowerVal = val.toLowerCase().trim();
            setCountryInput(lowerVal);
            handleManualUpdate(undefined, lowerVal);
          }}
        >
          <SelectTrigger
            id="country"
            className={
              variant === "light"
                ? "bg-background border-input text-foreground focus:border-ring focus:ring-ring"
                : "bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
            }
          >
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border shadow-overlay">
            {sortedCountries.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleUseMyLocation}
        disabled={isLoading}
        className={
          variant === "light"
            ? "w-full bg-card border-border text-foreground hover:bg-accent hover:text-accent-foreground"
            : "w-full bg-black/20 border-white/10 text-white hover:bg-black/30 hover:text-white"
        }
      >
        <MapPin className="h-4 w-4 mr-2" />
        {isLoading ? "Detecting..." : "Use My Location"}
      </Button>
    </div>
  );
};

export default LocationSelector;
