import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, UserCheck, UserX, XCircle, Users, Bell } from "lucide-react";
import api from "@/lib/api";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";

interface ConnectionRequest {
  _id: string;
  requester: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  recipient: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  status: string;
  requestMessage?: string;
  createdAt: string;
}

interface UserProfile {
  batch?: string;
  branch?: string;
  campus?: string;
  profile_picture?: string;
}

const ConnectionsPopover = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>(
    []
  );
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [receivedProfiles, setReceivedProfiles] = useState<
    Record<string, UserProfile>
  >({});
  const [sentProfiles, setSentProfiles] = useState<Record<string, UserProfile>>(
    {}
  );
  const [isLoadingReceived, setIsLoadingReceived] = useState(false);
  const [isLoadingSent, setIsLoadingSent] = useState(false);
  const [activeTab, setActiveTab] = useState("received");
  const [isOpen, setIsOpen] = useState(false);

  const fetchReceivedRequests = useCallback(async () => {
    setIsLoadingReceived(true);
    try {
      const { data } = await api.get("/chat/connections/pending");
      const requests = data?.data || [];
      setReceivedRequests(requests);

      // Fetch profiles for each requester
      const profiles: Record<string, UserProfile> = {};
      for (const request of requests) {
        try {
          const profileRes = await api.get(`/profile/${request.requester._id}`);
          profiles[request.requester._id] = profileRes.data?.profile || {};
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
      }
      setReceivedProfiles(profiles);
    } catch (error: any) {
      // toast.error(
      //   error?.response?.data?.error || "Failed to load received requests"
      // );
    } finally {
      setIsLoadingReceived(false);
    }
  }, []);

  const fetchSentRequests = useCallback(async () => {
    setIsLoadingSent(true);
    try {
      const { data } = await api.get("/chat/connections/sent");
      const requests = data?.data || [];
      setSentRequests(requests);

      // Extract profile data from recipientProfile field
      const profiles: Record<string, UserProfile> = {};
      for (const request of requests) {
        if (request.recipientProfile) {
          profiles[request.recipient._id] = {
            batch: request.recipientProfile.batch,
            branch: request.recipientProfile.branch,
            campus: request.recipientProfile.campus,
            profile_picture: request.recipientProfile.profile_picture,
          };
        }
      }
      setSentProfiles(profiles);
    } catch (error: any) {
      // toast.error(
      //   error?.response?.data?.error || "Failed to load sent requests"
      // );
    } finally {
      setIsLoadingSent(false);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleCancelled = ({ connectionId }: { connectionId?: string }) => {
      setReceivedRequests(current => current.filter(request => request._id !== connectionId));
      setSentRequests(current => current.filter(request => request._id !== connectionId));
    };
    socket.on("connection:cancelled", handleCancelled);
    return () => {
      socket.off("connection:cancelled", handleCancelled);
    };
  }, [socket]);
  useEffect(() => {
    if (isOpen) {
      fetchReceivedRequests();
      fetchSentRequests();
    }
  }, [isOpen, fetchReceivedRequests, fetchSentRequests]);

  const handleAccept = async (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post("/chat/connections/respond", {
        connectionId,
        action: "accept",
      });
      toast.success("Connection request accepted!");
      fetchReceivedRequests();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to accept request");
    }
  };

  const handleReject = async (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post("/chat/connections/respond", {
        connectionId,
        action: "reject",
      });
      toast.success("Connection request rejected");
      fetchReceivedRequests();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to reject request");
    }
  };

  const handleCancel = async (recipientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/connections/cancel/${recipientId}`);
      toast.success("Connection request cancelled");
      fetchSentRequests();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to cancel request");
    }
  };

  const renderReceivedRequests = () => {
    if (isLoadingReceived) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      );
    }

    if (receivedRequests.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No connection requests</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {receivedRequests.map((request) => {
          const profile = receivedProfiles[request.requester._id] || {};
          return (
            <div
              key={request._id}
              className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-blue-500/30 transition-all"
            >
              <Link
                to={`/dashboard/alumni/${request.requester._id}`}
                className="flex items-center gap-3 cursor-pointer mb-3 hover:opacity-80 transition-opacity"
                onClick={() => setIsOpen(false)}
              >
                <UserAvatar
                  name={request.requester.name}
                  src={profile.profile_picture}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-white truncate">
                    {request.requester.name}
                  </h4>
                  <p className="text-xs text-gray-400 truncate">
                    {profile.batch} • {profile.branch}
                  </p>
                </div>
              </Link>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                  onClick={(e) => handleAccept(request._id, e)}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 h-8 text-xs"
                  onClick={(e) => handleReject(request._id, e)}
                >
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSentRequests = () => {
    if (isLoadingSent) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      );
    }

    if (sentRequests.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No pending requests</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sentRequests.map((request) => {
          const profile = sentProfiles[request.recipient._id] || {};
          return (
            <div
              key={request._id}
              className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-blue-500/30 transition-all"
            >
              <Link
                to={`/dashboard/alumni/${request.recipient._id}`}
                className="flex items-center gap-3 cursor-pointer mb-3 hover:opacity-80 transition-opacity"
                onClick={() => setIsOpen(false)}
              >
                <UserAvatar
                  name={request.recipient.name}
                  src={profile.profile_picture}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-white truncate">
                    {request.recipient.name}
                  </h4>
                  <p className="text-xs text-gray-400 truncate">
                    {profile.batch} • {profile.branch}
                  </p>
                </div>
              </Link>

              <Button
                size="sm"
                className="w-full h-8 text-xs bg-black hover:bg-black/90 text-white border border-white/10"
                onClick={(e) => handleCancel(request.recipient._id, e)}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-16 w-16 rounded-full border-2 border-white/20 shadow-lg text-gray-400 hover:text-white hover:bg-white/10"
          title="Notifications"
        >
          <Bell className="h-8 w-8" />
          {receivedRequests.length > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 border-2 border-slate-950 animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0 bg-slate-950 border-white/10 text-slate-100"
        align="end"
      >
        <div className="p-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Connections</h3>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2 bg-white/5">
              <TabsTrigger value="received" className="text-xs">
                Received
                {receivedRequests.length > 0 && (
                  <span className="ml-1.5 bg-red-500/20 text-red-400 px-1.5 rounded-full text-[10px]">
                    {receivedRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="text-xs">
                Sent
                {sentRequests.length > 0 && (
                  <span className="ml-1.5 bg-blue-500/20 text-blue-400 px-1.5 rounded-full text-[10px]">
                    {sentRequests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[400px] px-4 py-2">
            <TabsContent value="received" className="mt-2">
              {renderReceivedRequests()}
            </TabsContent>

            <TabsContent value="sent" className="mt-2">
              {renderSentRequests()}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default ConnectionsPopover;
