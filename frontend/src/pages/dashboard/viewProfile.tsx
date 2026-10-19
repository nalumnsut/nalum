import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Pencil, UserPlus } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ConnectionMessageDialog } from "@/components/ConnectionMessageDialog";
import ProfileView, {
  type ProfileViewData,
} from "@/components/profile/ProfileView";

interface Profile extends ProfileViewData {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  connectionStatus?: string;
  blockedBy?: string;
}

const ViewProfile = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const { createConversation } = useConversations();

  const refetchProfile = async () => {
    const response = await api.get(`/profile/user/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setProfile(response.data.profile);
  };

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

      await refetchProfile();

      toast.success("Connection request sent!", { duration: 2000 });
    } catch (error: any) {
      console.error("Error sending connection request:", error);
      toast.error(
        error.response?.data?.message || "Failed to send connection request",
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

      await refetchProfile();

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
        await refetchProfile();
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile", {
          description: "Please try again later",
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
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-body-md text-muted-foreground">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="rounded-card border border-border bg-card shadow-card p-8 text-center max-w-md">
          <p className="text-headline-sm text-foreground font-semibold mb-2">
            Profile not found
          </p>
          <p className="text-body-md text-muted-foreground mb-6">
            This user profile may not exist or belongs to an administrative account. For questions or assistance, you can reach out via the Queries page.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => navigate("/dashboard/alumni")}
              variant="outline"
              className="w-full sm:w-auto rounded-full border-border text-foreground hover:border-primary hover:text-primary"
            >
              Back to Directory
            </Button>
            <Button
              onClick={() => navigate("/dashboard/queries")}
              className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              Go to Queries
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { connectionStatus } = profile;

  return (
    <>
      <ProfileView
        profile={profile}
        backLabel="Back to Directory"
        onBack={() => navigate(-1)}
        actions={
          <>
            {connectionStatus === "self" ? (
              <Button
                onClick={() => navigate("/dashboard/update-profile")}
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : connectionStatus === "accepted" ? (
              <Button
                onClick={handleMessage}
                disabled={createConversation.isPending}
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                {createConversation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                Message
              </Button>
            ) : connectionStatus === "pending" ? (
              <Button
                variant="ghost"
                disabled
                className="text-warning bg-warning-subtle cursor-not-allowed"
              >
                Pending
              </Button>
            ) : connectionStatus === "blocked" ? (
              // blockedBy === them → nothing we can do; otherwise offer Unblock.
              profile.blockedBy === profile.user._id ? (
                <Button
                  variant="ghost"
                  disabled
                  className="text-destructive bg-destructive/10 cursor-not-allowed"
                >
                  Unavailable
                </Button>
              ) : (
                <Button
                  onClick={() => handleUnblock(profile.user._id)}
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Unblock
                </Button>
              )
            ) : (
              <Button
                onClick={() => setShowConnectionDialog(true)}
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Connect
              </Button>
            )}
          </>
        }
      />

      <ConnectionMessageDialog
        isOpen={showConnectionDialog}
        onClose={() => setShowConnectionDialog(false)}
        onConfirm={(message) => handleConnect(profile.user._id, message)}
        recipientName={profile.user.name}
      />
    </>
  );
};

export default ViewProfile;
