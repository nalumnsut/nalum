import { useEffect, useRef, useCallback, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { MessageInput } from "./MessageInput";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { useChatContext } from "@/context/ChatContext";
import { useMessages } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { useQueryClient } from "@tanstack/react-query";
import UserAvatar from "@/components/UserAvatar";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { differenceInMinutes } from "date-fns";

interface ChatWindowProps {
  conversation: any;
  onBack: () => void;
}

/**
 * ChatWindow Component
 * 
 * The main interface for viewing and sending messages in a conversation.
 * Handles:
 * - Real-time message display
 * - Sending new messages (creating a conversation if one doesn't exist)
 * - Typing indicators
 * - Deleting messages
 * - Scrolling to the latest message
 */
export const ChatWindow = ({ conversation, onBack }: ChatWindowProps) => {
  const { socket, isConnected } = useChatContext();
  const { user } = useAuth();
  const { createConversation } = useConversations();
  const { notifications, deleteNotification } = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Handle mobile viewport height changes
  useViewportHeight();

  const isCommunity = conversation.itemType === 'community';

  // Track the real conversation ID locally to handle transitions from connection-only
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    conversation.isConnectionOnly ? null : conversation._id
  );
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<string | null>(null);

  // Sync with prop changes
  useEffect(() => {
    setActiveConversationId(conversation.isConnectionOnly ? null : conversation._id);
  }, [conversation]);

  // Reset firstUnreadMessageId when conversation changes
  useEffect(() => {
    setFirstUnreadMessageId(null);
  }, [activeConversationId]);

  // Custom hook to manage message state and socket events
  const { messages, isLoading, sendMessage, deleteMessage } = useMessages(
    activeConversationId,
    socket,
    conversation.isConnectionOnly ? null : conversation.lastMessage,
    isCommunity
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // Find first unread message when messages load
  useEffect(() => {
    if (messages.length > 0 && firstUnreadMessageId === null && activeConversationId) {
      const firstUnread = messages.find((m: any) => {
        const senderId = m.sender?._id || m.sender || m.senderId;
        // Check if message is NOT from current user
        if (senderId === user?.id) return false;
        if (m.isOptimistic) return false; // Explicitly ignore optimistic messages

        // Check if NOT read by current user
        const isReadByMe = m.readBy?.some((r: any) => {
          const readerId = r.user?._id || r.user;
          return readerId === user?.id;
        });

        return !isReadByMe;
      });

      if (firstUnread) {
        setFirstUnreadMessageId(firstUnread._id);
      }
    }
  }, [messages, activeConversationId, firstUnreadMessageId, user?.id]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      // Use scrollIntoView with instant behavior on mobile to prevent janky animations
      const isMobile = window.innerWidth < 768;
      scrollRef.current.scrollIntoView({ 
        behavior: isMobile ? "auto" : "smooth",
        block: "end"
      });
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll to bottom on window resize (e.g. keyboard open/close)
  useEffect(() => {
    const handleResize = () => {
      // Small delay to allow layout to update
      setTimeout(scrollToBottom, 100);
    };
    
    const handleVisualViewportResize = () => {
      // Handle visual viewport changes (keyboard open/close)
      setTimeout(scrollToBottom, 150);
    };

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleVisualViewportResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleVisualViewportResize);
    };
  }, [scrollToBottom]);

  const markAsRead = useCallback(() => {
    if (activeConversationId && socket && isConnected) {
      // Optimistically update conversations list to show as read (gray)
      queryClient.setQueryData(["conversations"], (old: any[]) => {
        if (!old) return old;
        return old.map((c: any) =>
          c._id === activeConversationId ? { ...c, unreadCount: 0 } : c
        );
      });

      // Emit with callback to ensure server has processed it before we refetch
      socket.emit('message:read', { conversationId: activeConversationId }, (response: any) => {
        // Force a refetch to ensure server state is synced ONLY after server confirms
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      });
    }
    
    // Clear message notifications from this sender
    const senderId = conversation.otherParticipant?._id;
    if (senderId && notifications.length > 0) {
      const messageNotifications = notifications.filter(
        n => n.type === 'new_message' && n.sender?._id === senderId
      );
      
      // Delete all message notifications from this sender
      messageNotifications.forEach(notif => {
        deleteNotification(notif.id);
      });
    }
  }, [activeConversationId, socket, isConnected, queryClient, conversation.otherParticipant, notifications, deleteNotification]);

  // Mark messages as read when OPENING conversation (conversationId changes)
  // and when window gains focus
  useEffect(() => {
    markAsRead();

    const handleFocus = () => {
      markAsRead();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [activeConversationId, markAsRead]);

  const handleSendMessage = async (content: string) => {
    setFirstUnreadMessageId(null);

    if (isCommunity) {
      sendMessage.mutate({
        content,
        conversationId: conversation._id,
        receiverId: conversation._id,
        tempId: `temp-${Date.now()}`
      });
      return;
    }

    let targetConversationId = activeConversationId;

    // If this is a connection-only (no conversation yet), create it on the backend first
    if (!targetConversationId) {
      try {
        const result = await createConversation.mutateAsync(conversation.otherParticipant._id);
        // The mutation returns the conversation object directly
        targetConversationId = result._id;
        setActiveConversationId(targetConversationId); // Switch to real ID immediately
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return;
      }
    }

    const tempId = `temp-${Date.now()}`;

    // Note: sendMessage internally uses mutation variables, but the useMessages hook
    // must be observing the same conversationId for the optimistic update to be visible.
    // By setting activeConversationId above, we trigger a re-render/hook update.
    // However, since state updates are async, we pass targetConversationId here.
    sendMessage.mutate({
      content,
      conversationId: targetConversationId!,
      receiverId: conversation.otherParticipant._id,
      tempId
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMessage.mutate(messageToDelete);
      setMessageToDelete(null);
    }
  };

  const handleInputFocus = () => {
    markAsRead();
    setFirstUnreadMessageId(null);
    setTimeout(scrollToBottom, 300); // Delay to wait for keyboard animation
  };


  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);

  const isBlocked = conversation.connectionStatus === 'blocked';
  // Check if blocked by ME
  const isBlockedByMe = isBlocked && conversation.blockedBy === user?.id;

  const handleBlockUser = async () => {
    try {
      await api.post("/chat/connections/block-user", {
        userId: conversation.otherParticipant._id
      });
      toast.success("User blocked successfully");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate("/dashboard/chat");
    } catch (error) {
      console.error("Failed to block user:", error);
      toast.error("Failed to block user");
    }
    setShowBlockDialog(false);
  };

  const handleUnblockUser = async () => {
    try {
      await api.post("/chat/connections/unblock-user", {
        userId: conversation.otherParticipant._id
      });
      toast.success("User unblocked successfully");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate("/dashboard/chat");
    } catch (error) {
      console.error("Failed to unblock user:", error);
      toast.error("Failed to unblock user");
    }
    setShowUnblockDialog(false);
  };

  const handleDeleteChat = async () => {
    try {
      if (activeConversationId) {
        await api.delete(`/chat/conversations/${activeConversationId}`);
        toast.success("Chat deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        navigate("/dashboard/chat");
        onBack(); // Clear selection
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      toast.error("Failed to delete chat");
    }
    setShowDeleteDialog(false);
  };



  return (
    <div className="flex-1 h-full flex flex-col min-h-0 bg-transparent relative">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-black/20 backdrop-blur-sm z-10 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden text-gray-300 hover:text-white hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:bg-white/5 p-1.5 -ml-1.5 rounded-lg transition-colors"
          onClick={() => !isCommunity && navigate(`/dashboard/alumni/${conversation.otherParticipant._id}`)}
        >
          <UserAvatar
            name={isCommunity ? conversation.name : (conversation.otherParticipant?.name || "Unknown User")}
            src={isCommunity ? conversation.avatar :(conversation.otherParticipant?.profile_picture || conversation.otherParticipant?.profilePicture)}
            className="h-9 w-9 border border-white/10"
            size="sm"
          />

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-gray-200">{isCommunity ? conversation.name : (conversation.otherParticipant?.name || "Unknown User")}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-white/10 text-gray-200">
            {isCommunity ? (
              <>
                <DropdownMenuItem
                  className="focus:bg-white/10 cursor-pointer"
                  onClick={async () => {
                    try {
                      await api.post(`/chat/communities/${conversation._id}/clear`);
                      toast.success("Chat history cleared");
                      queryClient.invalidateQueries({ queryKey: ["inbox"] });
                    } catch (e) { toast.error("Failed to clear chat"); }
                  }}
                >
                  Clear Chat
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                  onClick={async () => {
                    try {
                      await api.post(`/chat/communities/${conversation._id}/leave`);
                      toast.success("Left community");
                      queryClient.invalidateQueries({ queryKey: ["inbox"] });
                      navigate("/dashboard/chat");
                    } catch (e: any) { toast.error(e.response?.data?.error || "Failed to leave community"); }
                  }}
                >
                  Leave Community
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  className="focus:bg-white/10 cursor-pointer"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Chat
                </DropdownMenuItem>
                {isBlockedByMe ? (
                  <DropdownMenuItem
                    className="text-blue-400 focus:text-blue-400 focus:bg-blue-500/10 cursor-pointer"
                    onClick={() => setShowUnblockDialog(true)}
                  >
                    Unblock User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                    onClick={() => setShowBlockDialog(true)}
                  >
                    Block User
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 shrink min-h-0">
        <div className="p-4 pb-2">
        {isLoading ? (
          <div className="text-center text-gray-400 pt-10 text-sm">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 pt-10 px-4">
            {!activeConversationId ? (
              <div className="space-y-2">
                <p className="font-medium text-sm text-gray-300">You're connected with {conversation.otherParticipant?.name}!</p>
                <p className="text-xs">Send a message to start the conversation</p>
              </div>
            ) : (
              <p className="text-sm">No messages yet. Start the conversation!</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: any, index: number) => {
              const senderId = message.sender?._id || message.sender || message.senderId;
              const isOwn = message.isOptimistic || senderId === user?.id;

              // Check for stacking (previous message)
              const prevMessage = messages[index - 1];
              const prevSenderId = prevMessage?.sender?._id || prevMessage?.sender || prevMessage?.senderId;

              const isStacked = prevMessage &&
                prevSenderId === senderId &&
                differenceInMinutes(new Date(message.createdAt), new Date(prevMessage.createdAt)) < 3;

              // Check if last in stack (next message)
              const nextMessage = messages[index + 1];
              const nextSenderId = nextMessage?.sender?._id || nextMessage?.sender || nextMessage?.senderId;

              const isLastInStack = !nextMessage ||
                nextSenderId !== senderId ||
                differenceInMinutes(new Date(nextMessage.createdAt), new Date(message.createdAt)) >= 3;

              const showUnseenDivider = message._id === firstUnreadMessageId;

              return (
                <div key={message._id}>
                  {showUnseenDivider && (
                    <div className="flex items-center gap-4 my-6">
                      <div className="h-px bg-indigo-500/30 flex-1" />
                      <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                        Unseen Messages
                      </span>
                      <div className="h-px bg-indigo-500/30 flex-1" />
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isOwn={isOwn}
                    onDelete={handleDeleteMessage}
                    isStacked={isStacked}
                    isLastInStack={isLastInStack}
                  />
                  {index === 0 && conversation.connectionStatus === 'accepted' && (
                    <div className="flex items-center gap-4 my-6">
                      <div className="h-px bg-green-500/30 flex-1" />
                      <span className="text-xs font-medium text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        You both have been connected. Start your conversation.
                      </span>
                      <div className="h-px bg-green-500/30 flex-1" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
        </div>
      </ScrollArea>

      {/* Typing Indicator */}
      {activeConversationId && !isBlocked && !isCommunity && <TypingIndicator conversationId={activeConversationId} />}

      {/* Input or Blocked/Pending Message */}
      {isCommunity ? (
        <div className="shrink-0">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={sendMessage.isPending}
            conversationId={activeConversationId || 'temp'}
            receiverId={conversation._id}
            onInputFocus={handleInputFocus}
          />
        </div>
      ) : isBlocked ? (
        <div className="p-4 bg-black/20 backdrop-blur-sm border-t border-white/10 text-center shrink-0">
          {isBlockedByMe ? (
            <div className="text-gray-400 text-sm">
              You have blocked this user. <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => setShowUnblockDialog(true)}>Unblock</span> to send messages.
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              You cannot send messages to this user.
            </div>
          )}
        </div>
      ) : conversation.connectionStatus !== 'accepted' && conversation.connectionStatus !== 'pending' ? (
        <div className="p-4 bg-black/20 backdrop-blur-sm border-t border-white/10 text-center shrink-0">
          <div className="text-gray-400 text-sm">
            You are not connected with this user.
          </div>
        </div>
      ) : conversation.connectionStatus === 'pending' && conversation.connectionRequester && (typeof conversation.connectionRequester === 'string' ? conversation.connectionRequester : conversation.connectionRequester._id) !== user?.id ? (
        <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10 shrink-0">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-gray-300">
              {conversation.otherParticipant?.name} sent you a connection request.
            </p>
            <div className="flex gap-3 w-full max-w-sm">
              <Button
                variant="outline"
                className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500"
                onClick={async () => {
                  try {
                    if (conversation.connectionId) {
                      await api.post("/chat/connections/respond", { connectionId: conversation.connectionId, action: "reject" });
                      toast.success("Request rejected");
                      queryClient.invalidateQueries({ queryKey: ["conversations"] });
                    }
                  } catch (e) { console.error(e); toast.error("Failed to reject request"); }
                }}
              >
                Ignore
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async () => {
                  try {
                    if (conversation.connectionId) {
                      await api.post("/chat/connections/respond", { connectionId: conversation.connectionId, action: "accept" });
                      toast.success("Request accepted");
                      queryClient.invalidateQueries({ queryKey: ["conversations"] });
                    }
                  } catch (e) { console.error(e); toast.error("Failed to accept request"); }
                }}
              >
                Accept
              </Button>
            </div>
          </div>
        </div>
      ) : conversation.connectionStatus === 'pending' && conversation.connectionRequester && (typeof conversation.connectionRequester === 'string' ? conversation.connectionRequester : conversation.connectionRequester._id) === user?.id ? (
        <div className="p-4 bg-black/20 backdrop-blur-sm border-t border-white/10 text-center shrink-0">
          <div className="text-gray-400 text-sm">
            Connection request sent. You can send messages once accepted.
          </div>
        </div>
      ) : (
        <div className="shrink-0">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={sendMessage.isPending || createConversation.isPending}
            conversationId={activeConversationId || 'temp'}
            receiverId={conversation.otherParticipant._id}
            onInputFocus={handleInputFocus}
          />
        </div>
      )}

      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Unsend Message?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will remove the message for everyone in the chat. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">Unsend</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Block User?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to block {conversation.otherParticipant?.name}? You will no longer receive messages from them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockUser} className="bg-red-600 hover:bg-red-700 text-white border-none">Block</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will remove the chat from your list. It will reappear if a new message is sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat} className="bg-red-600 hover:bg-red-700 text-white border-none">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock User?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to unblock {conversation.otherParticipant?.name}? You will be able to send messages again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblockUser} className="bg-blue-600 hover:bg-blue-700 text-white border-none">Unblock</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
