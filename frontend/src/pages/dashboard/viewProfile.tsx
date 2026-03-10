import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  User,
  Briefcase,
  MapPin,
  Linkedin,
  Github,
  Twitter,
  Globe,
  ArrowLeft,
  Loader2,
  Mail,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import UserAvatar from "@/components/UserAvatar";
import { toast } from "sonner";
import { ConnectionMessageDialog } from "@/components/ConnectionMessageDialog";

interface Profile {
  user: {
    _id: string;
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
  connectionStatus?: string;
  blockedBy?: string;
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

const ViewProfile = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const { createConversation } = useConversations();

  const handleMessage = async () => {
    if (!profile) return;
    try {
      const conversation = await createConversation.mutateAsync(
        profile.user._id,
      );
      navigate("/dashboard/chat", { state: { conversation } });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const handleConnect = async (recipientId: string, message?: string) => {
    try {
      await api.post(
        "/chat/connections/request",
        { recipientId, requestMessage: message },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      // Refresh profile to update connection status
      const response = await api.get(`/profile/user/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProfile(response.data.profile);

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
        },
      );
    }
  };

  const handleUnblock = async (recipientId: string) => {
    try {
      await api.post(
        "/chat/connections/unblock-user",
        { userId: recipientId },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      // Refresh profile to update connection status
      const response = await api.get(`/profile/user/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProfile(response.data.profile);

      toast.success("User unblocked successfully");
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error("Failed to unblock user");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const response = await api.get(`/profile/user/${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log("Fetched profile:", response.data.profile);
        console.log("User role:", response.data.profile?.user?.role);
        console.log("Current company:", response.data.profile?.current_company);
        console.log("Current role:", response.data.profile?.current_role);
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

    if (accessToken && userId) {
      fetchProfile();
    }
  }, [accessToken, userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
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
              onClick={() => navigate("/dashboard/alumni")}
              className="bg-blue-600 hover:bg-blue-500"
            >
              Back to Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-100">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Profile Header */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-8 mb-6 overflow-visible">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <UserAvatar
                src={profile.profile_picture}
                name={profile.user.name}
                size="xl"
                className="ring-4 ring-white/10"
              />
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {profile.user.name}
                </h1>
                {profile.current_role && profile.current_company && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-300 mb-3">
                    <Briefcase className="h-5 w-5 text-blue-400" />
                    <span className="text-lg">
                      {profile.current_role} at {profile.current_company}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mb-4">
                  <GraduationCap className="h-5 w-5 text-blue-400" />
                  <span>
                    {profile.branch} • {profile.batch}
                  </span>
                </div>
                {(profile.location?.city || profile.location?.country) && (
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
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
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mb-4">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <span>{profile.campus}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  {/* Connection Status Button */}
                  {profile.connectionStatus === "self" ? (
                    <Button
                      onClick={() => navigate("/dashboard/profile/edit")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Edit Profile
                    </Button>
                  ) : profile.connectionStatus === "accepted" ? (
                    <Button
                      onClick={handleMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={createConversation.isPending}
                    >
                      {createConversation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      )}
                      Message
                    </Button>
                  ) : profile.connectionStatus === "pending" ? (
                    <Button
                      size="default"
                      variant="ghost"
                      disabled
                      className="text-amber-400 bg-amber-500/10 cursor-not-allowed"
                    >
                      Pending
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setShowConnectionDialog(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}

                  {/* Handle Blocked State */}
                  {profile.connectionStatus === "blocked" && (
                    <>
                      {profile.blockedBy === profile.user._id ? (
                        <Button
                          size="default"
                          variant="ghost"
                          disabled
                          className="text-red-400 bg-red-500/10 cursor-not-allowed border border-red-500/20"
                        >
                          Unavailable
                        </Button>
                      ) : (
                        // I blocked them -> Show Unblock
                        <Button
                          onClick={() => handleUnblock(profile.user._id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Unblock
                        </Button>
                      )}
                    </>
                  )}

                  {/* Social Media Buttons */}
                  {profile.social_media?.linkedin && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-white/5 border-white/10 hover:bg-white/10"
                      onClick={() =>
                        window.open(profile.social_media!.linkedin, "_blank")
                      }
                    >
                      <Linkedin className="h-4 w-4 text-blue-400" />
                    </Button>
                  )}
                  {profile.social_media?.github && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-white/5 border-white/10 hover:bg-white/10"
                      onClick={() =>
                        window.open(profile.social_media!.github, "_blank")
                      }
                    >
                      <Github className="h-4 w-4 text-gray-300" />
                    </Button>
                  )}
                  {profile.social_media?.twitter && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-white/5 border-white/10 hover:bg-white/10"
                      onClick={() =>
                        window.open(profile.social_media!.twitter, "_blank")
                      }
                    >
                      <Twitter className="h-4 w-4 text-blue-400" />
                    </Button>
                  )}
                  {profile.social_media?.personal_website && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-white/5 border-white/10 hover:bg-white/10"
                      onClick={() =>
                        window.open(
                          profile.social_media!.personal_website,
                          "_blank",
                        )
                      }
                    >
                      <Globe className="h-4 w-4 text-blue-400" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information and Current Position - Flexbox */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            {/* Academic Information */}
            <div className="flex-1 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6">
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

            {/* Current Position - Only for Alumni */}
            {profile.user.role === "alumni" &&
              (profile.current_company || profile.current_role) && (
                <div className="flex-1 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Briefcase className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Current Position
                    </h3>
                  </div>
                  <div className="space-y-4">
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
                  </div>
                </div>
              )}
          </div>

          {/* Experience - Full Width */}
          {profile.experience && profile.experience.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-6">
                Experience
              </h3>
              <div className="space-y-6">
                {profile.experience.map((exp, index) => (
                  <div key={index} className="relative pl-6 pb-6 last:pb-0">
                    {/* Timeline line */}
                    {index !== profile.experience!.length - 1 && (
                      <div className="absolute left-[7px] top-6 bottom-0 w-px bg-gradient-to-b from-blue-500/50 to-transparent" />
                    )}
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />

                    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                      <h4 className="font-semibold text-white text-lg mb-1">
                        {exp.role}
                      </h4>
                      <p className="text-blue-400 mb-2">{exp.company}</p>
                      <p className="text-sm text-gray-400">{exp.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills - Simplified */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-white/5 text-gray-400 text-xs border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {profile && (
        <ConnectionMessageDialog
          isOpen={showConnectionDialog}
          onClose={() => setShowConnectionDialog(false)}
          onConfirm={(message) => handleConnect(profile.user._id, message)}
          recipientName={profile.user.name}
        />
      )}
    </div>
  );
};

export default ViewProfile;
