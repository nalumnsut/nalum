import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  MapPin,
  GraduationCap,
  BadgeIcon,
  UserPlus,
} from "lucide-react";
import api from "@/lib/api";
import UserAvatar from "@/components/UserAvatar";
import { ConnectionButton } from "@/components/ui/ConnectionButton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConnectionMessageDialog } from "@/components/ConnectionMessageDialog";

interface SuggestionProfile {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  batch?: string;
  branch?: string;
  campus?: string;
  profile_picture?: string;
  connectionStatus?: string;
}

interface PeopleYouMightKnowProps {
  className?: string;
  hideHeader?: boolean;
  fullHeight?: boolean;
}

const PeopleYouMightKnow = ({
  className,
  hideHeader,
  fullHeight,
}: PeopleYouMightKnowProps) => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SuggestionProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/profile/suggestions");
      setSuggestions(data?.suggestions || []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to load suggestions"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // The suggestions are already prioritized and limited to 5 by the backend
  const filteredSuggestions = suggestions;

  const handleConnectClick = (user: { _id: string; name: string }) => {
    setSelectedUser({ id: user._id, name: user.name });
    setIsDialogOpen(true);
  };

  const handleSendRequest = async (message: string) => {
    if (!selectedUser) return;

    try {
      await api.post("/chat/connections/request", {
        recipientId: selectedUser.id,
        requestMessage: message,
      });
      toast.success("Connection request sent");
      fetchSuggestions();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send request");
    } finally {
      setIsDialogOpen(false);
      setSelectedUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md flex items-center gap-3 text-gray-200">
        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
        <span>Loading suggestions...</span>
      </div>
    );
  }

  if (!filteredSuggestions.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md text-gray-300">
        No suggestions available.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold text-white">
          People you might know
        </h3>
      </div>

      <div className="flex flex-col space-y-2">
        {filteredSuggestions.map((profile) => {
          // Skip if user data is null or undefined
          if (!profile.user || !profile.user._id) {
            return null;
          }

          return (
            <div
              key={profile._id}
              onClick={() => navigate(`/dashboard/alumni/${profile.user._id}`)}
              className="w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 p-1.5 shadow-md transition hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-blue-500/10"
            >
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <UserAvatar
                    src={profile.profile_picture}
                    name={profile.user.name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm leading-tight line-clamp-1">
                      {profile.user.name}
                    </p>
                    {profile.batch && (
                      <div className="flex items-center text-xs text-gray-400 gap-1">
                        <GraduationCap className="h-3 w-3" />
                        <span>{profile.batch}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnectClick(profile.user);
                  }}
                  className="p-1 text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors flex-shrink-0"
                  title="Connect"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <ConnectionMessageDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleSendRequest}
        recipientName={selectedUser?.name || "User"}
      />
    </div>
  );
};

export default PeopleYouMightKnow;
