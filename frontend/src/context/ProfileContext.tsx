import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import api from "@/lib/api";

interface Experience {
  company: string;
  role: string;
  duration: string;
}

export interface Profile {
  user: {
    _id: string;
    name: string;
    email: string;
    // Populated by GET /profile/me — drives the student vs. alumni sections.
    role?: string;
  };
  profile_picture?: string;
  branch?: string;
  batch?: string;
  department?: string;
  campus?: string;
  bio?: string;
  current_company?: string;
  current_role?: string;
  location?: {
    city?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  social_media?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    personal_website?: string;
  };
  skills?: string[];
  experience?: Experience[];
}

interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  refetchProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken, user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    if (!accessToken) { setIsLoading(false); return; }
    if (user?.role === 'admin') { setIsLoading(false); return; }

    try {
      setIsLoading(true);
      const response = await api.get("/profile/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProfile(response.data.profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [accessToken, user]);

  const refetchProfile = async () => {
    await fetchProfile();
  };

  return (
    <ProfileContext.Provider value={{ profile, isLoading, refetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
