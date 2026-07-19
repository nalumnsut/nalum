import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/UserAvatar";
import {
    Search,
    MessageSquare,
    UserMinus,
    Loader2,
    Users,
    MoreVertical,
    Check,
    X
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import PeopleYouMightKnow from "./PeopleYouMightKnow";

const ConnectionsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { createConversation } = useConversations();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"connections" | "received" | "sent">("connections");

    // Fetch Connections (Accepted)
    const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
        queryKey: ["connections", user?.id, "accepted"],
        queryFn: async () => {
            const { data } = await api.get("/chat/connections?status=accepted");
            return data.data;
        },
        enabled: !!user?.id && activeTab === "connections"
    });

    // Fetch Pending Received Requests
    const { data: receivedRequests = [], isLoading: isLoadingReceived } = useQuery({
        queryKey: ["connections", user?.id, "received"],
        queryFn: async () => {
            const { data } = await api.get("/chat/connections/pending");
            return data.data;
        },
        enabled: !!user?.id && activeTab === "received"
    });

    // Fetch Sent Requests
    const { data: sentRequests = [], isLoading: isLoadingSent } = useQuery({
        queryKey: ["connections", user?.id, "sent"],
        queryFn: async () => {
            const { data } = await api.get("/chat/connections/sent");
            return data.data;
        },
        enabled: !!user?.id && activeTab === "sent"
    });

    // Combine loading state based on active tab
    const isLoading =
        (activeTab === "connections" && isLoadingConnections) ||
        (activeTab === "received" && isLoadingReceived) ||
        (activeTab === "sent" && isLoadingSent);


    // --- Actions ---

    const handleMessage = async (userId: string) => {
        try {
            const conversation = await createConversation.mutateAsync(userId);
            navigate("/dashboard/chat", { state: { conversation } });
        } catch (error) {
            console.error("Failed to start conversation:", error);
        }
    };

    const handleRemoveConnection = async (connectionId: string) => {
        try {
            await api.delete(`/chat/connections/${connectionId}`);
            toast.success("Connection removed");
            queryClient.invalidateQueries({ queryKey: ["connections"] });
        } catch (error) {
            console.error("Failed to remove connection:", error);
            toast.error("Failed to remove connection");
        }
    };

    const respondToRequest = async (connectionId: string, action: "accept" | "reject") => {
        try {
            await api.post("/chat/connections/respond", { connectionId, action });
            toast.success(action === "accept" ? "Request accepted" : "Request rejected");
            // Invalidate all relevant queries
            queryClient.invalidateQueries({ queryKey: ["connections"] });
        } catch (error) {
            console.error(`Failed to ${action} request:`, error);
            toast.error(`Failed to ${action} request`);
        }
    };

    const cancelRequest = async (recipientId: string) => {
        try {
            await api.delete(`/chat/connections/cancel/${recipientId}`);
            toast.success("Request canceled");
            queryClient.invalidateQueries({ queryKey: ["connections"] });
        } catch (error) {
            console.error("Failed to cancel request:", error);
            toast.error("Failed to cancel request");
        }
    };


    // --- Helper to get filtered data ---
    const getDisplayData = () => {
        let data = [];
        if (activeTab === "connections") {
            data = connections.map((conn: any) => {
                const isRequester = conn.requester._id === user?.id;
                return { ...conn, otherUser: isRequester ? conn.recipient : conn.requester };
            });
        } else if (activeTab === "received") {
            data = receivedRequests.map((conn: any) => ({ ...conn, otherUser: conn.requester })); // I am recipient, so show requester
        } else if (activeTab === "sent") {
            data = sentRequests.map((conn: any) => ({ ...conn, otherUser: conn.recipient })); // I am requester, so show recipient
        }

        return data.filter((item: any) =>
            item.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const displayData = getDisplayData();

    const handleItemClick = (conn: any) => {
        if (activeTab === "received") {
            handleMessage(conn.otherUser._id);
        } else {
            navigate(`/dashboard/alumni/${conn.otherUser._id}`);
        }
    };

    if (!user) return null; // Should be handled by protected route

    return (
        <div className="min-h-screen bg-slate-950 pb-32 md:pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-white/10 p-4 pb-0">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Users className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Connections</h1>
                        {/* Count depends on tab */}
                        <p className="text-sm text-gray-400">
                            {activeTab === "connections" && `${connections.length} Connected`}
                            {activeTab === "received" && `${receivedRequests.length} Requests`}
                            {activeTab === "sent" && `${sentRequests.length} Sent`}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl mb-4">
                    {(["connections", "received", "sent"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                window.scrollTo(0, 0);
                                document.querySelector('main')?.scrollTo(0, 0);
                            }}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                activeTab === tab
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === "received" && receivedRequests.length > 0 && (
                                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-500 text-[10px]">{receivedRequests.length}</Badge>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-blue-500/20"
                    />
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : displayData.length === 0 ? (
                    <div className="text-center py-10">
                        <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No {activeTab} found</p>
                    </div>
                ) : (
                    displayData.map((conn: any) => (
                        <div
                            key={conn._id}
                            onClick={() => handleItemClick(conn)}
                            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                        >
                            <div>
                                <UserAvatar
                                    src={conn.otherUser.profilePicture || conn.otherUser.profile_picture}
                                    name={conn.otherUser.name}
                                    size="md"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                                    {conn.otherUser.name}
                                </h3>
                                {conn.otherUser.email && activeTab !== "connections" && (
                                    <p className="text-xs text-gray-500 truncate">{conn.otherUser.email}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {/* Actions based on Tab */}
                                {activeTab === "connections" && (
                                    <>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleMessage(conn.otherUser._id)}
                                            className="h-9 w-9 text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-full"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white">
                                                <DropdownMenuItem
                                                    onClick={() => handleRemoveConnection(conn._id)}
                                                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                                                >
                                                    <UserMinus className="h-4 w-4 mr-2" />
                                                    Remove Connection
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </>
                                )}

                                {activeTab === "received" && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => respondToRequest(conn._id, "accept")}
                                            className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                                        >
                                            <Check className="h-4 w-4 mr-1" /> Accept
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => respondToRequest(conn._id, "reject")}
                                            className="h-8 w-8 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {activeTab === "sent" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => cancelRequest(conn.otherUser._id)}
                                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8"
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {/* Recommended Connections Section */}
                <div className="mt-8 pt-8 border-t border-white/10">
                    <h2 className="text-xl font-bold text-white mb-4 px-2">Recommended for you</h2>
                    <PeopleYouMightKnow
                        className="w-full max-w-none ml-0 bg-transparent border-0 p-0 shadow-none"
                        hideHeader
                        fullHeight
                    />
                </div>
            </div>
        </div>
    );
};

export default ConnectionsPage;
