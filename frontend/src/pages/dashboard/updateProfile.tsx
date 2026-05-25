import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRANCHES, CAMPUSES } from "@/constants/branches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProfile, Profile } from "@/context/ProfileContext";
import api from "@/lib/api";
import UserAvatar from "@/components/UserAvatar";
import ProfilePictureUpload from "@/components/profile/ProfilePictureUpload";
import MapLocationPicker, { type LocationData } from "@/components/signup/MapLocationPicker";
import { toast } from "sonner";
import {
  POPULAR_COMPANIES,
  POPULAR_ROLES,
  POPULAR_SKILLS,
} from "@/lib/suggestions";
import { validateTextInput } from "@/lib/validation";

interface Experience {
  company: string;
  role: string;
  duration: string;
}

const UpdateProfile = () => {
  const { accessToken, logout, user } = useAuth();
  const { profile: contextProfile, isLoading, refetchProfile } = useProfile();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Check if user is alumni
  const isAlumni = user?.role === "alumni";

  const [formData, setFormData] = useState({
    batch: "",
    branch: "",
    campus: "",
    current_company: "",
    current_role: "",
    location: {
      locality: "",
      city: "",
      state: "",
      country: "",
      lat: undefined as number | undefined,
      lng: undefined as number | undefined,
    },
    social_media: {
      linkedin: "",
      github: "",
      twitter: "",
      personal_website: "",
    },
    skills: [] as string[],
    experience: [] as Experience[],
  });

  const [newSkill, setNewSkill] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  // Refs for input positioning
  const roleInputRef = useRef<HTMLInputElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const expCompanyRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const expRoleRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Autocomplete state
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<string[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<string[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
  const [expCompanySuggestions, setExpCompanySuggestions] = useState<{
    [key: number]: string[];
  }>({});
  const [expRoleSuggestions, setExpRoleSuggestions] = useState<{
    [key: number]: string[];
  }>({});
  const [showExpCompanySuggestions, setShowExpCompanySuggestions] = useState<{
    [key: number]: boolean;
  }>({});
  const [showExpRoleSuggestions, setShowExpRoleSuggestions] = useState<{
    [key: number]: boolean;
  }>({});

  // Force re-render for dropdown positioning on scroll/resize
  const [, setForceUpdate] = useState(0);

  // Update dropdown positions on scroll/resize (don't close them)
  useEffect(() => {
    const handleScrollOrResize = () => {
      // Trigger re-render to update dropdown positions
      setForceUpdate((prev) => prev + 1);
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, []);

  useEffect(() => {
    // Use context profile data instead of fetching again
    if (contextProfile) {
      setProfile(contextProfile);

      const initialFormData = {
        batch: contextProfile.batch || "",
        branch: contextProfile.branch || "",
        campus: contextProfile.campus || "",
        current_company: contextProfile.current_company || "",
        current_role: contextProfile.current_role || "",
        location: {
          locality: contextProfile.location?.locality || "",
          city: contextProfile.location?.city || "",
          state: contextProfile.location?.state || "",
          country: contextProfile.location?.country || "",
          lat: contextProfile.location?.lat,
          lng: contextProfile.location?.lng,
        },
        social_media: {
          linkedin: contextProfile.social_media?.linkedin || "",
          github: contextProfile.social_media?.github || "",
          twitter: contextProfile.social_media?.twitter || "",
          personal_website: contextProfile.social_media?.personal_website || "",
        },
        skills: contextProfile.skills || [],
        experience: contextProfile.experience || [],
      };
      setFormData(initialFormData);
      setInitialData(initialFormData);
    }
  }, [contextProfile]);

  // Check for unsaved changes
  useEffect(() => {
    if (!initialData) return;
    const isChanged =
      JSON.stringify(formData) !== JSON.stringify(initialData) ||
      profilePicture !== null ||
      removePhoto;
    setIsDirty(isChanged);
  }, [formData, initialData, profilePicture, removePhoto]);

  // Autocomplete handlers
  const handleCompanyChange = (value: string) => {
    handleInputChange("current_company", value);
    if (value.length > 0) {
      const filtered = POPULAR_COMPANIES.filter((company) =>
        company.toLowerCase().includes(value.toLowerCase()),
      ).slice(0, 5);
      setFilteredCompanies(filtered);
      setShowCompanySuggestions(filtered.length > 0);
    } else {
      setShowCompanySuggestions(false);
    }
  };

  const handleRoleChange = (value: string) => {
    handleInputChange("current_role", value);
    if (value.length > 0) {
      const filtered = POPULAR_ROLES.filter((role) =>
        role.toLowerCase().includes(value.toLowerCase()),
      ).slice(0, 5);
      setFilteredRoles(filtered);
      setShowRoleSuggestions(filtered.length > 0);
    } else {
      setShowRoleSuggestions(false);
    }
  };

  const handleExpCompanyChange = (index: number, value: string) => {
    handleExperienceChange(index, "company", value);
    if (value.length > 0) {
      const filtered = POPULAR_COMPANIES.filter((company) =>
        company.toLowerCase().includes(value.toLowerCase()),
      ).slice(0, 5);
      setExpCompanySuggestions((prev) => ({ ...prev, [index]: filtered }));
      setShowExpCompanySuggestions((prev) => ({
        ...prev,
        [index]: filtered.length > 0,
      }));
    } else {
      setShowExpCompanySuggestions((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleExpRoleChange = (index: number, value: string) => {
    handleExperienceChange(index, "role", value);
    if (value.length > 0) {
      const filtered = POPULAR_ROLES.filter((role) =>
        role.toLowerCase().includes(value.toLowerCase()),
      ).slice(0, 5);
      setExpRoleSuggestions((prev) => ({ ...prev, [index]: filtered }));
      setShowExpRoleSuggestions((prev) => ({
        ...prev,
        [index]: filtered.length > 0,
      }));
    } else {
      setShowExpRoleSuggestions((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value,
      },
    }));
  };

  const handleSkillInputChange = (value: string) => {
    setNewSkill(value);
    if (value.length > 0) {
      const filtered = POPULAR_SKILLS.filter((skill) =>
        skill.toLowerCase().includes(value.toLowerCase()),
      ).slice(0, 8);
      setFilteredSkills(filtered);
      setShowSkillSuggestions(filtered.length > 0);
    } else {
      setShowSkillSuggestions(false);
    }
  };

  const handleAddSkill = (skill?: string) => {
    const skillToAdd = skill || newSkill.trim();
    if (skillToAdd && !formData.skills.includes(skillToAdd)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillToAdd],
      }));
      setNewSkill("");
      setShowSkillSuggestions(false);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleAddExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, { company: "", role: "", duration: "" }],
    }));
  };

  const handleExperienceChange = (
    index: number,
    field: keyof Experience,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp,
      ),
    }));
  };

  const handleRemoveExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  // Helper function to parse date from "MMM YYYY" or "Present"
  const parseExperienceDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr === "Present") {
      return new Date(); // Present = current date
    }

    const [month, year] = dateStr.split(" ");
    if (!month || !year) return null;

    const monthMap: { [key: string]: number } = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    const monthNum = monthMap[month];
    if (monthNum === undefined) return null;

    return new Date(parseInt(year), monthNum);
  };

  // Validate experience dates
  const validateExperience = (exp: Experience): string | null => {
    if (!exp.duration) return null;

    const parts = exp.duration.split(" - ");
    if (parts.length !== 2) return null;

    const [startStr, endStr] = parts;
    const startDate = parseExperienceDate(startStr);
    const endDate = parseExperienceDate(endStr);

    if (!startDate || !endDate) {
      return "Invalid date format";
    }

    if (endDate < startDate) {
      return "End date cannot be earlier than start date";
    }

    return null;
  };

  // Sort experiences by end date (most recent first)
  const sortExperiences = (experiences: Experience[]): Experience[] => {
    return [...experiences].sort((a, b) => {
      const aEndDate = parseExperienceDate(a.duration.split(" - ")[1] || "");
      const bEndDate = parseExperienceDate(b.duration.split(" - ")[1] || "");

      if (!aEndDate || !bEndDate) return 0;

      // Most recent first (descending order)
      return bEndDate.getTime() - aEndDate.getTime();
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Prepare update data - only include fields that have values
      interface UpdateData {
        batch?: string;
        branch?: string;
        campus?: string;
        current_company?: string;
        current_role?: string;
        location?: {
          locality?: string;
          city?: string;
          state?: string;
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
        experience?: Array<{
          company: string;
          role: string;
          duration: string;
        }>;
      }

      const updateData: UpdateData = {};

      // Required fields - only if all three are present
      if (formData.batch && formData.branch && formData.campus) {
        updateData.batch = formData.batch;
        updateData.branch = formData.branch;
        updateData.campus = formData.campus;
      }

      // Optional fields
      if (formData.current_company !== undefined)
        updateData.current_company = formData.current_company;
      if (formData.current_role !== undefined)
        updateData.current_role = formData.current_role;
      if (formData.social_media)
        updateData.social_media = formData.social_media;
      if (formData.skills) updateData.skills = formData.skills;
      if (
        formData.location &&
        (formData.location.city || formData.location.country)
      )
        updateData.location = formData.location;

      // Validate and sort experience entries
      if (formData.experience && formData.experience.length > 0) {
        // Filter out empty experience entries
        const filledExperiences = formData.experience.filter(
          (exp) => exp.company || exp.role || exp.duration,
        );

        // Validate each experience
        for (let i = 0; i < filledExperiences.length; i++) {
          const exp = filledExperiences[i];
          const error = validateExperience(exp);
          if (error) {
            toast.error("Experience Validation Error", {
              description: `Experience ${i + 1}: ${error}`,
              style: {
                background: "#800000",
                color: "white",
                border: "2px solid #FFD700",
              },
            });
            setIsSaving(false);
            return;
          }
        }

        // Sort experiences by most recent first
        updateData.experience = sortExperiences(filledExperiences);
      }

      console.log("Sending update data:", updateData);

      // Update profile data
      await api.put("/profile/update", updateData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Handle profile picture changes
      if (removePhoto) {
        // Remove profile picture
        await api.delete("/profile/picture", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setRemovePhoto(false);
      } else if (profilePicture) {
        // Upload new profile picture
        const pictureFormData = new FormData();
        pictureFormData.append("profile_picture", profilePicture);

        await api.post("/profile/picture", pictureFormData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      const locationChanged =
        formData.location &&
        (formData.location.city || formData.location.country) &&
        (formData.location.city !== initialData?.location?.city ||
          formData.location.country !== initialData?.location?.country);

      toast.success("Profile Updated!", {
        description: locationChanged
          ? "Your changes have been saved. Location will be added to the map soon."
          : "Your changes have been saved successfully",
        style: {
          background: "#800000",
          color: "white",
          border: "2px solid #FFD700",
        },
      });

      // Refetch profile to update context
      await refetchProfile();

      navigate("/dashboard/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Update Failed", {
        description: "Failed to update profile. Please try again.",
        style: {
          background: "#800000",
          color: "white",
          border: "2px solid #FFD700",
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (initialData) {
      setFormData(initialData);
      setProfilePicture(null);
      setIsDirty(false);
      toast.info("Changes Discarded", {
        description: "Your unsaved changes have been reverted.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Card className="max-w-md bg-slate-900/50 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-400 mb-4">Profile not found</p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 hover:bg-blue-500"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-foreground relative pb-24">
      {/* Main Content */}
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6 overflow-visible">
              <h3 className="text-lg font-semibold text-white mb-4">
                Profile Picture
              </h3>
              <div className="flex justify-center">
                <ProfilePictureUpload
                  currentImage={contextProfile?.profile_picture}
                  userName={contextProfile?.user.name || "User"}
                  onImageSelect={(file) => {
                    if (file === null) {
                      setRemovePhoto(true);
                      setProfilePicture(null);
                    } else {
                      setRemovePhoto(false);
                      setProfilePicture(file);
                    }
                  }}
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6 overflow-visible">
              <h3 className="text-lg font-semibold text-white mb-4">
                Academic Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch" className="text-gray-300">
                      Batch *
                    </Label>
                    <Input
                      id="batch"
                      type="text"
                      value={formData.batch}
                      onChange={(e) =>
                        handleInputChange("batch", e.target.value)
                      }
                      placeholder="e.g., 2020"
                      readOnly
                      disabled
                      className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-gray-300">
                      Branch *
                    </Label>
                    <Select
                      value={formData.branch}
                      onValueChange={(value) =>
                        handleInputChange("branch", value)
                      }
                      disabled
                    >
                      <SelectTrigger className="bg-black/20 border-white/10 text-white focus:ring-blue-500/20 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-2xl">
                        {BRANCHES.map((branch) => (
                          <SelectItem
                            key={branch}
                            value={branch}
                            className="text-white cursor-pointer rounded-md transition-all hover:bg-white/10 hover:backdrop-brightness-125 hover:!text-white focus:bg-white/10 focus:!text-white"
                          >
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campus" className="text-gray-300">
                    Campus *
                  </Label>
                  <Select
                    value={formData.campus}
                    onValueChange={(value) =>
                      handleInputChange("campus", value)
                    }
                    disabled
                  >
                    <SelectTrigger className="bg-black/20 border-white/10 text-white focus:ring-blue-500/20 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-2xl">
                      {CAMPUSES.map((campus) => (
                        <SelectItem
                          key={campus}
                          value={campus}
                          className="text-white cursor-pointer rounded-md transition-all hover:bg-white/10 hover:backdrop-brightness-125 hover:!text-white focus:bg-white/10 focus:!text-white"
                        >
                          {campus}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6 overflow-visible">
              <h3 className="text-lg font-semibold text-white mb-4">
                Location
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Update your location to appear on the Alumni Network Map
              </p>
              <MapLocationPicker
                variant="dark"
                height="400px"
                value={{
                  locality: formData.location.locality,
                  city: formData.location.city,
                  state: formData.location.state,
                  country: formData.location.country,
                  lat: formData.location.lat,
                  lng: formData.location.lng,
                }}
                onChange={(newLocation) => {
                  setFormData((prev) => ({
                    ...prev,
                    location: {
                      locality: newLocation.locality || "",
                      city: newLocation.city,
                      state: newLocation.state || "",
                      country: newLocation.country,
                      lat: newLocation.lat,
                      lng: newLocation.lng,
                    },
                  }));
                }}
              />
            </div>

            {/* Current Position - Only visible for Alumni */}
            {isAlumni && (
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6 overflow-visible">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Current Position
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="current_role" className="text-gray-300">
                      Current Role
                    </Label>
                    <Input
                      ref={roleInputRef}
                      id="current_role"
                      value={formData.current_role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      onFocus={() =>
                        formData.current_role && setShowRoleSuggestions(true)
                      }
                      onBlur={() =>
                        setTimeout(() => setShowRoleSuggestions(false), 200)
                      }
                      placeholder="e.g., Software Engineer"
                      className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                      autoComplete="off"
                    />
                    {showRoleSuggestions &&
                      filteredRoles.length > 0 &&
                      createPortal(
                        <div
                          className="fixed z-[9999] bg-white/5 backdrop-blur-xl border border-white/15 rounded-md shadow-2xl max-h-60 overflow-auto"
                          style={{
                            left: roleInputRef.current?.getBoundingClientRect()
                              .left,
                            top:
                              roleInputRef.current?.getBoundingClientRect()
                                .bottom! + 4,
                            width:
                              roleInputRef.current?.getBoundingClientRect()
                                .width,
                          }}
                        >
                          {filteredRoles.map((role, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full text-left px-4 py-2 text-white cursor-pointer rounded-md transition-all hover:bg-white/10 hover:backdrop-brightness-125 hover:!text-white focus:bg-white/10 focus:!text-white text-sm"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleInputChange("current_role", role);
                                setShowRoleSuggestions(false);
                              }}
                            >
                              {role}
                            </button>
                          ))}
                        </div>,
                        document.body,
                      )}
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="current_company" className="text-gray-300">
                      Current Company
                    </Label>
                    <Input
                      ref={companyInputRef}
                      id="current_company"
                      value={formData.current_company}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      onFocus={() =>
                        formData.current_company &&
                        setShowCompanySuggestions(true)
                      }
                      onBlur={() =>
                        setTimeout(() => setShowCompanySuggestions(false), 200)
                      }
                      placeholder="e.g., Google"
                      className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                      autoComplete="off"
                    />
                    {showCompanySuggestions &&
                      filteredCompanies.length > 0 &&
                      createPortal(
                        <div
                          className="fixed z-[9999] bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl max-h-60 overflow-auto"
                          style={{
                            left: companyInputRef.current?.getBoundingClientRect()
                              .left,
                            top:
                              companyInputRef.current?.getBoundingClientRect()
                                .bottom! + 4,
                            width:
                              companyInputRef.current?.getBoundingClientRect()
                                .width,
                          }}
                        >
                          {filteredCompanies.map((company, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full text-left px-4 py-2.5 text-white cursor-pointer transition-all hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white text-sm font-medium"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleInputChange("current_company", company);
                                setShowCompanySuggestions(false);
                              }}
                            >
                              {company}
                            </button>
                          ))}
                        </div>,
                        document.body,
                      )}
                  </div>
                </div>
              </div>
            )}
            {/* Social Media */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6 overflow-visible">
              <h3 className="text-lg font-semibold text-white mb-4">
                Social Media Links
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-gray-300">
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    value={formData.social_media.linkedin}
                    onChange={(e) =>
                      handleSocialMediaChange("linkedin", e.target.value)
                    }
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github" className="text-gray-300">
                    GitHub
                  </Label>
                  <Input
                    id="github"
                    value={formData.social_media.github}
                    onChange={(e) =>
                      handleSocialMediaChange("github", e.target.value)
                    }
                    placeholder="https://github.com/yourusername"
                    className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="text-gray-300">
                    Twitter
                  </Label>
                  <Input
                    id="twitter"
                    value={formData.social_media.twitter}
                    onChange={(e) =>
                      handleSocialMediaChange("twitter", e.target.value)
                    }
                    placeholder="https://twitter.com/yourusername"
                    className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-gray-300">
                    Personal Website
                  </Label>
                  <Input
                    id="website"
                    value={formData.social_media.personal_website}
                    onChange={(e) =>
                      handleSocialMediaChange(
                        "personal_website",
                        e.target.value,
                      )
                    }
                    placeholder="https://yourwebsite.com"
                    className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6 overflow-visible">
              <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
              <div className="space-y-4">
                <div className="flex gap-2 relative">
                  <div className="flex-1 relative">
                    <Input
                      ref={skillInputRef}
                      value={newSkill}
                      onChange={(e) => handleSkillInputChange(e.target.value)}
                      onFocus={() => newSkill && setShowSkillSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSkillSuggestions(false), 200)
                      }
                      placeholder="Add a skill (e.g., React, Python)"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                      autoComplete="off"
                    />
                    {showSkillSuggestions &&
                      filteredSkills.length > 0 &&
                      createPortal(
                        <div
                          className="fixed z-[9999] bg-white/5 backdrop-blur-xl border border-white/15 rounded-md shadow-2xl max-h-60 overflow-auto"
                          style={{
                            left: skillInputRef.current?.getBoundingClientRect()
                              .left,
                            top:
                              skillInputRef.current?.getBoundingClientRect()
                                .bottom! + 4,
                            width:
                              skillInputRef.current?.getBoundingClientRect()
                                .width,
                          }}
                        >
                          {filteredSkills.map((skill, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full text-left px-4 py-2 text-white cursor-pointer rounded-md transition-all hover:bg-white/10 hover:backdrop-brightness-125 hover:!text-white focus:bg-white/10 focus:!text-white text-sm"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAddSkill(skill);
                              }}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>,
                        document.body,
                      )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleAddSkill()}
                    className="bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-white/10 border border-white/5 px-3 py-1 rounded-full text-gray-200"
                      >
                        <span className="text-sm">{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-red-400 hover:text-red-300 ml-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Experience */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6 overflow-visible">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Experience</h3>
                <Button
                  type="button"
                  onClick={handleAddExperience}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-6">
                {formData.experience.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No experience added yet. Click "Add Experience" to get
                    started.
                  </p>
                ) : (
                  formData.experience.map((exp, index) => (
                    <div
                      key={index}
                      className="p-4 md:p-5 border border-white/20 rounded-xl space-y-4 bg-white/5 backdrop-blur-sm hover:border-white/30 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-white text-base">
                          Experience {index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExperience(index)}
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2 relative">
                          <Label className="text-gray-300">Company</Label>
                          <Input
                            ref={(el) => (expCompanyRefs.current[index] = el)}
                            value={exp.company}
                            onChange={(e) =>
                              handleExpCompanyChange(index, e.target.value)
                            }
                            onFocus={() =>
                              exp.company &&
                              setShowExpCompanySuggestions((prev) => ({
                                ...prev,
                                [index]: true,
                              }))
                            }
                            onBlur={() =>
                              setTimeout(
                                () =>
                                  setShowExpCompanySuggestions((prev) => ({
                                    ...prev,
                                    [index]: false,
                                  })),
                                200,
                              )
                            }
                            placeholder="Company name"
                            className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                            autoComplete="off"
                            required
                          />
                          {showExpCompanySuggestions[index] &&
                            expCompanySuggestions[index]?.length > 0 &&
                            createPortal(
                              <div
                                className="fixed z-[9999] bg-white/5 backdrop-blur-xl border border-white/15 rounded-md shadow-2xl max-h-60 overflow-auto"
                                style={{
                                  left: expCompanyRefs.current[
                                    index
                                  ]?.getBoundingClientRect().left,
                                  top:
                                    expCompanyRefs.current[
                                      index
                                    ]?.getBoundingClientRect().bottom! + 4,
                                  width:
                                    expCompanyRefs.current[
                                      index
                                    ]?.getBoundingClientRect().width,
                                }}
                              >
                                {expCompanySuggestions[index].map(
                                  (company, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      className="w-full text-left px-4 py-2 text-white cursor-pointer rounded-md transition-all hover:bg-white/10 hover:backdrop-brightness-125 hover:!text-white focus:bg-white/10 focus:!text-white text-sm"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleExperienceChange(
                                          index,
                                          "company",
                                          company,
                                        );
                                        setShowExpCompanySuggestions(
                                          (prev) => ({
                                            ...prev,
                                            [index]: false,
                                          }),
                                        );
                                      }}
                                    >
                                      {company}
                                    </button>
                                  ),
                                )}
                              </div>,
                              document.body,
                            )}
                        </div>
                        <div className="space-y-2 relative">
                          <Label className="text-gray-300">Role</Label>
                          <Input
                            ref={(el) => (expRoleRefs.current[index] = el)}
                            value={exp.role}
                            onChange={(e) =>
                              handleExpRoleChange(index, e.target.value)
                            }
                            onFocus={() =>
                              exp.role &&
                              setShowExpRoleSuggestions((prev) => ({
                                ...prev,
                                [index]: true,
                              }))
                            }
                            onBlur={() =>
                              setTimeout(
                                () =>
                                  setShowExpRoleSuggestions((prev) => ({
                                    ...prev,
                                    [index]: false,
                                  })),
                                200,
                              )
                            }
                            placeholder="Your role"
                            className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                            autoComplete="off"
                          />
                          {showExpRoleSuggestions[index] &&
                            expRoleSuggestions[index]?.length > 0 &&
                            createPortal(
                              <div
                                className="fixed z-[9999] bg-white/5 backdrop-blur-xl border border-white/15 rounded-md shadow-2xl max-h-60 overflow-auto"
                                style={{
                                  left: expRoleRefs.current[
                                    index
                                  ]?.getBoundingClientRect().left,
                                  top:
                                    expRoleRefs.current[
                                      index
                                    ]?.getBoundingClientRect().bottom! + 4,
                                  width:
                                    expRoleRefs.current[
                                      index
                                    ]?.getBoundingClientRect().width,
                                }}
                              >
                                {expRoleSuggestions[index].map((role, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-white cursor-pointer rounded-md transition-all hover:bg-white/10 hover:backdrop-brightness-125 hover:!text-white focus:bg-white/10 focus:!text-white text-sm"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleExperienceChange(
                                        index,
                                        "role",
                                        role,
                                      );
                                      setShowExpRoleSuggestions((prev) => ({
                                        ...prev,
                                        [index]: false,
                                      }));
                                    }}
                                  >
                                    {role}
                                  </button>
                                ))}
                              </div>,
                              document.body,
                            )}
                        </div>
                        <div className="space-y-3">
                          <Label className="text-gray-300">Duration</Label>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-400">
                                Start Date
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Select
                                  value={
                                    exp.duration
                                      .split(" - ")[0]
                                      ?.split(" ")[0] || ""
                                  }
                                  onValueChange={(month) => {
                                    const [start, end] =
                                      exp.duration.split(" - ");
                                    const year =
                                      start?.split(" ")[1] ||
                                      new Date().getFullYear();
                                    const newStart = `${month} ${year}`;
                                    handleExperienceChange(
                                      index,
                                      "duration",
                                      end ? `${newStart} - ${end}` : newStart,
                                    );
                                  }}
                                >
                                  <SelectTrigger className="bg-black/20 border-white/10 text-white text-sm h-10">
                                    <SelectValue placeholder="Month" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-2xl">
                                    <div className="grid grid-cols-3 gap-1 p-2">
                                      {[
                                        "Jan",
                                        "Feb",
                                        "Mar",
                                        "Apr",
                                        "May",
                                        "Jun",
                                        "Jul",
                                        "Aug",
                                        "Sep",
                                        "Oct",
                                        "Nov",
                                        "Dec",
                                      ].map((m) => (
                                        <SelectItem
                                          key={m}
                                          value={m}
                                          className="text-white cursor-pointer rounded-md transition-all hover:bg-white/10 hover:backdrop-brightness-125 hover:!text-white focus:bg-white/10 focus:!text-white"
                                        >
                                          {m}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={
                                    exp.duration
                                      .split(" - ")[0]
                                      ?.split(" ")[1] || ""
                                  }
                                  onValueChange={(year) => {
                                    const [start, end] =
                                      exp.duration.split(" - ");
                                    const month = start?.split(" ")[0] || "Jan";
                                    const newStart = `${month} ${year}`;
                                    handleExperienceChange(
                                      index,
                                      "duration",
                                      end ? `${newStart} - ${end}` : newStart,
                                    );
                                  }}
                                >
                                  <SelectTrigger className="bg-black/20 border-white/10 text-white text-sm h-10">
                                    <SelectValue placeholder="Year" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-2xl">
                                    <div className="grid grid-cols-3 gap-1 p-2 max-h-[240px] overflow-y-auto">
                                      {Array.from(
                                        { length: 30 },
                                        (_, i) => new Date().getFullYear() - i,
                                      ).map((y) => (
                                        <SelectItem
                                          key={y}
                                          value={String(y)}
                                          className="text-white cursor-pointer rounded-md transition-all hover:bg-white/10 hover:backdrop-brightness-125 hover:!text-white focus:bg-white/10 focus:!text-white"
                                        >
                                          {y}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-400">
                                End Date
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Select
                                  value={
                                    exp.duration
                                      .split(" - ")[1]
                                      ?.split(" ")[0] || ""
                                  }
                                  onValueChange={(month) => {
                                    const [start] = exp.duration.split(" - ");
                                    const endPart =
                                      exp.duration.split(" - ")[1];
                                    const year =
                                      endPart?.split(" ")[1] ||
                                      new Date().getFullYear();
                                    const newEnd =
                                      month === "Present"
                                        ? "Present"
                                        : `${month} ${year}`;
                                    handleExperienceChange(
                                      index,
                                      "duration",
                                      `${
                                        start ||
                                        "Jan " + new Date().getFullYear()
                                      } - ${newEnd}`,
                                    );
                                  }}
                                >
                                  <SelectTrigger className="bg-black/20 border-white/10 text-white text-sm h-10">
                                    <SelectValue placeholder="Month" />
                                  </SelectTrigger>
                                  <SelectContent
                                    className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-2xl max-h-[300px]"
                                    position="popper"
                                    sideOffset={5}
                                  >
                                    <div className="p-2 space-y-1">
                                      <SelectItem
                                        value="Present"
                                        className="text-white cursor-pointer rounded-md mb-2 font-semibold transition-all hover:bg-white/15 hover:backdrop-brightness-125 hover:!text-white focus:bg-white/15 focus:!text-white"
                                      >
                                        Present
                                      </SelectItem>
                                      <div className="grid grid-cols-3 gap-1">
                                        {[
                                          "Jan",
                                          "Feb",
                                          "Mar",
                                          "Apr",
                                          "May",
                                          "Jun",
                                          "Jul",
                                          "Aug",
                                          "Sep",
                                          "Oct",
                                          "Nov",
                                          "Dec",
                                        ].map((m) => (
                                          <SelectItem
                                            key={m}
                                            value={m}
                                            className="text-white cursor-pointer rounded-md transition-all hover:bg-white/10 hover:backdrop-brightness-125 hover:!text-white focus:bg-white/10 focus:!text-white"
                                          >
                                            {m}
                                          </SelectItem>
                                        ))}
                                      </div>
                                    </div>
                                  </SelectContent>
                                </Select>
                                {exp.duration.split(" - ")[1] !== "Present" && (
                                  <Select
                                    value={
                                      exp.duration
                                        .split(" - ")[1]
                                        ?.split(" ")[1] || ""
                                    }
                                    onValueChange={(year) => {
                                      const [start] = exp.duration.split(" - ");
                                      const endPart =
                                        exp.duration.split(" - ")[1];
                                      const month =
                                        endPart?.split(" ")[0] || "Jan";
                                      const newEnd = `${month} ${year}`;
                                      handleExperienceChange(
                                        index,
                                        "duration",
                                        `${
                                          start ||
                                          "Jan " + new Date().getFullYear()
                                        } - ${newEnd}`,
                                      );
                                    }}
                                  >
                                    <SelectTrigger className="bg-black/20 border-white/10 text-white text-sm h-10">
                                      <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white/5 backdrop-blur-xl border border-white/15 shadow-2xl">
                                      <div className="grid grid-cols-3 gap-1 p-2 max-h-[240px] overflow-y-auto">
                                        {Array.from(
                                          { length: 30 },
                                          (_, i) =>
                                            new Date().getFullYear() - i,
                                        ).map((y) => (
                                          <SelectItem
                                            key={y}
                                            value={String(y)}
                                            className="text-white cursor-pointer rounded-md transition-all hover:bg-white/10 hover:backdrop-brightness-125 hover:!text-white focus:bg-white/10 focus:!text-white"
                                          >
                                            {y}
                                          </SelectItem>
                                        ))}
                                      </div>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Unsaved Changes Popup */}
      {isDirty && (
        <div className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-foreground text-background px-4 py-3 md:px-6 md:py-4 rounded-2xl shadow-2xl border border-border min-w-[280px] md:min-w-[400px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              <p className="font-medium text-sm md:text-base">
                You have unsaved changes
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDiscard}
                  className="hover:bg-background/20 hover:text-background text-background/80 flex-1 sm:flex-none"
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="bg-nsut-maroon hover:bg-red-900 text-white rounded-full px-6 flex-1 sm:flex-none"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateProfile;
