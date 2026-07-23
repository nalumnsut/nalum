import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export const useConnections = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ["connections", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await api.get("/chat/connections");
      return data.data || [];
    },
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["pending-requests", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await api.get("/chat/connections/pending");
      return data.data || [];
    },
  });

  const sendRequest = useMutation({
    mutationFn: async (receiverId: string) => {
      const { data } = await api.post("/chat/connections/request", {
        recipientId: receiverId,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Connection request sent");
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send request");
    },
  });

  const respondToRequest = useMutation({
    mutationFn: async ({ connectionId, accept }: { connectionId: string; accept: boolean }) => {
      const { data } = await api.post("/chat/connections/respond", {
        connectionId,
        action: accept ? 'accept' : 'reject',
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Request updated");
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to respond");
    },
  });

  const removeConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      await api.delete(`/chat/connections/${connectionId}`);
    },
    onSuccess: () => {
      toast.success("Connection removed");
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to remove connection");
    },
  });

  return {
    connections,
    pendingRequests,
    isLoadingConnections,
    sendRequest,
    respondToRequest,
    removeConnection,
  };
};
