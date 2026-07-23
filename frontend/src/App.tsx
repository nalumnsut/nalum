import { ReactNode, useEffect, useRef, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { SocketProvider, useSocket } from "@/hooks/useSocket";
import { startKeepAlive, stopKeepAlive } from "@/lib/keepAlive";
import { AppRoutes } from "@/routes";
import { AuthErrorHandler, SessionLoadingScreen } from "@/components/app/AppComponents";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { useLocation, useNavigate } from "react-router-dom";
import { usePageTracking } from "@/hooks/usePageTracking";
import { AxiosError } from "axios";
import { useTheme } from "next-themes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: unknown) => {
        const axiosError = error as AxiosError;
        if ([401, 403, 404].includes(axiosError?.response?.status ?? 0)) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

function AuthenticatedCacheBoundary({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (previousUserId.current !== currentUserId) {
      const staleUserId = previousUserId.current;
      const isStaleAuthenticatedQuery = (query: { queryKey: readonly unknown[] }) => {
        const root = String(query.queryKey[0]);
        if (root === "search-users") return staleUserId !== null;
        return staleUserId !== null && [
          "inbox",
          "conversations",
          "messages",
          "connections",
          "pending-requests",
        ].includes(root) && query.queryKey[1] === staleUserId;
      };

      void queryClient.cancelQueries({ predicate: isStaleAuthenticatedQuery });
      queryClient.removeQueries({ predicate: isStaleAuthenticatedQuery });
      previousUserId.current = currentUserId;
    }
  }, [queryClient, user?.id]);

  return children;
}
function ConnectionLifecycleSync() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket || !user?.id) return;

    const refreshChatState = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["connections"] }),
        queryClient.invalidateQueries({ queryKey: ["pending-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["inbox", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["conversations", user.id] }),
      ]);
    };

    const removeWorkflow = (payload: {
      connectionId?: string;
      conversationId?: string | null;
    }) => {
      const { connectionId, conversationId } = payload;
      const withoutConnection = (old: unknown) => Array.isArray(old)
        ? old.filter((item: any) => item?._id !== connectionId)
        : old;
      const withoutConversation = (old: unknown) => Array.isArray(old)
        ? old.filter((item: any) => item?._id !== conversationId)
        : old;

      queryClient.setQueriesData({ queryKey: ["connections"] }, withoutConnection);
      queryClient.setQueriesData({ queryKey: ["pending-requests"] }, withoutConnection);

      if (conversationId) {
        queryClient.setQueriesData({ queryKey: ["inbox", user.id] }, withoutConversation);
        queryClient.setQueriesData({ queryKey: ["conversations", user.id] }, withoutConversation);
        queryClient.removeQueries({ queryKey: ["messages", user.id, conversationId] });

        if (location.pathname === `/dashboard/chat/${conversationId}`) {
          navigate("/dashboard/chat", { replace: true });
        }
      }

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["connections"] }),
        queryClient.invalidateQueries({ queryKey: ["pending-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["inbox", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["conversations", user.id] }),
      ]);
    };

    socket.on("connect", refreshChatState);
    socket.on("connection:cancelled", removeWorkflow);
    socket.on("conversation:removed", removeWorkflow);
    if (socket.connected) refreshChatState();
    return () => {
      socket.off("connect", refreshChatState);
      socket.off("connection:cancelled", removeWorkflow);
      socket.off("conversation:removed", removeWorkflow);
    };
  }, [location.pathname, navigate, queryClient, socket, user?.id]);

  return null;
}
function AppContent() {
  const { isLoading } = useAuth();
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(location.pathname === "/");
  const { theme } = useTheme();

  usePageTracking();

  useEffect(() => {
    const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/admin-panel');
    if (isAdminPath) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [location.pathname, theme]);

  // 1. If loading, stop the render tree dead in its tracks.
  if (isLoading) {
    return <SessionLoadingScreen />;
  }

  // 2. Only after loading is false, render the authenticated providers.
  return (
    <>
      <AuthErrorHandler />
      {showIntro && (
        <LoadingAnimation onAnimationComplete={() => setShowIntro(false)} />
      )}
      <TooltipProvider>
        <AppRoutes />
        <Toaster />
      </TooltipProvider>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthenticatedCacheBoundary>
          <SocketProvider>
            <NotificationProvider>
              <ConnectionLifecycleSync />
              <AppContent />
            </NotificationProvider>
          </SocketProvider>
        </AuthenticatedCacheBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
