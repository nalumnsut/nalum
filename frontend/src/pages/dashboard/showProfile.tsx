import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  User,
  Briefcase,
  MapPin,
  Edit,
  Linkedin,
  Github,
  Twitter,
  Globe,
  ArrowLeft,
  Loader2,
  LogOut,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import UserAvatar from "@/components/UserAvatar";
import { toast } from "sonner";
import MyPosts from "./MyPosts";

interface Profile {
  user: {
    name: string;
    email: string;
    role: string;
  };
  batch: string;
  branch: string;
  campus: string;
  current_company?: string;
  current_role?: string;
  profile_picture?: string;
  social_media?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    personal_website?: string;
  };
  location?: {
    city?: string;
    country?: string;
  };
  skills?: string[];
  experience?: Array<{
    company: string;
    role: string;
    duration: string;
  }>;
}

const ShowProfile = () => {
  const { accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/profile/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setProfile(response.data.profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile", {
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

    if (accessToken) {
      fetchProfile();
    }
  }, [accessToken]);

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
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Profile not found</p>
            <Button onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-100">
      {/* Main Content */}
      <div className="container mx-auto">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-white/10"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            <Button
              onClick={logout}
              variant="ghost"
              size="icon"
              className="md:hidden text-red-500 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {/* Profile Header */}
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <UserAvatar
                  src={profile.profile_picture}
                  name={profile.user.name}
                  size="xl"
                  className="ring-4 ring-white/10"
                />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {profile.user.name}
                  </h2>
                  <p className="text-gray-400 mb-1">{profile.user.email}</p>
                  {profile.current_role && profile.current_company && (
                    <p className="text-lg text-gray-300 mb-2">
                      {profile.current_role} at {profile.current_company}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-3">
                    <Badge
                      variant="secondary"
                      className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20"
                    >
                      {profile.batch}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                    >
                      {profile.branch}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                    >
                      {profile.campus}
                    </Badge>
                  </div>
                  {profile.location &&
                    (profile.location.city || profile.location.country) && (
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                        {profile.location.city && (
                          <Badge
                            variant="secondary"
                            className="bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="capitalize">
                              {profile.location.city}
                            </span>
                          </Badge>
                        )}
                        {profile.location.country && (
                          <Badge
                            variant="secondary"
                            className="bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                          >
                            <span className="capitalize">
                              {profile.location.country}
                            </span>
                          </Badge>
                        )}
                      </div>
                    )}
                </div>
                <Button
                  onClick={() => navigate("/dashboard/update-profile")}
                  className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/20"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                onClick={() => navigate("/dashboard/change-password")}
                variant="outline"
                className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>

              {/* Social Links */}
              {profile.social_media && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {profile.social_media.linkedin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20"
                        asChild
                      >
                        <a
                          href={profile.social_media.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Linkedin className="h-4 w-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {profile.social_media.github && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20"
                        asChild
                      >
                        <a
                          href={profile.social_media.github}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="h-4 w-4 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {profile.social_media.twitter && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20"
                        asChild
                      >
                        <a
                          href={profile.social_media.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Twitter className="h-4 w-4 mr-2" />
                          Twitter
                        </a>
                      </Button>
                    )}
                    {profile.social_media.personal_website && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20"
                        asChild
                      >
                        <a
                          href={profile.social_media.personal_website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Academic Information */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <GraduationCap className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">
                  Academic Information
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Batch</p>
                  <p className="text-lg font-semibold text-gray-200">
                    {profile.batch}
                  </p>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <p className="text-sm text-gray-400">Branch</p>
                  <p className="text-lg font-semibold text-gray-200">
                    {profile.branch}
                  </p>
                </div>
                <Separator className="bg-white/10" />
                <div>
                  <p className="text-sm text-gray-400">Campus</p>
                  <p className="text-lg font-semibold text-gray-200">
                    {profile.campus}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Position */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Briefcase className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">
                  Current Position
                </h3>
              </div>
              <div className="space-y-4">
                {profile.current_company || profile.current_role ? (
                  <>
                    {profile.current_role && (
                      <div>
                        <p className="text-sm text-gray-400">Role</p>
                        <p className="text-lg font-semibold text-gray-200">
                          {profile.current_role}
                        </p>
                      </div>
                    )}
                    {profile.current_company && profile.current_role && (
                      <Separator className="bg-white/10" />
                    )}
                    {profile.current_company && (
                      <div>
                        <p className="text-sm text-gray-400">Company</p>
                        <p className="text-lg font-semibold text-gray-200">
                          {profile.current_company}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic">
                    No current position specified
                  </p>
                )}
              </div>
            </div>

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <User className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <div
                className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6 ${profile.skills && profile.skills.length > 0 ? "" : "lg:col-span-2"}`}
              >
                <div className="flex items-center gap-2 mb-6">
                  <Briefcase className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Experience
                  </h3>
                </div>
                <div className="space-y-6">
                  {profile.experience.map((exp, index) => (
                    <div
                      key={index}
                      className="relative pl-6 pb-6 border-l-2 border-blue-500/30 last:pb-0"
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-[-5px] top-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-950"></div>

                      <div className="space-y-1">
                        <p className="font-semibold text-lg text-white">
                          {exp.role}
                        </p>
                        <p className="text-blue-400 font-medium">
                          {exp.company}
                        </p>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {exp.duration}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* My Posts Section (Mobile Only) */}
          <div className="md:hidden mt-8 pt-8 border-t border-white/10">
            <MyPosts embedded={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowProfile;
