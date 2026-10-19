const API_BASE =
  import.meta.env.MODE === "production"
    ? "" // In production, nginx serves frontend and proxies /api requests
    : import.meta.env.VITE_API_URL_DEV;

export const BASE_URL = `${API_BASE}/api`;
