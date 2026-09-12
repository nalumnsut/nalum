import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

interface ChatListProps {
  onSelectConversation: (conversation: any) => void;
  selectedConversation: any | null;
  chats: any[];
}

type RoleFilter = "all" | "alumni" | "student" | "faculty";

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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  type FilterType = "all" | "unread" | "alumni" | "student" | "faculty";
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  if (!user) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading user data...</div>;
  }

  const filteredChats = useMemo(() =>
    chats.filter((chat: any) => {
      const search = searchQuery.toLowerCase();
      const name = chat.itemType === 'community'
        ? chat.name?.toLowerCase()
        : chat.otherParticipant?.name?.toLowerCase();
      if (search && !(name || '').includes(search)) return false;

      if (activeFilter === "unread" && !(chat.unreadCount > 0)) return false;

      if (["alumni", "student", "faculty"].includes(activeFilter)) {
        if (chat.itemType === 'community') return false;
        if (chat.otherParticipant?.role !== activeFilter) return false;
      }

      return true;
    }),
    [chats, searchQuery, activeFilter]);

  const filters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "student", label: "Students" },
    { id: "alumni", label: "Alumni" },
    { id: "faculty", label: "Faculty" },
  ];

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-transparent">
      {/* Header with Search */}
      <div className="p-4 border-b border-border space-y-3 bg-card shrink-0">
        <h2 className="text-headline-md text-foreground">Messages</h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-body-sm bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-label-sm font-medium transition-colors whitespace-nowrap",
                activeFilter === filter.id
                  ? "border-primary bg-primary-subtle text-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List Area */}
      <ScrollArea className="flex-1 min-h-0">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground space-y-2">
            {searchQuery || activeFilter !== "all" ? (
              <>
                <Search className="h-10 w-10 mx-auto opacity-30" />
                <p className="text-sm">No results found</p>
              </>
            ) : (
              <>
                <UserPlus className="h-10 w-10 mx-auto opacity-30" />
                <p className="text-sm">No connections yet</p>
                <p className="text-xs opacity-70">Find alumni to connect with!</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
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
                  className={cn(
                    "w-full p-4 text-left transition-colors group relative",
                    isSelected
                      ? "bg-primary-subtle hover:bg-primary-subtle"
                      : "hover:bg-muted"
                  )}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      name={chat.itemType === 'community' ? chat.name : (chat.otherParticipant?.name || "Unknown")}
                      src={chat.itemType === 'community' ? chat.avatar : (chat.otherParticipant?.profile_picture || chat.otherParticipant?.profilePicture)}
                      size="md"
                      className="shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate text-foreground min-w-0 flex-1">
                          {chat.itemType === 'community' ? chat.name : (chat.otherParticipant?.name || "Unknown User")}
                        </p>
                        {(chat.lastMessage?.createdAt || chat.lastMessage?.timestamp) && (
                          <span className={cn(
                            "text-[11px] shrink-0",
                            chat.unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground"
                          )}>
                            {formatMessageDate(chat.lastMessage.createdAt || chat.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={cn(
                          "truncate text-xs min-w-0 flex-1",
                          chat.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {chat.isConnectionOnly ? (
                            <span className="italic opacity-70">Start chatting</span>
                          ) : chat.unreadCount >= 4 ? (
                            "4+ new messages"
                          ) : (
                            <>
                              {chat.lastMessage?.sender === user?.id && <span className="opacity-70 mr-1">You:</span>}
                              {chat.lastMessage?.content
                                ? chat.lastMessage.content.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1")
                                : "No messages"}
                            </>
                          )}
                        </p>
                        {chat.unreadCount > 0 && (
                          <Badge className="h-4 min-w-[16px] p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground hover:bg-primary shrink-0">
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
