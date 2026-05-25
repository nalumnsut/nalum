import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ProfilePictureUpload from "@/components/profile/ProfilePictureUpload";
import MapLocationPicker, { type LocationData } from "@/components/signup/MapLocationPicker";
import { BRANCHES, CAMPUSES } from "@/constants/branches";
import { POPULAR_COMPANIES, POPULAR_ROLES } from "@/lib/suggestions";
import {
  GraduationCap,
  Briefcase,
  Link2,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import nsutLogo from "@/assets/nsut-logo.svg";
import nsutCampusHero from "@/assets/hero.webp";
import { useAuth } from "../../context/AuthContext";
import { validateTextInput } from "@/lib/validation";
interface Experience {
  company: string;
  role: string;
  duration: string;
}

interface SocialLinks {
  linkedin: string;
  github: string;
  twitter: string;
  personal_website: string;
}

const ProfileForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accessToken, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Check if user is alumni
  const isAlumni = user?.role === "alumni";
  const [wantsAdditionalInfo, setWantsAdditionalInfo] = useState(false);

  // Form state - Profile Picture
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [userName, setUserName] = useState("User");

  // Form state - Essential Info
  const [branch, setBranch] = useState("");
  const [campus, setCampus] = useState("");
  const [batch, setBatch] = useState("2025");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<string[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<string[]>([]);

  // Form state - Social Media
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    linkedin: "",
    github: "",
    twitter: "",
    personal_website: "",
  });

  // Form state - Location
  const [locationData, setLocationData] = useState<LocationData>({
    locality: "",
    city: "",
    state: "",
    country: "",
  });

  // Form state - Additional Info
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [experience, setExperience] = useState<Experience[]>([]);

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const { data } = await api.get("/profile/status");
        if (data.profileCompleted) {
          toast({ title: "You have already completed your profile." });
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Failed to check profile status", error);
      }
    };

    // Get user name from access token for avatar
    const getUserName = () => {
      try {
        if (accessToken) {
          const payload = JSON.parse(atob(accessToken.split(".")[1]));
          setUserName(payload.name || "User");
        }
      } catch (error) {
        console.error("Failed to get user name", error);
      }
    };

    checkProfileStatus();
    getUserName();
  }, [navigate, toast, accessToken]);

  const addSkill = () => {
    if (newSkill.trim() && skills.length < 10) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    if (experience.length < 5) {
      setExperience([...experience, { company: "", role: "", duration: "" }]);
    }
  };

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const updateExperience = (
    index: number,
    field: keyof Experience,
    value: string,
  ) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const updateSocialLink = (platform: keyof SocialLinks, value: string) => {
    setSocialLinks({ ...socialLinks, [platform]: value });
  };

  const handleCompanyChange = (value: string) => {
    setCurrentCompany(value);
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
    setCurrentRole(value);
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

  const nextStep = () => {
    if (currentStep === 2 && (!branch || !campus || !batch)) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    if (currentStep === 4 && (!locationData.city || !locationData.country)) {
      toast({
        title: "Please provide your City and Country",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const totalSteps = wantsAdditionalInfo ? 5 : 4;

  const handleSubmit = async () => {
    if (!locationData.city || !locationData.country) {
      toast({
        title: "Please provide your City and Country",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Use FormData for file upload
    const formData = new FormData();
    formData.append("branch", branch);
    formData.append("campus", campus);
    formData.append("batch", batch);

    if (currentCompany) formData.append("current_company", currentCompany);
    if (currentRole) formData.append("current_role", currentRole);
    if (profilePicture) formData.append("profile_picture", profilePicture);

    formData.append("social_media", JSON.stringify(socialLinks));
    if (locationData.city && locationData.country) {
      formData.append("location", JSON.stringify({
        locality: locationData.locality,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
        lat: locationData.lat,
        lng: locationData.lng,
      }));
    }
    if (skills.length > 0) formData.append("skills", JSON.stringify(skills));
    if (experience.length > 0)
      formData.append("experience", JSON.stringify(experience));

    try {
      await api.post("/profile/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast({ title: "Profile created successfully! 🎉" });
      navigate("/dashboard");
    } catch (error) {
      toast({ title: "Error creating profile.", variant: "destructive" });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Profile Picture
              </h2>
              <p className="text-base text-gray-600">
                Add a profile picture to help alumni recognize you (optional)
              </p>
            </div>

            {/* Profile Picture Upload */}
            <div className="flex justify-center py-8">
              <ProfilePictureUpload
                currentImage={undefined}
                onImageSelect={setProfilePicture}
                userName={userName}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> A clear profile picture helps other alumni
                recognize and connect with you. You can also add this later from
                your dashboard.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Academic Information
              </h2>
              <p className="text-base text-gray-600">
                Tell us about your time at NSUT
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch" className="text-base text-gray-900">
                Branch/Department <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={setBranch} value={branch}>
                <SelectTrigger id="branch" className="h-12 text-base">
                  <SelectValue placeholder="Select your branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campus" className="text-base text-gray-900">
                Campus <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={setCampus} value={campus}>
                <SelectTrigger id="campus" className="h-12 text-base">
                  <SelectValue placeholder="Select your campus" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPUSES.map((campus) => (
                    <SelectItem key={campus} value={campus}>
                      {campus}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch" className="text-base text-gray-900">
                Year of Graduation <span className="text-red-500">*</span>
              </Label>
              <Select value={batch} onValueChange={setBatch}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 50 }, (_, i) => {
                    const year = 2030 - i;
                    const currentYear = new Date().getFullYear();
                    // Students can only pick current year or future years
                    // Alumni can pick any year
                    if (!isAlumni && year < currentYear) {
                      return null;
                    }
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {isAlumni && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="currentCompany"
                    className="text-base text-gray-900"
                  >
                    Current Company{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                    <Input
                      id="currentCompany"
                      placeholder="Start typing to see suggestions..."
                      value={currentCompany}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      onFocus={() =>
                        currentCompany && setShowCompanySuggestions(true)
                      }
                      onBlur={() =>
                        setTimeout(() => setShowCompanySuggestions(false), 200)
                      }
                      className="pl-10 h-12 text-base"
                      autoComplete="off"
                    />
                    {showCompanySuggestions && filteredCompanies.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredCompanies.map((company, index) => (
                          <button
                            key={index}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm"
                            onClick={() => {
                              setCurrentCompany(company);
                              setShowCompanySuggestions(false);
                            }}
                          >
                            {company}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="currentRole"
                    className="text-base text-gray-900"
                  >
                    Current Role{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentRole"
                      placeholder="Start typing to see suggestions..."
                      value={currentRole}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      onFocus={() =>
                        currentRole && setShowRoleSuggestions(true)
                      }
                      onBlur={() =>
                        setTimeout(() => setShowRoleSuggestions(false), 200)
                      }
                      className="h-12 text-base"
                      autoComplete="off"
                    />
                    {showRoleSuggestions && filteredRoles.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredRoles.map((role, index) => (
                          <button
                            key={index}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm"
                            onClick={() => {
                              setCurrentRole(role);
                              setShowRoleSuggestions(false);
                            }}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Social Media Links
              </h2>
              <p className="text-base text-gray-600">
                Help fellow alumni connect with you (all optional)
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="linkedin"
                className="text-base text-gray-900 flex items-center gap-2"
              >
                <Link2 className="h-4 w-4" />
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={socialLinks.linkedin}
                onChange={(e) =>
                  setSocialLinks({ ...socialLinks, linkedin: e.target.value })
                }
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="github"
                className="text-base text-gray-900 flex items-center gap-2"
              >
                <Link2 className="h-4 w-4" />
                GitHub
              </Label>
              <Input
                id="github"
                type="url"
                placeholder="https://github.com/yourusername"
                value={socialLinks.github}
                onChange={(e) =>
                  setSocialLinks({ ...socialLinks, github: e.target.value })
                }
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="twitter"
                className="text-base text-gray-900 flex items-center gap-2"
              >
                <Link2 className="h-4 w-4" />
                Twitter/X
              </Label>
              <Input
                id="twitter"
                type="url"
                placeholder="https://twitter.com/yourusername"
                value={socialLinks.twitter}
                onChange={(e) =>
                  setSocialLinks({ ...socialLinks, twitter: e.target.value })
                }
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="website"
                className="text-base text-gray-900 flex items-center gap-2"
              >
                <Link2 className="h-4 w-4" />
                Personal Website/Portfolio
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourwebsite.com"
                value={socialLinks.personal_website}
                onChange={(e) =>
                  setSocialLinks({
                    ...socialLinks,
                    personal_website: e.target.value,
                  })
                }
                className="h-12 text-base"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Additional Information
              </h2>
              <p className="text-base text-gray-600">
                Want to add more details to your profile?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Your Location
                </h3>
                <p className="text-sm text-gray-600">
                  Help fellow alumni find you on our network map
                </p>
              </div>
              <MapLocationPicker
                value={locationData}
                onChange={setLocationData}
              />
            </div>

            <div className="flex items-start space-x-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Checkbox
                id="additional-info"
                checked={wantsAdditionalInfo}
                onCheckedChange={(checked) =>
                  setWantsAdditionalInfo(checked as boolean)
                }
              />
              <div className="space-y-1">
                <Label
                  htmlFor="additional-info"
                  className="text-base text-gray-900 font-semibold cursor-pointer"
                >
                  Add Skills & Work Experience
                </Label>
                <p className="text-base text-gray-600">
                  Include your professional skills and work history to help
                  others discover your expertise
                </p>
              </div>
            </div>

            {!wantsAdditionalInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-base text-gray-700">
                  <strong>Note:</strong> You can skip this and complete your
                  profile now. You will be able to add more information later
                  from your dashboard.
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Skills & Experience
              </h2>
              <p className="text-base text-gray-600">
                Showcase your professional journey
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-base text-gray-900 font-semibold">
                Skills (Max 10)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Python, React, Machine Learning"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSkill())
                  }
                  className="h-10 text-base"
                  disabled={skills.length >= 10}
                />
                <Button
                  type="button"
                  onClick={addSkill}
                  disabled={skills.length >= 10 || !newSkill.trim()}
                  className="bg-nsut-maroon hover:bg-nsut-maroon/90"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="bg-nsut-maroon/10 text-nsut-maroon px-3 py-1 rounded-full flex items-center gap-2 text-base"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(index)}
                      className="hover:text-nsut-maroon/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base text-gray-900 font-semibold">
                  Work Experience (Max 5)
                </Label>
                <Button
                  type="button"
                  onClick={addExperience}
                  disabled={experience.length >= 5}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {experience.map((exp, index) => (
                <div
                  key={index}
                  className="border border-gray-300 rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-base font-semibold text-gray-700">
                      Experience #{index + 1}
                    </span>
                    <button
                      onClick={() => removeExperience(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Input
                    placeholder="Company Name"
                    value={exp.company}
                    onChange={(e) =>
                      updateExperience(index, "company", e.target.value)
                    }
                    className="h-10 text-base"
                  />
                  <Input
                    placeholder="Role/Position"
                    value={exp.role}
                    onChange={(e) =>
                      updateExperience(index, "role", e.target.value)
                    }
                    className="h-10 text-base"
                  />
                  <Input
                    placeholder="Duration (e.g., Jan 2020 - Dec 2022)"
                    value={exp.duration}
                    onChange={(e) =>
                      updateExperience(index, "duration", e.target.value)
                    }
                    className="h-10 text-base"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 pt-16 lg:pt-0">
      <div className="relative hidden lg:flex flex-col items-start justify-between p-10">
        <img
          src={nsutCampusHero}
          alt="NSUT Campus"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <Link
          to="/"
          className="relative z-10 flex items-center gap-3 text-white"
        >
          <img
            src={nsutLogo}
            alt="NSUT Logo"
            width="40"
            height="40"
            className="h-10 w-10"
          />
          <div className="flex flex-col items-start">
            <h1 className="text-xl md:text-2xl font-bold leading-none tracking-wide whitespace-nowrap">
              <span className="text-red-600">N</span>
              <span className="text-white">SUT</span>
              <span className="text-red-600"> ALUM</span>
              <span className="text-white">NI</span>
            </h1>
            <span className="block text-[8px] md:text-xs font-bold tracking-widest text-white">
              ASSOCIATION
            </span>
          </div>
        </Link>
        <div className="relative z-10 text-white">
          <h1 className="text-4xl font-serif font-bold">
            Complete Your Profile
          </h1>
          <p className="mt-2 max-w-md text-lg text-white/80">
            Help us build a stronger alumni network by sharing your academic and
            professional journey.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-nsut-yellow" />
            <span className="text-sm">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen lg:min-h-full">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-md space-y-8">
          <div>
            <Link
              to="/"
              className="lg:hidden flex items-center gap-3 text-nsut-maroon mb-6 justify-center"
            >
              <img src={nsutLogo} alt="NSUT Logo" className="h-8 w-8" />
              <div className="flex flex-col items-start">
                <h1 className="text-xl font-bold leading-none tracking-wide text-gray-800 whitespace-nowrap">
                  <span className="text-red-600">N</span>SUT
                  <span className="text-red-600"> ALUM</span>NI
                </h1>
                <span className="block text-[8px] font-bold tracking-widest text-gray-700">
                  ASSOCIATION
                </span>
              </div>
            </Link>
            <div className="mb-6">
              <div className="flex justify-between mb-2 text-xs text-gray-600">
                <span>Step {currentStep}</span>
                <span>{totalSteps} Steps</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-nsut-maroon h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            {renderStep()}
          </div>

          <div className="flex justify-between gap-4">
            {currentStep > 1 && (
              <Button
                onClick={prevStep}
                variant="outline"
                className="flex-1 h-12"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                className="flex-1 h-12 bg-nsut-maroon hover:bg-nsut-maroon/90 text-white"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 h-12 bg-nsut-maroon hover:bg-nsut-maroon/90 text-white"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Creating Profile...
                  </span>
                ) : (
                  "Complete Profile"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
