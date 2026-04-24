import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { useResponsivePagination } from "./useResponsivePagination";
import { trackSearch } from "@/lib/analytics";

export interface AlumniProfile {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  };
  batch: string;
  branch: string;
  campus: string;
  current_company?: string;
  current_role?: string;
  profile_picture?: string;
  skills?: string[];
  connectionStatus?: string;
}

export interface Filters {
  name: string;
  batch: string;
  branch: string;
  campus: string;
  company: string;
  city: string;
  country: string;
  connectionFilter: string;
  roleFilter: string;
  skills: string[];
}

interface SearchParams {
  page: number;
  limit: number;
  name?: string;
  graduationYear?: string;
  branch?: string;
  campus?: string;
  company?: string;
  city?: string;
  country?: string;
  skills?: string;
}

export const useAlumniDirectory = () => {
  const { accessToken } = useAuth();
  const itemsPerPage = useResponsivePagination(); // Dynamic page size based on screen
  const [profile, setProfile] = useState<any>(null);
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [skillInput, setSkillInput] = useState("");
  const [lastSearchedFilters, setLastSearchedFilters] = useState<Filters>({
    name: "",
    batch: "",
    branch: "",
    campus: "",
    company: "",
    city: "",
    country: "",
    connectionFilter: "all",
    roleFilter: "all",
    skills: [],
  });

  const [filters, setFilters] = useState<Filters>({
    name: "",
    batch: "",
    branch: "",
    campus: "",
    company: "",
    city: "",
    country: "",
    connectionFilter: "all",
    roleFilter: "all",
    skills: [],
  });

  // Fetch current user profile for navbar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/profile/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setProfile(response.data.profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (accessToken) {
      fetchProfile();
    }
  }, [accessToken]);

  // Fetch alumni based on filters
  const fetchAlumni = async (page = 1) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const params: SearchParams = {
        page,
        limit: itemsPerPage, // Use dynamic page size based on screen dimensions
      };

      if (filters.name) params.name = filters.name;
      if (filters.batch) params.graduationYear = filters.batch;
      if (filters.branch) params.branch = filters.branch;
      if (filters.campus) params.campus = filters.campus;
      if (filters.company) params.company = filters.company;
      if (filters.city) params.city = filters.city;
      if (filters.country) params.country = filters.country;
      if (filters.skills.length > 0) params.skills = filters.skills.join(",");

      const response = await api.get("/profile/search", {
        params,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Filter out current user from results (backup safety filter)
      let profiles = response.data.profiles || [];
      if (profile && profile.user && profile.user._id) {
        profiles = profiles.filter(
          (alumnus: AlumniProfile) => alumnus.user._id !== profile.user._id
        );
      }

      // Always update alumni state, even if empty
      setAlumni(profiles);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (error) {
      console.error("Error fetching alumni:", error);
      // Clear alumni on error
      setAlumni([]);
      toast.error("Failed to load alumni", {
        description: "Please try again later",
        style: {
          background: "#800000",
          color: "white",
          border: "2px solid #FFD700",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search with debounce when filters change
  useEffect(() => {
    // Check if any filter has a value
    const hasAnyFilter =
      filters.name ||
      filters.batch ||
      filters.branch ||
      filters.campus ||
      filters.company ||
      filters.city ||
      filters.country ||
      filters.connectionFilter !== "all" ||
      filters.roleFilter !== "all" ||
      filters.skills.length > 0;

    // If no filters, clear results and return to initial state
    if (!hasAnyFilter) {
      setAlumni([]);
      setHasSearched(false);
      setLastSearchedFilters({
        name: "",
        batch: "",
        branch: "",
        campus: "",
        company: "",
        city: "",
        country: "",
        connectionFilter: "all",
        roleFilter: "all",
        skills: [],
      });
      return;
    }

    // Debounce the search - wait 500ms after user stops typing
    const timeoutId = setTimeout(() => {
      setAlumni([]); // Clear previous results
      setCurrentPage(1);
      setLastSearchedFilters({ ...filters });
      fetchAlumni(1);
    }, 500);

    // Cleanup function to cancel the timeout if filters change again
    return () => clearTimeout(timeoutId);
  }, [filters, profile]);

  // Refetch when itemsPerPage changes (screen resize)
  useEffect(() => {
    if (hasSearched && alumni.length > 0) {
      setCurrentPage(1);
      fetchAlumni(1);
    }

  }, [itemsPerPage]); // Only depend on itemsPerPage to avoid infinite loops

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !filters.skills.includes(skillInput.trim())) {
      setFilters((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleSearch = () => {
    setAlumni([]); // Clear previous results before new search
    setCurrentPage(1);
    setLastSearchedFilters({ ...filters }); // Store the filters we're searching with
    const activeFilters = [filters.name, filters.batch, filters.branch, filters.campus, filters.company, filters.city, filters.country]
      .filter(Boolean)
      .join(', ');
    if (activeFilters) trackSearch(activeFilters, 'alumni_directory');
    fetchAlumni(1);
  };

  const handleClearResults = () => {
    setFilters({
      name: "",
      batch: "",
      branch: "",
      campus: "",
      company: "",
      city: "",
      country: "",
      connectionFilter: "all",
      roleFilter: "all",
      skills: [],
    });
    setLastSearchedFilters({
      name: "",
      batch: "",
      branch: "",
      campus: "",
      company: "",
      city: "",
      country: "",
      connectionFilter: "all",
      roleFilter: "all",
      skills: [],
    });
    setAlumni([]);
    setHasSearched(false);
    setCurrentPage(1);
  };

  // Check if current filters differ from last searched filters
  const hasFiltersChanged = () => {
    return (
      filters.name !== lastSearchedFilters.name ||
      filters.batch !== lastSearchedFilters.batch ||
      filters.branch !== lastSearchedFilters.branch ||
      filters.campus !== lastSearchedFilters.campus ||
      filters.company !== lastSearchedFilters.company ||
      filters.city !== lastSearchedFilters.city ||
      filters.country !== lastSearchedFilters.country ||
      filters.connectionFilter !== lastSearchedFilters.connectionFilter ||
      filters.roleFilter !== lastSearchedFilters.roleFilter ||
      filters.skills.length !== lastSearchedFilters.skills.length ||
      filters.skills.some(
        (skill, index) => skill !== lastSearchedFilters.skills[index]
      )
    );
  };

  const showClearButton = hasSearched && !hasFiltersChanged();

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchAlumni(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConnect = async (recipientId: string, message?: string) => {
    try {
      await api.post(
        "/chat/connections/request",
        { recipientId, requestMessage: message },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Refresh the alumni list to update connection status
      fetchAlumni(currentPage);

      toast.success("Connection request sent!", {
        style: {
          background: "#10b981",
          color: "white",
          border: "2px solid #059669",
        },
      });
    } catch (error: any) {
      console.error("Error sending connection request:", error);
      toast.error(
        error.response?.data?.message || "Failed to send connection request",
        {
          style: {
            background: "#800000",
            color: "white",
            border: "2px solid #FFD700",
          },
        }
      );
    }
  };

  // Client-side filtering logic
  const getFilteredAlumni = () => {
    return alumni.filter((alumnus) => {
      // Apply connection status filter
      if (filters.connectionFilter === "connected") {
        if (alumnus.connectionStatus !== "accepted") return false;
      } else if (filters.connectionFilter === "not_connected") {
        if (alumnus.connectionStatus === "accepted") return false;
      }

      // Apply role filter
      if (filters.roleFilter === "alumni") {
        if (alumnus.user.role !== "alumni") return false;
      } else if (filters.roleFilter === "student") {
        if (alumnus.user.role !== "student") return false;
      }

      return true;
    });
  };

  return {
    // State
    profile,
    alumni,
    isLoading,
    hasSearched,
    showFilters,
    currentPage,
    totalPages,
    filters,
    skillInput,
    showClearButton,
    // Setters
    setShowFilters,
    setSkillInput,
    setCurrentPage,
    // Handlers
    handleFilterChange,
    handleAddSkill,
    handleRemoveSkill,
    handleSearch,
    handleClearResults,
    handlePageChange,
    handleConnect,
    hasFiltersChanged,
    getFilteredAlumni,
  };
};
