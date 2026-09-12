import { useEffect, useState, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BRANCHES, CAMPUSES, DEPARTMENTS } from "@/constants/branches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  Github,
  Globe,
  KeyRound,
  Linkedin,
  Loader2,
  Lock,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import XIcon from "@/components/icons/XIcon";
import { useAuth } from "@/context/AuthContext";
import { useProfile, Profile } from "@/context/ProfileContext";
import api from "@/lib/api";
import ProfilePictureUpload from "@/components/profile/ProfilePictureUpload";
import LocationSelector from "@/components/profile/LocationSelector";
import { toast } from "sonner";
import {
  POPULAR_COMPANIES,
  POPULAR_ROLES,
  POPULAR_SKILLS,
} from "@/lib/suggestions";

interface Experience {
  company: string;
  role: string;
  duration: string;
}

const BIO_MAX = 500;

// A bare "codrjatin.com" in an href is a *relative* path — the browser resolves
// it against the current route and lands on /dashboard/codrjatin.com. Links are
// normalised here, on write, so what's stored is always absolute.
const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;
};

const MONTHS = [
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
];

const YEARS = Array.from(
  { length: 30 },
  (_, i) => new Date().getFullYear() - i,
);

// Shared control styling — every input on this page reads from the same tokens.
const inputClass =
  "bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring";
const lockedClass =
  "bg-muted border-input text-muted-foreground disabled:opacity-100 disabled:cursor-not-allowed";
const selectItemClass =
  "cursor-pointer text-popover-foreground focus:bg-accent focus:text-accent-foreground";

const FormCard = ({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="rounded-card border border-border bg-card shadow-card p-6 overflow-visible">
    <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-border">
      <div className="min-w-0">
        <h3 className="text-headline-md text-foreground">{title}</h3>
        {description && (
          <p className="text-body-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
    {children}
  </section>
);

/** Autocomplete list, portalled so it escapes the card's stacking context. */
const SuggestionList = ({
  anchor,
  items,
  onSelect,
}: {
  anchor: HTMLInputElement | null | undefined;
  items: string[];
  onSelect: (value: string) => void;
}) => {
  if (!anchor) return null;
  const rect = anchor.getBoundingClientRect();

  return createPortal(
    <div
      className="fixed z-[9999] rounded-lg border border-border bg-popover shadow-overlay max-h-60 overflow-auto py-1"
      style={{ left: rect.left, top: rect.bottom + 4, width: rect.width }}
    >
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className="w-full text-left px-4 py-2 text-body-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
        >
          {item}
        </button>
      ))}
    </div>,
    document.body,
  );
};

const UpdateProfile = () => {
  const { accessToken, user, logout } = useAuth();
  const { profile: contextProfile, isLoading, refetchProfile } = useProfile();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateConfirmation, setDeactivateConfirmation] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Check if user is alumni / faculty
  const isAlumni = user?.role === "alumni";
  const isFaculty = user?.role === "faculty";

  const [formData, setFormData] = useState({
    batch: "",
    branch: "",
    department: "",
    campus: "",
    bio: "",
    current_company: "",
    current_role: "",
    location: {
      city: "",
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
        department: (contextProfile as any).department || "",
        campus: contextProfile.campus || "",
        bio: contextProfile.bio || "",
        current_company: contextProfile.current_company || "",
        current_role: contextProfile.current_role || "",
        location: {
          city: contextProfile.location?.city || "",
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

    const monthNum = MONTHS.indexOf(month);
    if (monthNum === -1) return null;

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
        experience?: Array<{
          company: string;
          role: string;
          duration: string;
        }>;
      }

      const updateData: UpdateData & { department?: string } = {};

      // Required fields - faculty uses department+campus, others use batch+branch+campus
      if (isFaculty) {
        if (formData.department && formData.campus) {
          (updateData as any).department = formData.department;
          updateData.campus = formData.campus;
        }
      } else if (formData.batch && formData.branch && formData.campus) {
        updateData.batch = formData.batch;
        updateData.branch = formData.branch;
        updateData.campus = formData.campus;
      }

      // Optional fields
      if (formData.bio !== undefined) updateData.bio = formData.bio.trim();
      if (formData.current_company !== undefined)
        updateData.current_company = formData.current_company;
      if (formData.current_role !== undefined)
        updateData.current_role = formData.current_role;
      if (formData.social_media)
        updateData.social_media = {
          linkedin: normalizeUrl(formData.social_media.linkedin),
          github: normalizeUrl(formData.social_media.github),
          twitter: normalizeUrl(formData.social_media.twitter),
          personal_website: normalizeUrl(
            formData.social_media.personal_website,
          ),
        };
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
            });
            setIsSaving(false);
            return;
          }
        }

        // Sort experiences by most recent first
        updateData.experience = sortExperiences(filledExperiences);
      }

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
      });

      // Refetch profile to update context
      await refetchProfile();

      navigate("/dashboard/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Update Failed", {
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (initialData) {
      setFormData(initialData);
      setProfilePicture(null);
      setRemovePhoto(false);
      setIsDirty(false);
      toast.info("Changes Discarded", {
        description: "Your unsaved changes have been reverted.",
      });
    }
  };

  const handleCancel = () => {
    handleDiscard();
    navigate("/dashboard/profile");
  };

  // Soft-deletes the account server-side and cascades to the user's posts,
  // comments, events, givings and queries. The typed confirmation is the only
  // guard, so the request is gated on it here as well as on the button.
  const handleDeactivateAccount = async () => {
    if (deactivateConfirmation !== "DELETE") return;
    setIsDeactivating(true);
    try {
      await api.delete("/auth/account");
      toast.success("Account deactivated");
      await logout();
      navigate("/");
    } catch (error: any) {
      console.error("Error deactivating account:", error);
      toast.error(
        error.response?.data?.message || "Failed to deactivate account"
      );
    } finally {
      setIsDeactivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-body-md text-muted-foreground">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="rounded-card border border-border bg-card shadow-card p-8 text-center max-w-md">
          <p className="text-body-md text-muted-foreground mb-4">
            Profile not found
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-foreground pb-28 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/dashboard/profile")}
          className="h-8 -ml-3 mb-4 px-3 text-label-sm text-muted-foreground hover:text-primary hover:bg-primary/5"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Profile
        </Button>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-headline-lg-mobile md:text-headline-xl text-primary">
              Edit Profile
            </h1>
            <p className="text-body-md text-muted-foreground mt-1">
              {isAlumni
                ? "Update your professional information and how you appear in the directory."
                : "Manage your academic and public identity on the alumni portal."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving || !isDirty}
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          {/* ---------- Left rail: identity, bio, skills ---------- */}
          <div className="md:col-span-4 space-y-6 min-w-0">
            <FormCard
              title="Profile Identity"
              description="A square headshot works best — at least 400×400px."
            >
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
            </FormCard>

            <FormCard title="Biography">
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-foreground">
                  About Me
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  maxLength={BIO_MAX}
                  rows={7}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Share a brief overview of your work, academic interests and what you're open to talking about..."
                  className={`${inputClass} resize-none`}
                />
                <p className="text-label-sm text-muted-foreground text-right">
                  {formData.bio.length} / {BIO_MAX}
                </p>
              </div>
            </FormCard>

            <FormCard title="Skills">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="skill" className="text-foreground">
                    Add a skill
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      ref={skillInputRef}
                      id="skill"
                      value={newSkill}
                      onChange={(e) => handleSkillInputChange(e.target.value)}
                      onFocus={() => newSkill && setShowSkillSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSkillSuggestions(false), 200)
                      }
                      placeholder="e.g., React, Python"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className={inputClass}
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      onClick={() => handleAddSkill()}
                      size="icon"
                      className="shrink-0 bg-primary hover:bg-primary-hover text-primary-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {showSkillSuggestions && filteredSkills.length > 0 && (
                    <SuggestionList
                      anchor={skillInputRef.current}
                      items={filteredSkills}
                      onSelect={handleAddSkill}
                    />
                  )}
                </div>

                {formData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.07] pl-3 pr-1.5 py-1 text-label-md text-primary"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          aria-label={`Remove ${skill}`}
                          className="rounded-full p-0.5 text-primary/60 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-muted-foreground">
                    No skills added yet.
                  </p>
                )}
              </div>
            </FormCard>
          </div>

          {/* ---------- Right column: the record ---------- */}
          <div className="md:col-span-8 space-y-6 min-w-0">
            <FormCard
              title="Academic Information"
              description={
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Verified at registration — contact an admin to change these.
                </span>
              }
            >
              <div className="space-y-4">
                {isFaculty ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          value={contextProfile?.user.name || ""}
                          readOnly
                          disabled
                          className={lockedClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-foreground">
                          Department
                        </Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) =>
                            handleInputChange("department", value)
                          }
                          disabled
                        >
                          <SelectTrigger className={lockedClass}>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border shadow-overlay">
                            {DEPARTMENTS.map((dep) => (
                              <SelectItem
                                key={dep}
                                value={dep}
                                className={selectItemClass}
                              >
                                {dep}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="campus" className="text-foreground">
                        Campus
                      </Label>
                      <Select
                        value={formData.campus}
                        onValueChange={(value) =>
                          handleInputChange("campus", value)
                        }
                        disabled
                      >
                        <SelectTrigger className={lockedClass}>
                          <SelectValue placeholder="Select campus" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border shadow-overlay">
                          {CAMPUSES.map((campus) => (
                            <SelectItem
                              key={campus}
                              value={campus}
                              className={selectItemClass}
                            >
                              {campus}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          value={contextProfile?.user.name || ""}
                          readOnly
                          disabled
                          className={lockedClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="batch" className="text-foreground">
                          {isAlumni ? "Class Year" : "Expected Graduation"}
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
                          className={lockedClass}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="branch" className="text-foreground">
                          Branch
                        </Label>
                        <Select
                          value={formData.branch}
                          onValueChange={(value) =>
                            handleInputChange("branch", value)
                          }
                          disabled
                        >
                          <SelectTrigger className={lockedClass}>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border shadow-overlay">
                            {BRANCHES.map((branch) => (
                              <SelectItem
                                key={branch}
                                value={branch}
                                className={selectItemClass}
                              >
                                {branch}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="campus" className="text-foreground">
                          Campus
                        </Label>
                        <Select
                          value={formData.campus}
                          onValueChange={(value) =>
                            handleInputChange("campus", value)
                          }
                          disabled
                        >
                          <SelectTrigger className={lockedClass}>
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border shadow-overlay">
                            {CAMPUSES.map((campus) => (
                              <SelectItem
                                key={campus}
                                value={campus}
                                className={selectItemClass}
                              >
                                {campus}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </FormCard>

            {/* Current Position - Only visible for Alumni */}
            {isAlumni && (
              <FormCard
                title="Current Position"
                description="Shown as the headline on your profile and directory card."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_role" className="text-foreground">
                      Role
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
                      className={inputClass}
                      autoComplete="off"
                    />
                    {showRoleSuggestions && filteredRoles.length > 0 && (
                      <SuggestionList
                        anchor={roleInputRef.current}
                        items={filteredRoles}
                        onSelect={(role) => {
                          handleInputChange("current_role", role);
                          setShowRoleSuggestions(false);
                        }}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="current_company"
                      className="text-foreground"
                    >
                      Company
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
                      className={inputClass}
                      autoComplete="off"
                    />
                    {showCompanySuggestions && filteredCompanies.length > 0 && (
                      <SuggestionList
                        anchor={companyInputRef.current}
                        items={filteredCompanies}
                        onSelect={(company) => {
                          handleInputChange("current_company", company);
                          setShowCompanySuggestions(false);
                        }}
                      />
                    )}
                  </div>
                </div>
              </FormCard>
            )}

            {/* Location */}
            {isAlumni && (
              <FormCard
                title="Location"
                description="Places you on the Alumni Network Map."
              >
                <LocationSelector
                  city={formData.location.city}
                  country={formData.location.country}
                  onLocationChange={(newCity, newCountry, newLat, newLng) => {
                    setFormData((prev) => ({
                      ...prev,
                      location: {
                        city: newCity,
                        country: newCountry,
                        lat: newLat,
                        lng: newLng,
                      },
                    }));
                  }}
                  variant="light"
                />
              </FormCard>
            )}

            {/* Social Media */}
            <FormCard
              title="Links"
              description="These appear in the Contact Information card on your profile."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="linkedin"
                    className="text-foreground inline-flex items-center gap-1.5"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    value={formData.social_media.linkedin}
                    onChange={(e) =>
                      handleSocialMediaChange("linkedin", e.target.value)
                    }
                    placeholder="https://linkedin.com/in/yourprofile"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="github"
                    className="text-foreground inline-flex items-center gap-1.5"
                  >
                    <Github className="h-3.5 w-3.5" />
                    GitHub
                  </Label>
                  <Input
                    id="github"
                    value={formData.social_media.github}
                    onChange={(e) =>
                      handleSocialMediaChange("github", e.target.value)
                    }
                    placeholder="https://github.com/yourusername"
                    className={inputClass}
                  />
                </div>
                {/* Still persisted as `social_media.twitter` — renaming the
                    key would need a data migration. */}
                <div className="space-y-2">
                  <Label
                    htmlFor="twitter"
                    className="text-foreground inline-flex items-center gap-1.5"
                  >
                    <XIcon className="h-3.5 w-3.5" />X
                  </Label>
                  <Input
                    id="twitter"
                    value={formData.social_media.twitter}
                    onChange={(e) =>
                      handleSocialMediaChange("twitter", e.target.value)
                    }
                    placeholder="https://x.com/yourusername"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="website"
                    className="text-foreground inline-flex items-center gap-1.5"
                  >
                    <Globe className="h-3.5 w-3.5" />
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
                    className={inputClass}
                  />
                </div>
              </div>
            </FormCard>

            {/* Experience */}
            <FormCard
              title="Experience"
              description="Listed most recent first on your profile."
              action={
                <Button
                  type="button"
                  onClick={handleAddExperience}
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-primary/30 bg-card text-primary hover:bg-primary/10 hover:text-primary"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              }
            >
              <div className="space-y-4">
                {formData.experience.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border py-8 text-center">
                    <p className="text-body-sm text-muted-foreground">
                      No experience added yet. Use “Add” to list a role or
                      internship.
                    </p>
                  </div>
                ) : (
                  formData.experience.map((exp, index) => {
                    const [startPart, endPart] = exp.duration.split(" - ");
                    const isPresent = endPart === "Present";

                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-border bg-surface-low p-4 md:p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="ap-overline">
                            Experience {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveExperience(index)}
                            aria-label={`Remove experience ${index + 1}`}
                            className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-foreground">Company</Label>
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
                              placeholder="e.g., Goldman Sachs"
                              className={inputClass}
                              autoComplete="off"
                              required
                            />
                            {showExpCompanySuggestions[index] &&
                              expCompanySuggestions[index]?.length > 0 && (
                                <SuggestionList
                                  anchor={expCompanyRefs.current[index]}
                                  items={expCompanySuggestions[index]}
                                  onSelect={(company) => {
                                    handleExperienceChange(
                                      index,
                                      "company",
                                      company,
                                    );
                                    setShowExpCompanySuggestions((prev) => ({
                                      ...prev,
                                      [index]: false,
                                    }));
                                  }}
                                />
                              )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-foreground">Role</Label>
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
                              placeholder="e.g., Financial Analyst Intern"
                              className={inputClass}
                              autoComplete="off"
                            />
                            {showExpRoleSuggestions[index] &&
                              expRoleSuggestions[index]?.length > 0 && (
                                <SuggestionList
                                  anchor={expRoleRefs.current[index]}
                                  items={expRoleSuggestions[index]}
                                  onSelect={(role) => {
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
                                />
                              )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Start date */}
                          <div className="space-y-2">
                            <Label className="text-foreground">
                              Start Date
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Select
                                value={startPart?.split(" ")[0] || ""}
                                onValueChange={(month) => {
                                  const year =
                                    startPart?.split(" ")[1] ||
                                    new Date().getFullYear();
                                  const newStart = `${month} ${year}`;
                                  handleExperienceChange(
                                    index,
                                    "duration",
                                    endPart
                                      ? `${newStart} - ${endPart}`
                                      : newStart,
                                  );
                                }}
                              >
                                <SelectTrigger className={inputClass}>
                                  <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border shadow-overlay">
                                  <div className="grid grid-cols-3 gap-1 p-2">
                                    {MONTHS.map((m) => (
                                      <SelectItem
                                        key={m}
                                        value={m}
                                        className={selectItemClass}
                                      >
                                        {m}
                                      </SelectItem>
                                    ))}
                                  </div>
                                </SelectContent>
                              </Select>
                              <Select
                                value={startPart?.split(" ")[1] || ""}
                                onValueChange={(year) => {
                                  const month = startPart?.split(" ")[0] || "Jan";
                                  const newStart = `${month} ${year}`;
                                  handleExperienceChange(
                                    index,
                                    "duration",
                                    endPart
                                      ? `${newStart} - ${endPart}`
                                      : newStart,
                                  );
                                }}
                              >
                                <SelectTrigger className={inputClass}>
                                  <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border shadow-overlay">
                                  <div className="grid grid-cols-3 gap-1 p-2 max-h-[240px] overflow-y-auto">
                                    {YEARS.map((y) => (
                                      <SelectItem
                                        key={y}
                                        value={String(y)}
                                        className={selectItemClass}
                                      >
                                        {y}
                                      </SelectItem>
                                    ))}
                                  </div>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* End date */}
                          <div className="space-y-2">
                            <Label className="text-foreground">End Date</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Select
                                value={endPart?.split(" ")[0] || ""}
                                onValueChange={(month) => {
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
                                    `${startPart ||
                                    "Jan " + new Date().getFullYear()
                                    } - ${newEnd}`,
                                  );
                                }}
                              >
                                <SelectTrigger className={inputClass}>
                                  <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent
                                  className="bg-popover border-border shadow-overlay max-h-[300px]"
                                  position="popper"
                                  sideOffset={5}
                                >
                                  <div className="p-2 space-y-1">
                                    <SelectItem
                                      value="Present"
                                      className={`${selectItemClass} mb-2 font-semibold`}
                                    >
                                      Present
                                    </SelectItem>
                                    <div className="grid grid-cols-3 gap-1">
                                      {MONTHS.map((m) => (
                                        <SelectItem
                                          key={m}
                                          value={m}
                                          className={selectItemClass}
                                        >
                                          {m}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  </div>
                                </SelectContent>
                              </Select>
                              {!isPresent && (
                                <Select
                                  value={endPart?.split(" ")[1] || ""}
                                  onValueChange={(year) => {
                                    const month =
                                      endPart?.split(" ")[0] || "Jan";
                                    const newEnd = `${month} ${year}`;
                                    handleExperienceChange(
                                      index,
                                      "duration",
                                      `${startPart ||
                                      "Jan " + new Date().getFullYear()
                                      } - ${newEnd}`,
                                    );
                                  }}
                                >
                                  <SelectTrigger className={inputClass}>
                                    <SelectValue placeholder="Year" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-popover border-border shadow-overlay">
                                    <div className="grid grid-cols-3 gap-1 p-2 max-h-[240px] overflow-y-auto">
                                      {YEARS.map((y) => (
                                        <SelectItem
                                          key={y}
                                          value={String(y)}
                                          className={selectItemClass}
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
                    );
                  })
                )}
              </div>
            </FormCard>
          </div>
        </form>

        {/* Deliberately outside the form: this is an account action, not a
            profile edit, and it must not be reachable by submitting. */}
        <section className="mt-6 rounded-card border border-border bg-card shadow-card p-6">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-border">
            <KeyRound className="h-5 w-5 text-primary" />
            <h3 className="text-headline-md text-foreground">Password & Security</h3>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-body-md font-medium text-foreground">
                Reset Password
              </h4>
              <p className="text-body-sm text-muted-foreground mt-1 max-w-2xl">
                Update your account password to keep your alumni portal access secure.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/change-password")}
              className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground shrink-0"
            >
              <KeyRound className="h-4 w-4 mr-2 text-primary" />
              Reset Password
            </Button>
          </div>
        </section>

        <section className="mt-6 rounded-card border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="text-headline-md text-destructive">Danger Zone</h3>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body-sm text-muted-foreground max-w-2xl">
              Deactivating your account removes your posts, comments, events,
              givings and queries from the network. This cannot be easily undone.
            </p>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setDeactivateConfirmation("");
                setDeactivateOpen(true);
              }}
              className="shrink-0"
            >
              Deactivate Account
            </Button>
          </div>
        </section>
      </div>

      <AlertDialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          setDeactivateOpen(open);
          if (!open) setDeactivateConfirmation("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
            <AlertDialogDescription>
              This deactivates your account and removes your posts, comments,
              events, givings and queries. Type{" "}
              <span className="font-semibold text-destructive">DELETE</span> to
              confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-2">
            <Label htmlFor="deactivate-confirm" className="sr-only">
              Type DELETE to confirm
            </Label>
            <Input
              id="deactivate-confirm"
              value={deactivateConfirmation}
              onChange={(e) => setDeactivateConfirmation(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog mounted while the request is in flight;
                // Radix closes on action click by default.
                e.preventDefault();
                handleDeactivateAccount();
              }}
              disabled={deactivateConfirmation !== "DELETE" || isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating…
                </>
              ) : (
                "Confirm Deactivation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UpdateProfile;
