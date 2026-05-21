import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { setAuthToken } from "../lib/api";
import axios from "axios";
import { BASE_URL } from "@/lib/constants";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  email_verified: boolean;
  profileCompleted: boolean;
  verified_alumni: boolean;
}

interface AuthContextType {
  accessToken: string | null;
  email: string | null;
  user: User | null;
  isVerifiedAlumni: boolean | null;
  isRestoringSession: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (
    token: string | null,
    email: string | null,
    isVerified: boolean | null,
    user?: User | null
  ) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isVerifiedAlumni, setIsVerifiedAlumni] = useState<boolean | null>(
    null
  );
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  // Computed values
  const isAuthenticated = !!accessToken && !!email;
  const isAdmin = user?.role === "admin";

  // Silent refresh on app load to restore session
  useEffect(() => {
    const restoreSession = async () => {
      // Try to restore user info from localStorage for instant UI update
      const storedEmail = localStorage.getItem("email");
      const storedUser = localStorage.getItem("user");
      const storedVerified = localStorage.getItem("isVerifiedAlumni");

      if (storedEmail && storedUser) {
        setEmail(storedEmail);
        setUser(JSON.parse(storedUser));
        setIsVerifiedAlumni(storedVerified === "true");
      }

      // Then, try to refresh the token from the backend
      try {
        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const {
          access_token,
          email: userEmail,
          user: userData,
        } = response.data.data;
        const verified_alumni = userData?.verified_alumni || false;

        // Update state with fresh token
        setAccessToken(access_token);
        setEmail(userEmail);
        setUser(userData);
        setIsVerifiedAlumni(verified_alumni);
        setAuthToken(access_token);

        // Persist user info to localStorage (access_token is in httpOnly cookie)
        localStorage.setItem("email", userEmail);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("isVerifiedAlumni", String(verified_alumni));

        console.log("Session restored successfully:", { role: userData?.role });
      } catch (error) {
        // No valid refresh token or it's expired
        console.log("No active session to restore");

        // Clear localStorage if refresh fails
        if (!storedEmail) {
          localStorage.removeItem("email");
          localStorage.removeItem("user");
          localStorage.removeItem("isVerifiedAlumni");
        }
      } finally {
        setIsRestoringSession(false);
      }
    };

    // Listen for token refresh events from the API interceptor
    const handleTokenRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { accessToken: newToken, user: userData } = customEvent.detail;

      setAccessToken(newToken);
      setAuthToken(newToken);
      if (userData) {
        setUser(userData);
        setIsVerifiedAlumni(userData.verified_alumni || false);
      }
    };

    // Listen for auth errors from the API interceptor
    const handleAuthError = () => {
      logout();
    };

    window.addEventListener("token-refreshed", handleTokenRefresh);
    window.addEventListener("auth-error", handleAuthError);

    // Only attempt restore if we don't already have a token
    if (!accessToken) {
      restoreSession();
    } else {
      setIsRestoringSession(false);
    }

    return () => {
      window.removeEventListener("token-refreshed", handleTokenRefresh);
      window.removeEventListener("auth-error", handleAuthError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const setAuth = (
    token: string | null,
    email: string | null,
    isVerified: boolean | null,
    userData: User | null = null
  ) => {
    setAccessToken(token);
    setEmail(email);
    setUser(userData);
    setIsVerifiedAlumni(isVerified);
    setAuthToken(token);

    // Persist user info to localStorage (access_token is in httpOnly cookie)
    if (token && email) {
      localStorage.setItem("email", email);
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      }
      if (isVerified !== null) {
        localStorage.setItem("isVerifiedAlumni", String(isVerified));
      }
    } else {
      // Clear localStorage if logging out
      localStorage.removeItem("email");
      localStorage.removeItem("user");
      localStorage.removeItem("isVerifiedAlumni");
    }
  };

  const refreshUser = async () => {
    if (!accessToken) return;

    try {
      const response = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const {
        access_token,
        email: userEmail,
        user: userData,
      } = response.data.data;
      const verified_alumni = userData?.verified_alumni || false;

      // Update state with fresh data
      setAccessToken(access_token);
      setEmail(userEmail);
      setUser(userData);
      setIsVerifiedAlumni(verified_alumni);
      setAuthToken(access_token);

      // Persist user info to localStorage (access_token is in httpOnly cookie)
      localStorage.setItem("email", userEmail);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("isVerifiedAlumni", String(verified_alumni));
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear refresh token cookie on backend
      await axios.post(
        `${BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with local logout even if backend call fails
    } finally {
      // Clear local auth state
      setAccessToken(null);
      setEmail(null);
      setUser(null);
      setIsVerifiedAlumni(null);
      setAuthToken(null);

      // Clear localStorage
      localStorage.removeItem("email");
      localStorage.removeItem("user");
      localStorage.removeItem("isVerifiedAlumni");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        email,
        user,
        isVerifiedAlumni,
        isRestoringSession,
        isAuthenticated,
        isAdmin,
        setAuth,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
