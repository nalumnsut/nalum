import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export const useMessages = (conversationId: string | null, socket: any, initialMessage: any = null, isCommunity: boolean = false) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["messages", conversationId],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      if (!conversationId) return { data: [], hasMore: false, page: 1 };
      const { data } = await api.get(
        `/chat/messages/${conversationId}?page=${pageParam}&limit=50`
      );
      return {
        data: data.data || [],
        hasMore: data.hasMore || false,
        page: pageParam as number,
      };
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    placeholderData: (previousData) => {
      if (previousData) return previousData;
      if (initialMessage && conversationId) {
        const messageWithId = {
          ...initialMessage,
          _id: initialMessage._id || `placeholder-${Date.now()}`,
          readBy: initialMessage.readBy || [],
          messageType: initialMessage.messageType || 'text',
          createdAt: initialMessage.createdAt || initialMessage.timestamp || new Date().toISOString(),
          isOptimistic: true,
        };
        return {
          pages: [{
            data: [messageWithId],
            hasMore: true,
            page: 1
          }],
          pageParams: [1]
        };
      }
      return undefined;
    },
    enabled: !!conversationId,
    staleTime: 5000, // Prevent immediate refetch to protect optimistic updates on new conversations
  });

  const messages = data?.pages.flatMap((page) => page.data) || [];

  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join the conversation room
    const roomType = isCommunity ? "community" : "conversation";
    socket.emit(`${roomType}:join`, conversationId);
    console.log(`Joined ${roomType} room:`, conversationId);

    const handleNewMessage = (data: any) => {
      console.log('Received message:new event:', data);
      const targetId = isCommunity ? data.communityId : data.conversationId;
      if (targetId === conversationId) {
        queryClient.setQueryData(["messages", conversationId], (old: any) => {
          if (!old) return { pages: [{ data: [data.message], hasMore: false, page: 1 }], pageParams: [1] };

          const newPages = [...old.pages];
          // Check if message already exists (avoid duplicates)
          const messageExists = newPages[0].data.some((m: any) => m._id === data.message._id);
          if (!messageExists) {
            newPages[0] = {
              ...newPages[0],
              data: [...newPages[0].data, data.message],
            };
          }

          return { ...old, pages: newPages };
        });
      }
    };

    const handleMessageSent = (data: any) => {
      console.log('Received message:sent event:', data);
      // Add the confirmed message or replace optimistic message
      const targetId = isCommunity ? data.communityId : data.conversationId;
      if (targetId === conversationId) {
        queryClient.setQueryData(["messages", conversationId], (old: any) => {
          if (!old) return { pages: [{ data: [data.message], hasMore: false, page: 1 }], pageParams: [1] };

          const newPages = [...old.pages];

          // Check if real message already exists (e.g. from message:new)
          const realMessageExists = newPages[0].data.some((m: any) => m._id === data.message._id);

          // Find optimistic message if tempId is provided
          const optimisticIndex = data.tempId
            ? newPages[0].data.findIndex((m: any) => m._id === data.tempId)
            : -1;

          if (optimisticIndex !== -1) {
            // Optimistic message exists
            const newData = [...newPages[0].data];
            if (realMessageExists) {
              // Real message already there (race condition), just remove optimistic
              newData.splice(optimisticIndex, 1);
            } else {
              // Replace optimistic with real
              newData[optimisticIndex] = data.message;
            }
            newPages[0] = { ...newPages[0], data: newData };
          } else if (!realMessageExists) {
            // No optimistic message found and real message not there, append it
            newPages[0] = {
              ...newPages[0],
              data: [...newPages[0].data, data.message],
            };
          }

          return { ...old, pages: newPages };
        });
      }
    };

    const handleMessageRead = (data: any) => {
      const targetId = isCommunity ? data.communityId : data.conversationId;
      if (targetId === conversationId) {
        queryClient.setQueryData(["messages", conversationId], (old: any) => {
          if (!old) return old;
          const newPages = old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((msg: any) => {
              // If messageId is provided, only update that message
              if (data.messageId && msg._id !== data.messageId) return msg;

              // Don't mark own messages as read by self (though backend filters this usually)
              // But here we are marking messages read BY data.userId

              // Check if already read by this user
              const alreadyRead = msg.readBy?.some((r: any) => {
                const rId = r.user?._id || r.user;
                return rId === data.userId;
              });

              if (alreadyRead) return msg;

              return {
                ...msg,
                readBy: [...(msg.readBy || []), { user: data.userId, readAt: new Date().toISOString() }]
              };
            })
          }));
          return { ...old, pages: newPages };
        });
      }
    };

    const handleMessageDeleted = (data: any) => {
      const targetId = isCommunity ? data.communityId : data.conversationId;
      if (targetId === conversationId) {
        queryClient.setQueryData(["messages", conversationId], (old: any) => {
          if (!old) return old;
          const newPages = old.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((msg: any) => msg._id !== data.messageId)
          }));
          return { ...old, pages: newPages };
        });
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:sent", handleMessageSent);
    socket.on("message:read", handleMessageRead);
    socket.on("message:deleted", handleMessageDeleted);

    return () => {
      const roomType = isCommunity ? "community" : "conversation";
      socket.emit(`${roomType}:leave`, conversationId);
      socket.off("message:new", handleNewMessage);
      socket.off("message:sent", handleMessageSent);
      socket.off("message:read", handleMessageRead);
      socket.off("message:deleted", handleMessageDeleted);
    };
  }, [socket, conversationId, queryClient, isCommunity]);

  const sendMessage = useMutation({
    mutationFn: async ({ content, conversationId: argConversationId, receiverId, tempId }: { content: string; conversationId: string; receiverId: string; tempId?: string }) => {
      if (socket && socket.connected) {
        // Send via socket with conversationId or communityId and tempId
        if (isCommunity) {
          socket.emit("message:send", { communityId: argConversationId, content, tempId });
        } else {
          socket.emit("message:send", { conversationId: argConversationId, content, tempId });
        }
        // Don't return anything - let message:sent handle it
        return null;
      } else {
        // HTTP fallback - needs conversationId too
        const { data } = await api.post("/chat/messages", {
          conversationId: argConversationId,
          content,
        });
        return data;
      }
    },
    onMutate: async ({ content, conversationId: argConversationId, tempId }) => {
      if (!tempId) return;

      await queryClient.cancelQueries({ queryKey: ["messages", argConversationId] });
      const previousMessages = queryClient.getQueryData(["messages", argConversationId]);

      const optimisticMessage = {
        _id: tempId,
        content,
        sender: user, // Assumes user object matches sender schema enough for UI
        conversation: isCommunity ? undefined : argConversationId,
        community: isCommunity ? argConversationId : undefined,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };

      queryClient.setQueryData(["messages", argConversationId], (old: any) => {
        if (!old) return { pages: [{ data: [optimisticMessage], hasMore: false, page: 1 }], pageParams: [1] };
        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          data: [...newPages[0].data, optimisticMessage],
        };
        return { ...old, pages: newPages };
      });

      return { previousMessages };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", conversationId], context.previousMessages);
      }
      toast.error(error.response?.data?.message || "Failed to send message");
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      await api.put(`/chat/messages/${messageId}/read`);
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      await api.delete(`/chat/messages/${messageId}`);
    },
    onMutate: async (messageId: string) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previousMessages = queryClient.getQueryData(["messages", conversationId]);

      queryClient.setQueryData(["messages", conversationId], (old: any) => {
        if (!old) return old;
        const newPages = old.pages.map((page: any) => ({
          ...page,
          data: page.data.filter((msg: any) => msg._id !== messageId)
        }));
        return { ...old, pages: newPages };
      });

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", conversationId], context.previousMessages);
      }
      toast.error("Failed to delete message");
    },
    onSuccess: () => {
      // Socket event will handle the cache update confirmation
      toast.success("Message deleted");
    },
  });

  return {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    sendMessage,
    markAsRead,
    deleteMessage,
  };
};
