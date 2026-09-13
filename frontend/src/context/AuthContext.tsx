import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

import axios from "axios";
import { BASE_URL } from "@/lib/constants";
import { setAuthToken } from "@/lib/api";
import { SessionLoadingScreen } from "@/components/app/AppComponents";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "alumni" | "student" | "faculty";
  email_verified: boolean;
  profileCompleted: boolean;
  verified_alumni: boolean;
}

interface AuthContextType {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isFaculty: boolean;
  isVerifiedAlumni: boolean | null;

  setAuth: (
    token: string,
    user: User
  ) => void;

  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  // Must start `true`: restoreSession() only runs in an effect, i.e. after the
  // first commit. Starting `false` meant that first render exposed children to
  // `accessToken === null`, so ProtectedRoute bounced a hard page load to
  // /login, which then bounced to the role's post-login path — silently
  // discarding the requested URL. Deep links and refresh both landed on
  // /dashboard.
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!accessToken;
  const isAdmin = user?.role === "admin";
  const isFaculty = user?.role === "faculty";
  const isVerifiedAlumni = user ? (user.verified_alumni ?? false) : null;

  const setAuth = (
    token: string,
    userData: User
  ) => {
    setAccessTokenState(token);
    setUser(userData);

    setAuthToken(token);

    localStorage.setItem("user", JSON.stringify(userData));
  };

  const clearAuth = () => {
    setAccessTokenState(null);
    setUser(null);

    setAuthToken(null);

    localStorage.removeItem("user");
  };
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setIsLoading(true);

        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        );

        const {
          access_token,
          user,
        } = response.data.data;

        setAuth(access_token, user);

      } catch (err) {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);
  const refreshUser = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const { access_token, user } = response.data.data;
      setAuth(access_token, user);
    } catch (err) {
      console.error('Failed to refresh user session', err);
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${BASE_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );
    } catch (err) {
      console.error(err);
    } finally {
      clearAuth();
    }
  };
  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        isFaculty,
        isVerifiedAlumni,
        setAuth,
        logout,
        refreshUser,
      }}
    >
      {/* Block children from rendering while checking the session */}
      {isLoading ? (
        <SessionLoadingScreen />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
};