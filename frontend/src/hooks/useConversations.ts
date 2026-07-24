import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useChatContext } from "@/context/ChatContext"; // Changed from useSocket
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export const useConversations = () => {
  const queryClient = useQueryClient();
  const { socket } = useChatContext(); // Changed from useSocket
  const { user } = useAuth();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await api.get("/chat/conversations");
      return data.data || [];
    },
  });

  useEffect(() => {
    if (!socket || !user) return;

    const handleConversationUpdate = (data: any) => {
      const { conversationId, lastMessage } = data;

      queryClient.setQueryData(["conversations", user.id], (old: any[]) => {
        if (!old) return [];

        const index = old.findIndex((c: any) => c._id === conversationId);

        if (index === -1) {
          // New conversation, fetch fresh list
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          return old;
        }

        const newConversations = [...old];
        const updatedConversation = { ...newConversations[index] };

        // Prevent duplicate updates for the same message
        if (updatedConversation.lastMessage?._id === lastMessage._id) {
          return old;
        }

        updatedConversation.lastMessage = lastMessage;

        const senderId = lastMessage.sender?._id || lastMessage.sender;
        const isOwnMessage = senderId === user.id;

        if (isOwnMessage) {
          updatedConversation.unreadCount = 0;
        } else {
          updatedConversation.unreadCount = (updatedConversation.unreadCount || 0) + 1;
        }

        // Remove from old position and add to top
        newConversations.splice(index, 1);
        newConversations.unshift(updatedConversation);

        return newConversations;
      });
    };

    socket.on("conversation:update", handleConversationUpdate);

    return () => {
      socket.off("conversation:update", handleConversationUpdate);
    };
  }, [socket, queryClient, user]);

  const createConversation = useMutation({
    mutationFn: async (participantId: string) => {
      const { data } = await api.post("/chat/conversations", {
        participantId,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create conversation");
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (conversationId: string) => {
      await api.put(`/chat/conversations/${conversationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const archiveConversation = useMutation({
    mutationFn: async (conversationId: string) => {
      await api.delete(`/chat/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Conversation archived");
    },
  });

  return {
    conversations,
    isLoading,
    createConversation,
    markAsRead,
    archiveConversation,
  };
};
