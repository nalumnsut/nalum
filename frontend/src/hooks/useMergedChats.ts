import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const useMergedChats = () => {
    const { data: allChats = [], isLoading } = useQuery({
        queryKey: ["inbox"],
        queryFn: async () => {
            const normalizeChat = (chat: any) => {
                const normalized = {
                    ...chat,
                    itemType: chat.itemType || "conversation",
                    unreadCount: chat.unreadCount || 0,
                };

                if (normalized.lastMessage?.timestamp && !normalized.lastMessage?.createdAt) {
                    normalized.lastMessage = {
                        ...normalized.lastMessage,
                        createdAt: normalized.lastMessage.timestamp,
                    };
                }

                return normalized;
            };

            try {
                const { data } = await api.get("/chat/communities/inbox");
                const inbox = data.data || [];

                const needsConversationHydration = inbox.some(
                    (chat: any) => (chat.itemType || "conversation") !== "community" && !chat.otherParticipant
                );

                if (needsConversationHydration) {
                    const { data: conversationData } = await api.get("/chat/conversations");
                    const conversations = conversationData.data || [];
                    const conversationMap = new Map(conversations.map((conv: any) => [conv._id, conv]));

                    return inbox.map((chat: any) => {
                        const itemType = chat.itemType || "conversation";
                        if (itemType === "community") {
                            return normalizeChat(chat);
                        }

                        const hydratedConversation = conversationMap.get(chat._id);
                        return normalizeChat(hydratedConversation || chat);
                    });
                }

                return inbox.map((chat: any) => normalizeChat(chat));
            } catch (error) {
                const [conversationResult, communityResult] = await Promise.allSettled([
                    api.get("/chat/conversations"),
                    api.get("/chat/communities/mine"),
                ]);

                const conversations = conversationResult.status === "fulfilled"
                    ? (conversationResult.value.data.data || []).map((chat: any) => normalizeChat({ ...chat, itemType: "conversation" }))
                    : [];

                const communities = communityResult.status === "fulfilled"
                    ? (communityResult.value.data.data || []).map((chat: any) => normalizeChat({ ...chat, itemType: "community" }))
                    : [];

                return [...conversations, ...communities].sort((a: any, b: any) => {
                    const aTime = new Date(a.lastMessage?.createdAt || a.lastMessage?.timestamp || a.updatedAt || 0).getTime();
                    const bTime = new Date(b.lastMessage?.createdAt || b.lastMessage?.timestamp || b.updatedAt || 0).getTime();
                    return bTime - aTime;
                });
            }
        },
    });

    return {
        allChats,
        isLoading
    };
};
