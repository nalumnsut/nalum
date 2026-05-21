import axios from "axios";
import { BASE_URL } from "./constants";

let accessToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  accessToken = token;
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds timeout for slow Render cold starts
  withCredentials: true, // Enable sending/receiving cookies
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

const refreshApi = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds timeout
  withCredentials: true, // Enable sending/receiving cookies
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

// No request interceptor needed — httpOnly cookies are sent automatically by the browser

let isRefreshing = false;
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}
let failedQueue: FailedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await refreshApi.post(
          "/auth/refresh",
          {},
          { withCredentials: true }
        );
        const newAccessToken = response.data.data.access_token;
        const userData = response.data.data.user;

        // Update the access token
        setAuthToken(newAccessToken);

        // access_token cookie is now set by the server (httpOnly)
        // No need to set it client-side
        if (userData) {
          localStorage.setItem("user", JSON.stringify(userData));
        }

        // Dispatch event to update AuthContext
        window.dispatchEvent(new CustomEvent("token-refreshed", {
          detail: {
            accessToken: newAccessToken,
            user: userData
          }
        }));

        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry the original request — the new access_token cookie is sent automatically
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Handle refresh token failure (e.g., redirect to login)
        window.dispatchEvent(new Event("auth-error"));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const verifyAlumniCode = async (code: string) => {
  return api.post("/alumni/verify-code", { code });
};

export const checkAlumniManual = async (data: {
  name: string;
  roll_no?: string;
  batch: string;
  branch: string;
  contact_info?: {
    phone?: string;
    alternate_email?: string;
    linkedin?: string;
  };
}) => {
  return api.post("/alumni/check-manual", data);
};

export const confirmAlumniMatch = async (payload: { roll_no: string }) => {
  return api.post("/alumni/confirm-match", payload);
};

export const getUserProfile = async () => {
  return api.get("/profile");
};

export const searchUsers = async (query: string, filters: any = {}) => {
  const params = new URLSearchParams();
  params.append("name", query);
  params.append("limit", "15");

  if (filters.batch) params.append("batch", filters.batch);
  if (filters.branch) params.append("branch", filters.branch);
  if (filters.campus) params.append("campus", filters.campus);
  if (filters.company) params.append("company", filters.company);
  if (filters.skills && filters.skills.length > 0) {
    filters.skills.forEach((skill: string) => params.append("skills[]", skill));
  }

  return api.get(`/profile/search?${params.toString()}`);
};

export const searchPosts = async (query: string) => {
  const params = new URLSearchParams();
  params.append("query", query);
  return api.get(`/posts/search?${params.toString()}`);
};

export const globalSearch = async (query: string, filters: any = {}) => {
  const [usersResponse, postsResponse] = await Promise.all([
    searchUsers(query, filters).catch(() => ({ data: { profiles: [] } })),
    searchPosts(query).catch(() => ({ data: { data: [] } }))
  ]);

  return {
    users: usersResponse.data.profiles || [],
    posts: postsResponse.data.data || []
  };
};

export default api;
