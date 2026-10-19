import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCheck, UserX, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatContext } from "@/context/ChatContext";
import { useConnections } from "@/hooks/useConnections";

/**
 * ConnectionRequests Component
 *
 * Displays a list of incoming connection requests for the current user.
 * Allows users to accept or reject requests, updating the connection status.
 */
export const ConnectionRequests = () => {
  const { pendingRequests, isLoadingConnections } = useChatContext();
  const { respondToRequest } = useConnections();
  const navigate = useNavigate();

  const handleAccept = (connectionId: string) => {
    respondToRequest.mutate({ connectionId, accept: true });
  };

  const handleReject = (connectionId: string) => {
    respondToRequest.mutate({ connectionId, accept: false });
  };

  return (
    <div className="p-4 h-full flex flex-col bg-transparent">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-100">
          <Inbox className="h-5 w-5 text-indigo-400" />
          Connection Requests
        </h3>
        {pendingRequests.length > 0 && (
          <Badge
            variant="default"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {pendingRequests.length}
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2">
        {isLoadingConnections ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center text-gray-500 py-12 flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <Inbox className="h-6 w-6 opacity-40" />
            </div>
            <p>No pending requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request: any) => (
              <div
                key={request._id}
                onClick={() =>
                  navigate(`/dashboard/alumni/${request.requester?._id}`)
                }
                className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm shadow-sm cursor-pointer"
              >
                <Avatar className="border border-white/10">
                  <AvatarFallback className="bg-indigo-500/20 text-indigo-200">
                    {request.requester?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-gray-200">
                    {request.requester?.name || "Unknown User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {request.requester?.email}
                  </p>
                  {request.requestMessage && (
                    <p className="break-words text-xs text-gray-400/80 italic mt-1 line-clamp-2 bg-white/5 p-1.5 rounded-md border border-white/5">
                      "{request.requestMessage}"
                    </p>
                  )}
                </div>

                <div className="flex gap-1 flex-col sm:flex-row">
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border border-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(request._id);
                    }}
                    disabled={respondToRequest.isPending}
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs hover:bg-red-500/20 hover:text-red-400 text-gray-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(request._id);
                    }}
                    disabled={respondToRequest.isPending}
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
