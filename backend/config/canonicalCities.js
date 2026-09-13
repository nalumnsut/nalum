/**
 * Canonical Cities Database & Normalization Utilities
 *
 * Provides a standardized lookup table for canonical city coordinates,
 * alias resolution (e.g. bangalore -> bengaluru, gurgaon -> gurugram, delhi -> new delhi),
 * and country normalization (e.g. usa -> united states, uk -> united kingdom).
 */

// Country alias map (lowercase)
const COUNTRY_ALIASES = {
  usa: "united states",
  us: "united states",
  "united states of america": "united states",
  uk: "united kingdom",
  uae: "united arab emirates",
  "united arab emarates": "united arab emirates",
  bharat: "india",
  "republic of india": "india",
};

// City alias map (lowercase -> canonical city key in same country)
const CITY_ALIASES = {
  // India - NCR & North
  delhi: "new delhi",
  "delhi ncr": "new delhi",
  "south delhi": "new delhi",
  "south west delhi": "new delhi",
  "east delhi": "new delhi",
  "west delhi": "new delhi",
  "north delhi": "new delhi",
  "central delhi": "new delhi",
  ncr: "new delhi",
  dilli: "new delhi",
  gurgaon: "gurugram",
  "gurugram ncr": "gurugram",
  "greater noida": "greater noida",
  "noida ncr": "noida",
  faridabad: "faridabad",
  ghaziabad: "ghaziabad",
  
  // India - South
  bangalore: "bengaluru",
  banglore: "bengaluru",
  "bengaluru, karnataka": "bengaluru",
  "bangalore urban": "bengaluru",
  madras: "chennai",
  "chennai, tamil nadu": "chennai",
  "hyderabad, telangana": "hyderabad",
  cyberabad: "hyderabad",
  trivandrum: "thiruvananthapuram",
  cochin: "kochi",
  calicut: "kozhikode",
  mangalore: "mangaluru",
  pondicherry: "puducherry",
  
  // India - West & Central
  bombay: "mumbai",
  "mumbai suburban": "mumbai",
  "navi mumbai": "navi mumbai",
  poona: "pune",
  "pune city": "pune",
  baroda: "vadodara",
  simla: "shimla",
  banaras: "varanasi",
  kashi: "varanasi",
  waltair: "visakhapatnam",
  vizag: "visakhapatnam",
  prayagraj: "prayagraj",
  allahabad: "prayagraj",
  
  calcutta: "kolkata",
  
  // International aliases
  nyc: "new york",
  "new york city": "new york",
  sf: "san francisco",
  "bay area": "san francisco",
  la: "los angeles",
  "los angeles city": "los angeles",
  kl: "kuala lumpur",
  "city of westminster": "london",
};

// Canonical City coordinates dictionary
// Key format: `${normalizedCity}|${normalizedCountry}`
const CANONICAL_CITIES = {
  // --- INDIA ---
  "new delhi|india": { lat: 28.6139, lng: 77.209, displayCity: "New Delhi", displayCountry: "India" },
  "gurugram|india": { lat: 28.4595, lng: 77.0266, displayCity: "Gurugram", displayCountry: "India" },
  "noida|india": { lat: 28.5706, lng: 77.3272, displayCity: "Noida", displayCountry: "India" },
  "greater noida|india": { lat: 28.4744, lng: 77.504, displayCity: "Greater Noida", displayCountry: "India" },
  "faridabad|india": { lat: 28.4089, lng: 77.3178, displayCity: "Faridabad", displayCountry: "India" },
  "ghaziabad|india": { lat: 28.6692, lng: 77.4538, displayCity: "Ghaziabad", displayCountry: "India" },
  "mumbai|india": { lat: 19.076, lng: 72.8777, displayCity: "Mumbai", displayCountry: "India" },
  "navi mumbai|india": { lat: 19.033, lng: 73.0297, displayCity: "Navi Mumbai", displayCountry: "India" },
  "bengaluru|india": { lat: 12.9716, lng: 77.5946, displayCity: "Bengaluru", displayCountry: "India" },
  "pune|india": { lat: 18.5204, lng: 73.8567, displayCity: "Pune", displayCountry: "India" },
  "hyderabad|india": { lat: 17.385, lng: 78.4867, displayCity: "Hyderabad", displayCountry: "India" },
  "chennai|india": { lat: 13.0827, lng: 80.2707, displayCity: "Chennai", displayCountry: "India" },
  "kolkata|india": { lat: 22.5726, lng: 88.3639, displayCity: "Kolkata", displayCountry: "India" },
  "ahmedabad|india": { lat: 23.0225, lng: 72.5714, displayCity: "Ahmedabad", displayCountry: "India" },
  "jaipur|india": { lat: 26.9124, lng: 75.7873, displayCity: "Jaipur", displayCountry: "India" },
  "surat|india": { lat: 21.1702, lng: 72.8311, displayCity: "Surat", displayCountry: "India" },
  "lucknow|india": { lat: 26.8467, lng: 80.9462, displayCity: "Lucknow", displayCountry: "India" },
  "kanpur|india": { lat: 26.4499, lng: 80.3319, displayCity: "Kanpur", displayCountry: "India" },
  "nagpur|india": { lat: 21.1458, lng: 79.0882, displayCity: "Nagpur", displayCountry: "India" },
  "indore|india": { lat: 22.7196, lng: 75.8577, displayCity: "Indore", displayCountry: "India" },
  "thane|india": { lat: 19.2183, lng: 72.9781, displayCity: "Thane", displayCountry: "India" },
  "bhopal|india": { lat: 23.2599, lng: 77.4126, displayCity: "Bhopal", displayCountry: "India" },
  "visakhapatnam|india": { lat: 17.6868, lng: 83.2185, displayCity: "Visakhapatnam", displayCountry: "India" },
  "vadodara|india": { lat: 22.3072, lng: 73.1812, displayCity: "Vadodara", displayCountry: "India" },
  "firozabad|india": { lat: 27.1592, lng: 78.3957, displayCity: "Firozabad", displayCountry: "India" },
  "ludhiana|india": { lat: 30.901, lng: 75.8573, displayCity: "Ludhiana", displayCountry: "India" },
  "agra|india": { lat: 27.1767, lng: 78.0081, displayCity: "Agra", displayCountry: "India" },
  "nashik|india": { lat: 19.9975, lng: 73.7898, displayCity: "Nashik", displayCountry: "India" },
  "meerut|india": { lat: 28.9845, lng: 77.7064, displayCity: "Meerut", displayCountry: "India" },
  "rajkot|india": { lat: 22.3039, lng: 70.8022, displayCity: "Rajkot", displayCountry: "India" },
  "varanasi|india": { lat: 25.3176, lng: 82.9739, displayCity: "Varanasi", displayCountry: "India" },
  "srinagar|india": { lat: 34.0837, lng: 74.7973, displayCity: "Srinagar", displayCountry: "India" },
  "aurangabad|india": { lat: 19.8762, lng: 75.3433, displayCity: "Aurangabad", displayCountry: "India" },
  "dhanbad|india": { lat: 23.7957, lng: 86.4304, displayCity: "Dhanbad", displayCountry: "India" },
  "amritsar|india": { lat: 31.634, lng: 74.8723, displayCity: "Amritsar", displayCountry: "India" },
  "prayagraj|india": { lat: 25.4358, lng: 81.8463, displayCity: "Prayagraj", displayCountry: "India" },
  "ranchi|india": { lat: 23.3441, lng: 85.3096, displayCity: "Ranchi", displayCountry: "India" },
  "howrah|india": { lat: 22.5958, lng: 88.2636, displayCity: "Howrah", displayCountry: "India" },
  "jabalpur|india": { lat: 23.1815, lng: 79.9864, displayCity: "Jabalpur", displayCountry: "India" },
  "gwalior|india": { lat: 26.2183, lng: 78.1828, displayCity: "Gwalior", displayCountry: "India" },
  "vijayawada|india": { lat: 16.5062, lng: 80.648, displayCity: "Vijayawada", displayCountry: "India" },
  "jodhpur|india": { lat: 26.2389, lng: 73.0243, displayCity: "Jodhpur", displayCountry: "India" },
  "madurai|india": { lat: 9.9252, lng: 78.1198, displayCity: "Madurai", displayCountry: "India" },
  "raipur|india": { lat: 21.2514, lng: 81.6296, displayCity: "Raipur", displayCountry: "India" },
  "kota|india": { lat: 25.2138, lng: 75.8648, displayCity: "Kota", displayCountry: "India" },
  "guwahati|india": { lat: 26.1445, lng: 91.7362, displayCity: "Guwahati", displayCountry: "India" },
  "chandigarh|india": { lat: 30.7333, lng: 76.7794, displayCity: "Chandigarh", displayCountry: "India" },
  "solapur|india": { lat: 17.6599, lng: 75.9064, displayCity: "Solapur", displayCountry: "India" },
  "bareilly|india": { lat: 28.367, lng: 79.4304, displayCity: "Bareilly", displayCountry: "India" },
  "moradabad|india": { lat: 28.8386, lng: 78.7733, displayCity: "Moradabad", displayCountry: "India" },
  "mysore|india": { lat: 12.2958, lng: 76.6394, displayCity: "Mysore", displayCountry: "India" },
  "thiruvananthapuram|india": { lat: 8.5241, lng: 76.9366, displayCity: "Thiruvananthapuram", displayCountry: "India" },
  "kochi|india": { lat: 9.9312, lng: 76.2673, displayCity: "Kochi", displayCountry: "India" },
  "dehradun|india": { lat: 30.3165, lng: 78.0322, displayCity: "Dehradun", displayCountry: "India" },
  "shimla|india": { lat: 31.1048, lng: 77.1734, displayCity: "Shimla", displayCountry: "India" },
  "jammu|india": { lat: 32.7266, lng: 74.857, displayCity: "Jammu", displayCountry: "India" },
  "pilani|india": { lat: 28.3636, lng: 75.601, displayCity: "Pilani", displayCountry: "India" },
  "etah|india": { lat: 27.63, lng: 78.67, displayCity: "Etah", displayCountry: "India" },
  "kolhapur|india": { lat: 16.705, lng: 74.2433, displayCity: "Kolhapur", displayCountry: "India" },
  "hoshiarpur|india": { lat: 31.5305, lng: 75.9115, displayCity: "Hoshiarpur", displayCountry: "India" },
  "mohali|india": { lat: 30.7046, lng: 76.7179, displayCity: "Mohali", displayCountry: "India" },
  "ambala|india": { lat: 30.3782, lng: 76.7767, displayCity: "Ambala", displayCountry: "India" },
  "panvel|india": { lat: 18.9894, lng: 73.1175, displayCity: "Panvel", displayCountry: "India" },

  // --- INTERNATIONAL ---
  "new york|united states": { lat: 40.7128, lng: -74.006, displayCity: "New York", displayCountry: "United States" },
  "san francisco|united states": { lat: 37.7749, lng: -122.4194, displayCity: "San Francisco", displayCountry: "United States" },
  "san jose|united states": { lat: 37.3382, lng: -121.8863, displayCity: "San Jose", displayCountry: "United States" },
  "sunnyvale|united states": { lat: 37.3688, lng: -122.0363, displayCity: "Sunnyvale", displayCountry: "United States" },
  "seattle|united states": { lat: 47.6062, lng: -122.3321, displayCity: "Seattle", displayCountry: "United States" },
  "los angeles|united states": { lat: 34.0522, lng: -118.2437, displayCity: "Los Angeles", displayCountry: "United States" },
  "chicago|united states": { lat: 41.8781, lng: -87.6298, displayCity: "Chicago", displayCountry: "United States" },
  "boston|united states": { lat: 42.3601, lng: -71.0589, displayCity: "Boston", displayCountry: "United States" },
  "austin|united states": { lat: 30.2672, lng: -97.7431, displayCity: "Austin", displayCountry: "United States" },
  "dallas|united states": { lat: 32.7767, lng: -96.797, displayCity: "Dallas", displayCountry: "United States" },
  "columbia|united states": { lat: 34.0007, lng: -81.0348, displayCity: "Columbia", displayCountry: "United States" },
  "bellingham|united states": { lat: 48.7519, lng: -122.4787, displayCity: "Bellingham", displayCountry: "United States" },
  "london|united kingdom": { lat: 51.5074, lng: -0.1278, displayCity: "London", displayCountry: "United Kingdom" },
  "cambridge|united kingdom": { lat: 52.2053, lng: 0.1218, displayCity: "Cambridge", displayCountry: "United Kingdom" },
  "oxford|united kingdom": { lat: 51.752, lng: -1.2577, displayCity: "Oxford", displayCountry: "United Kingdom" },
  "toronto|canada": { lat: 43.6532, lng: -79.3832, displayCity: "Toronto", displayCountry: "Canada" },
  "vancouver|canada": { lat: 49.2827, lng: -123.1207, displayCity: "Vancouver", displayCountry: "Canada" },
  "waterloo|canada": { lat: 43.4643, lng: -80.5204, displayCity: "Waterloo", displayCountry: "Canada" },
  "singapore|singapore": { lat: 1.3521, lng: 103.8198, displayCity: "Singapore", displayCountry: "Singapore" },
  "dubai|united arab emirates": { lat: 25.2048, lng: 55.2708, displayCity: "Dubai", displayCountry: "United Arab Emirates" },
  "abu dhabi|united arab emirates": { lat: 24.4539, lng: 54.3773, displayCity: "Abu Dhabi", displayCountry: "United Arab Emirates" },
  "sydney|australia": { lat: -33.8688, lng: 151.2093, displayCity: "Sydney", displayCountry: "Australia" },
  "melbourne|australia": { lat: -37.8136, lng: 144.9631, displayCity: "Melbourne", displayCountry: "Australia" },
  "berlin|germany": { lat: 52.52, lng: 13.405, displayCity: "Berlin", displayCountry: "Germany" },
  "munich|germany": { lat: 48.1351, lng: 11.582, displayCity: "Munich", displayCountry: "Germany" },
  "dublin|ireland": { lat: 53.3498, lng: -6.2603, displayCity: "Dublin", displayCountry: "Ireland" },
  "helsingborg|sweden": { lat: 56.0467, lng: 12.6944, displayCity: "Helsingborg", displayCountry: "Sweden" },
  "kuala lumpur|malaysia": { lat: 3.139, lng: 101.6869, displayCity: "Kuala Lumpur", displayCountry: "Malaysia" },
  "tokyo|japan": { lat: 35.6762, lng: 139.6503, displayCity: "Tokyo", displayCountry: "Japan" },
};

/**
 * Normalizes city and country strings using alias mapping rules.
 */
function normalizeCityAndCountry(rawCity, rawCountry) {
  if (!rawCity) rawCity = "unknown";
  if (!rawCountry) rawCountry = "unknown";

  // Clean strings
  let cityStr = String(rawCity).toLowerCase().trim();
  let countryStr = String(rawCountry).toLowerCase().trim();

  // Normalize country alias
  if (COUNTRY_ALIASES[countryStr]) {
    countryStr = COUNTRY_ALIASES[countryStr];
  }

  // Normalize city alias
  if (CITY_ALIASES[cityStr]) {
    cityStr = CITY_ALIASES[cityStr];
  }

  const canonicalKey = `${cityStr}|${countryStr}`;
  const canonicalData = CANONICAL_CITIES[canonicalKey];

  // Capitalize nicely if not found in canonical table
  const capitalizeWords = (str) =>
    str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const displayCity = canonicalData
    ? canonicalData.displayCity
    : capitalizeWords(cityStr);
  const displayCountry = canonicalData
    ? canonicalData.displayCountry
    : capitalizeWords(countryStr);

  return {
    normalizedCity: cityStr,
    normalizedCountry: countryStr,
    canonicalKey,
    displayCity,
    displayCountry,
  };
}

/**
 * Get canonical location coordinates if available, or fallback.
 */
function getCanonicalLocation(city, country) {
  const norm = normalizeCityAndCountry(city, country);
  const canonical = CANONICAL_CITIES[norm.canonicalKey];
  if (canonical) {
    return {
      lat: canonical.lat,
      lng: canonical.lng,
      displayCity: canonical.displayCity,
      displayCountry: canonical.displayCountry,
      isCanonical: true,
    };
  }
  return {
    displayCity: norm.displayCity,
    displayCountry: norm.displayCountry,
    isCanonical: false,
  };
}

/**
 * Calculate Haversine distance in kilometers between two lat/lng pairs.
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = {
  COUNTRY_ALIASES,
  CITY_ALIASES,
  CANONICAL_CITIES,
  normalizeCityAndCountry,
  getCanonicalLocation,
  haversineDistanceKm,
};
