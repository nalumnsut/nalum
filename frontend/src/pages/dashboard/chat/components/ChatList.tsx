import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, MessageSquare, UserPlus } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
// import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/context/AuthContext";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import UserAvatar from "@/components/UserAvatar";
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
// import Sidebar from "../../Sidebar";

interface ChatListProps {
  onSelectConversation: (conversation: any) => void;
  selectedConversation: any | null;
  chats: any[];
}

const formatMessageDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return format(date, "eee");
  return format(date, "MMM d");
};

/**
 * ChatList Component
 * 
 * Displays a list of active conversations and accepted connections.
 * It merges existing conversations with connections that don't have a conversation yet,
 * allowing users to start chatting immediately with any connection.
 */
export const ChatList = ({ onSelectConversation, selectedConversation, chats = [] }: ChatListProps) => {
  const { isConnected } = useChatContext();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) {
    return <div className="p-4 text-center text-sm text-gray-400">Loading user data...</div>;
  }

  const filteredChats = useMemo(() =>
    chats.filter((chat: any) => {
      const search = searchQuery.toLowerCase();
      const name = chat.itemType === 'community'
        ? chat.name?.toLowerCase()
        : chat.otherParticipant?.name?.toLowerCase();
      if (!search) return true;
      return (name || '').includes(search);
    }),
    [chats, searchQuery]);

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      {/* Header with Search */}
      <div className="p-3 border-b border-white/10 space-y-3 bg-black/20">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            Messages
          </h2>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] h-5 px-2 ${isConnected ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-gray-400 border-gray-600"} backdrop-blur-sm`}
            >
              {isConnected ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-white/5 border-white/10 focus:bg-white/10 transition-all text-gray-200 placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Chat List Area */}
      <ScrollArea className="flex-1">
        {false ? ( // isLoading removed from props for now
          <div className="p-4 text-center text-sm text-gray-400">Loading chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-gray-500 space-y-2">
            {searchQuery ? (
              <>
                <Search className="h-10 w-10 mx-auto opacity-20" />
                <p className="text-sm">No results found</p>
              </>
            ) : (
              <>
                <UserPlus className="h-10 w-10 mx-auto opacity-20" />
                <p className="text-sm">No connections yet</p>
                <p className="text-xs opacity-60">Find alumni to connect with!</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredChats.map((chat: any) => {
              const isSelected = selectedConversation && (
                selectedConversation._id === chat._id ||
                (selectedConversation.otherParticipant?._id && chat.otherParticipant?._id &&
                  selectedConversation.otherParticipant._id === chat.otherParticipant._id)
              );

              return (
                <button
                  key={chat._id}
                  onClick={() => onSelectConversation(chat)}
                  className={`w-full p-3 text-left transition-all hover:bg-white/5 group relative ${isSelected
                    ? "bg-white/10"
                    : ""
                    }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                  )}
                  <div className="flex items-start gap-3 pl-2">
                    <div className="relative">
                      <UserAvatar
                        name={chat.itemType === 'community' ? chat.name : (chat.otherParticipant?.name || "Unknown")}
                        src={chat.itemType === 'community' ? chat.avatar : (chat.otherParticipant?.profile_picture || chat.otherParticipant?.profilePicture)}
                        size="md"
                        className={`border-opacity-20 ${isSelected ? 'border-indigo-400' : 'border-white'}`}
                      />
                      {/* Optional: Add online status indicator here if available */}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-medium text-sm truncate ${isSelected ? "text-white" : "text-gray-200"}`}>
                          {chat.itemType === 'community' ? chat.name : (chat.otherParticipant?.name || "Unknown User")}
                        </p>
                        {(chat.lastMessage?.createdAt || chat.lastMessage?.timestamp) && (
                          <span className={`text-[10px] ${chat.unreadCount > 0 ? "text-indigo-400 font-medium" : "text-gray-500"}`}>
                            {formatMessageDate(chat.lastMessage.createdAt || chat.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={`text-xs truncate max-w-[140px] ${chat.unreadCount > 0
                          ? "text-white font-medium" // Changed from text-gray-100 to text-white
                          : "text-gray-400"
                          }`}>
                          {chat.isConnectionOnly ? (
                            <span className="italic opacity-70">Start chatting</span>
                          ) : chat.unreadCount >= 4 ? (
                            "4+ new messages"
                          ) : (
                            <>
                              {chat.lastMessage?.sender === user?.id && <span className="opacity-70 mr-1">You:</span>}
                              {chat.lastMessage?.content || "No messages"}
                            </>
                          )}
                        </p>
                        {chat.unreadCount > 0 && (
                          <Badge variant="default" className="h-4 min-w-[16px] p-0 flex items-center justify-center text-[10px] bg-indigo-600 hover:bg-indigo-700 animate-in zoom-in duration-300">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};