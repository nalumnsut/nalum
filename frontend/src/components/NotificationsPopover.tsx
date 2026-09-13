import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, UserCheck, UserX, Users, GraduationCap, Briefcase } from "lucide-react";
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
import { useNotifications } from "@/context/NotificationContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { NotificationItem } from "./NotificationItem";
import { useSocket } from "@/hooks/useSocket";

interface ConnectionRequest {
  _id: string;
  requester: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    role?: string;
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
  requesterProfile?: {
    batch?: string;
    branch?: string;
    campus?: string;
    department?: string;
    profile_picture?: string;
  };
  recipientProfile?: {
    batch?: string;
    branch?: string;
    campus?: string;
    department?: string;
    profile_picture?: string;
  };
}

const NotificationsPopover = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [connectionTab, setConnectionTab] = useState("alumni");

  // Connection requests state
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [isLoadingReceived, setIsLoadingReceived] = useState(false);
  const [isLoadingSent, setIsLoadingSent] = useState(false);

  // General notifications
  const { notifications, unreadCount, loading, fetchNotifications, clearAllNotifications } = useNotifications();
  const { isSupported, permission, subscribe } = usePushNotifications();
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      toast.success("All notifications cleared");
    } catch (error) {
      toast.error("Failed to clear notifications");
    }
  };

  // Fetch received connection requests
  const fetchReceivedRequests = useCallback(async () => {
    setIsLoadingReceived(true);
    try {
      const { data } = await api.get("/chat/connections/pending");
      setReceivedRequests(data?.data || []);
    } catch (error) {
      console.error("Failed to load received requests:", error);
    } finally {
      setIsLoadingReceived(false);
    }
  }, []);

  // Fetch sent connection requests
  const fetchSentRequests = useCallback(async () => {
    setIsLoadingSent(true);
    try {
      const { data } = await api.get("/chat/connections/sent");
      setSentRequests(data?.data || []);
    } catch (error) {
      console.error("Failed to load sent requests:", error);
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
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isSupported() && permission === 'default') {
      setShowPushPrompt(true);
    } else {
      setShowPushPrompt(false);
    }
  }, [permission, isSupported]);

  const handleEnablePush = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('Push notifications enabled!');
      setShowPushPrompt(false);
    } else {
      toast.error('Failed to enable push notifications');
    }
  };

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

  const handleCancelRequest = async (recipientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/connections/cancel/${recipientId}`);
      toast.success("Connection request cancelled");
      fetchSentRequests();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to cancel request");
    }
  };

  const totalUnread = unreadCount + receivedRequests.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] sm:w-96 max-h-[calc(100vh-2rem)] p-0 overflow-hidden bg-card border-border rounded-card shadow-lg"
        align="end"
      >
        <div className="flex flex-col h-[min(500px,calc(100vh-2rem))] min-h-0">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-lg text-foreground">Notifications</h3>
            {activeTab === "general" && notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0 h-auto">
              <TabsTrigger
                value="general"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none py-3 relative"
              >
                General
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="connections"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none py-3 relative"
              >
                Connections
                {receivedRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {receivedRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* General Notifications Tab */}
            <TabsContent
              value="general"
              className="mt-0 flex-1 min-h-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col data-[state=inactive]:hidden"
            >
              {showPushPrompt && (
                <div className="p-3 bg-primary-subtle/40 border-b border-border">
                  <p className="text-sm text-foreground mb-2">
                    Enable push notifications for updates
                  </p>
                  <Button size="sm" className="w-full bg-primary hover:bg-primary-hover text-primary-foreground" onClick={handleEnablePush}>
                    Enable Push Notifications
                  </Button>
                </div>
              )}
              <ScrollArea className="flex-1 min-h-0">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Bell className="h-12 w-12 mb-2 opacity-40" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {(() => {
                      // Group notifications by sender and type, keeping only the most recent
                      const deduplicatedNotifications = notifications.reduce((acc, notification) => {
                        // For message notifications, group by sender
                        if (notification.type === 'new_message' && notification.sender?._id) {
                          const key = `${notification.type}_${notification.sender._id}`;
                          const existing = acc.get(key);

                          // Only keep the most recent notification
                          if (!existing || new Date(notification.createdAt) > new Date(existing.createdAt)) {
                            acc.set(key, notification);
                          }
                        } else {
                          // For other notifications, keep all
                          acc.set(notification.id, notification);
                        }

                        return acc;
                      }, new Map());

                      // Convert back to array and sort by date
                      return Array.from(deduplicatedNotifications.values())
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onClose={() => setIsOpen(false)}
                          />
                        ));
                    })()}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Connection Requests Tab */}
            <TabsContent
              value="connections"
              className="mt-0 flex-1 min-h-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col data-[state=inactive]:hidden"
            >
              {/* Connection Sub-tabs: Alumni | Students | Faculty | Sent */}
              <Tabs value={connectionTab} onValueChange={setConnectionTab} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0 h-auto">
                  <TabsTrigger
                    value="alumni"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none py-2 text-sm"
                  >
                    Alumni
                    {receivedRequests.filter(r => r.requester.role === 'alumni').length > 0 && (
                      <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
                        {receivedRequests.filter(r => r.requester.role === 'alumni').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="students"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none py-2 text-sm"
                  >
                    Students
                    {receivedRequests.filter(r => r.requester.role === 'student').length > 0 && (
                      <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
                        {receivedRequests.filter(r => r.requester.role === 'student').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="faculty"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none py-2 text-sm"
                  >
                    Faculty
                    {receivedRequests.filter(r => r.requester.role === 'faculty').length > 0 && (
                      <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
                        {receivedRequests.filter(r => r.requester.role === 'faculty').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="sent"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none py-2 text-sm"
                  >
                    Sent
                    {sentRequests.length > 0 && (
                      <Badge className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs bg-secondary text-secondary-foreground">
                        {sentRequests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Alumni Requests */}
                <TabsContent
                  value="alumni"
                  className="mt-0 flex-1 min-h-0 overflow-hidden data-[state=inactive]:hidden"
                >
                  <ScrollArea className="h-full min-h-0">
                    {isLoadingReceived ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : receivedRequests.filter(r => r.requester.role === 'alumni').length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <Users className="h-12 w-12 mb-2 opacity-40" />
                        <p className="text-sm">No alumni requests</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {receivedRequests.filter(r => r.requester.role === 'alumni').map((request) => (
                          <div
                            key={request._id}
                            className="p-4 hover:bg-accent transition-colors cursor-pointer"
                            onClick={() => {
                              navigate(`/dashboard/alumni/${request.requester._id}`);
                              setIsOpen(false);
                            }}
                          >
                            <div className="flex gap-3">
                              <UserAvatar
                                name={request.requester.name}
                                src={request.requesterProfile?.profile_picture}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-medium text-sm text-foreground">
                                  {request.requester.name}
                                </p>
                                {request.requesterProfile && (
                                  <p className="text-xs text-muted-foreground">
                                    {request.requesterProfile.branch} • {request.requesterProfile.batch}
                                  </p>
                                )}
                                {request.requestMessage && (
                                  <p className="break-words text-xs text-muted-foreground mt-1 line-clamp-2">
                                    "{request.requestMessage}"
                                  </p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    onClick={(e) => handleAccept(request._id, e)}
                                    className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground"
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => handleReject(request._id, e)}
                                    className="flex-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                  >
                                    <UserX className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* Student Requests */}
                <TabsContent
                  value="students"
                  className="mt-0 flex-1 min-h-0 overflow-hidden data-[state=inactive]:hidden"
                >
                  <ScrollArea className="h-full min-h-0">
                    {isLoadingReceived ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : receivedRequests.filter(r => r.requester.role === 'student').length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <GraduationCap className="h-12 w-12 mb-2 opacity-40" />
                        <p className="text-sm">No student requests</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {receivedRequests.filter(r => r.requester.role === 'student').map((request) => (
                          <div
                            key={request._id}
                            className="p-4 hover:bg-accent transition-colors cursor-pointer"
                            onClick={() => {
                              navigate(`/dashboard/alumni/${request.requester._id}`);
                              setIsOpen(false);
                            }}
                          >
                            <div className="flex gap-3">
                              <UserAvatar
                                name={request.requester.name}
                                src={request.requesterProfile?.profile_picture}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-medium text-sm text-foreground">
                                  {request.requester.name}
                                </p>
                                {request.requesterProfile && (
                                  <p className="text-xs text-muted-foreground">
                                    {request.requesterProfile.branch} • {request.requesterProfile.batch}
                                  </p>
                                )}
                                {request.requestMessage && (
                                  <p className="break-words text-xs text-muted-foreground mt-1 line-clamp-2">
                                    "{request.requestMessage}"
                                  </p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    onClick={(e) => handleAccept(request._id, e)}
                                    className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground"
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => handleReject(request._id, e)}
                                    className="flex-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                  >
                                    <UserX className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* Faculty Requests */}
                <TabsContent
                  value="faculty"
                  className="mt-0 flex-1 min-h-0 overflow-hidden data-[state=inactive]:hidden"
                >
                  <ScrollArea className="h-full min-h-0">
                    {isLoadingReceived ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : receivedRequests.filter(r => r.requester.role === 'faculty').length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <Briefcase className="h-12 w-12 mb-2 opacity-40" />
                        <p className="text-sm">No faculty requests</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {receivedRequests.filter(r => r.requester.role === 'faculty').map((request) => (
                          <div
                            key={request._id}
                            className="p-4 hover:bg-accent transition-colors cursor-pointer"
                            onClick={() => {
                              navigate(`/dashboard/alumni/${request.requester._id}`);
                              setIsOpen(false);
                            }}
                          >
                            <div className="flex gap-3">
                              <UserAvatar
                                name={request.requester.name}
                                src={request.requesterProfile?.profile_picture}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-medium text-sm text-foreground">
                                  {request.requester.name}
                                </p>
                                {request.requesterProfile?.department && (
                                  <p className="text-xs text-muted-foreground">
                                    {request.requesterProfile.department}
                                  </p>
                                )}
                                {request.requestMessage && (
                                  <p className="break-words text-xs text-muted-foreground mt-1 line-clamp-2">
                                    "{request.requestMessage}"
                                  </p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    onClick={(e) => handleAccept(request._id, e)}
                                    className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground"
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => handleReject(request._id, e)}
                                    className="flex-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                  >
                                    <UserX className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* Sent Requests */}
                <TabsContent
                  value="sent"
                  className="mt-0 flex-1 min-h-0 overflow-hidden data-[state=inactive]:hidden"
                >
                  <ScrollArea className="h-full min-h-0">
                    {isLoadingSent ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : sentRequests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <UserCheck className="h-12 w-12 mb-2 opacity-40" />
                        <p className="text-sm">No sent requests</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {sentRequests.map((request) => (
                          <div
                            key={request._id}
                            className="p-4 hover:bg-accent transition-colors cursor-pointer"
                            onClick={() => {
                              navigate(`/dashboard/profile/${request.recipient._id}`);
                              setIsOpen(false);
                            }}
                          >
                            <div className="flex gap-3">
                              <UserAvatar
                                name={request.recipient.name}
                                src={request.recipientProfile?.profile_picture}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-medium text-sm text-foreground">
                                  {request.recipient.name}
                                </p>
                                {request.recipientProfile && (
                                  <p className="text-xs text-muted-foreground">
                                    {request.recipientProfile.branch} • {request.recipientProfile.batch}
                                  </p>
                                )}
                                <p className="text-xs text-warning mt-1">
                                  Pending
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => handleCancelRequest(request.recipient._id, e)}
                                  className="mt-2 w-full border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                >
                                  <UserX className="h-4 w-4 mr-1" />
                                  Cancel Request
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPopover;
