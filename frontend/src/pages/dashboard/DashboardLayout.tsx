import { Outlet, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ProfileProvider, useProfile } from "@/context/ProfileContext";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Home, Users, Calendar, MessageSquare, FileText } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Suspense, useEffect } from "react";

import { useChatContext } from "@/context/ChatContext";
import { useConversations } from "@/hooks/useConversations";
import { useLocationGuard } from "@/hooks/useLocationGuard";
import { PreloadLink } from "@/components/PreloadLink";

const DashboardContent = () => {
  const location = useLocation();

  const isChatPage = location.pathname.startsWith("/dashboard/chat");
  const isNotificationsPage = location.pathname.startsWith("/dashboard/notifications");
  const { user } = useAuth();
  const { socket } = useChatContext();
  const queryClient = useQueryClient();
  const { conversations } = useConversations();
  const unreadMessageCount = conversations.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0);

  // Enforce profile completion and location
  useLocationGuard();

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["connections", user?.id, "received"],
    queryFn: async () => {
      const { data } = await api.get("/chat/connections/pending");
      return data.data;
    },
  });

  useEffect(() => {
    if (!socket) return;
    const handleConnectionRequest = () => {
      queryClient.invalidateQueries({ queryKey: ["connections", user?.id, "received"] });
    };
    socket.on("connection_request", handleConnectionRequest);
    return () => {
      socket.off("connection_request", handleConnectionRequest);
    };
  }, [socket, queryClient]);

  const hasPendingRequests = pendingRequests.length > 0;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {/* Mobile Bottom Navigation Bar — stays visible on the chat page too, so
          Messages doesn't strand mobile users without a way back to the rest
          of the app; the chat panel gets bottom padding below to compensate. */}
      {!isNotificationsPage && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 py-2 shadow-overlay md:hidden h-16">
          <PreloadLink
            to="/dashboard"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
              location.pathname === "/dashboard"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Overview</span>
          </PreloadLink>

          <PreloadLink
            to="/dashboard/alumni"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative",
              location.pathname === "/dashboard/alumni" || location.pathname.startsWith("/dashboard/alumni/")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-medium">Directory</span>
            {hasPendingRequests && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
            )}
          </PreloadLink>

          <PreloadLink
            to="/dashboard/chat"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative",
              isChatPage
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px] font-medium">Messages</span>
            {unreadMessageCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
            )}
          </PreloadLink>

          <PreloadLink
            to="/dashboard/events"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
              location.pathname.startsWith("/dashboard/events")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[10px] font-medium">Events</span>
          </PreloadLink>

          <PreloadLink
            to="/dashboard/posts"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
              location.pathname.startsWith("/dashboard/posts")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] font-medium">Posts</span>
          </PreloadLink>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 h-full z-10 scrollbar-hide flex flex-col",
        isChatPage || isNotificationsPage ? "overflow-hidden" : "overflow-y-auto"
      )}>
        {/* Header — single component for mobile and desktop, sticky and always in the
            document flow (not an overlay), so page content no longer needs manual
            top-padding to avoid sitting underneath it. Height matches the sidebar's
            logo block exactly (h-20, the same fixed height both use). */}
        {!isNotificationsPage && <Header />}
        <div
          className={cn(
            // `w-full` is load-bearing: `main` is a column flex container, and a
            // flex item with auto cross-axis margins (mx-auto) opts out of
            // `align-self: stretch`. Without it this div is shrink-to-fit, so its
            // width — and therefore the page's left/right gap — tracks whatever
            // the current content happens to measure (e.g. a full alumni grid vs.
            // a single search result vs. an empty state), causing it to jump.
            "relative w-full mx-auto transition-all duration-300 min-h-full flex flex-col",
            isChatPage
              ? "pt-0 pb-16 md:pb-0 px-0 max-w-full flex-1 min-h-0"
              : isNotificationsPage
                ? "pt-0 pb-0 px-0 max-w-full flex-1 min-h-0"
                : "px-4 pt-4 pb-20 md:p-8 max-w-7xl"
          )}
        >
          <Suspense
            fallback={
              <div className="p-8 text-muted-foreground">
                Loading page...
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

const DashboardLayout = () => {
  return (
    // `reducedMotion="user"` is the single opt-out for every animation under
    // /dashboard: when the OS asks for reduced motion, framer drops transforms
    // and keeps opacity, so nothing individual components do needs to check.
    <MotionConfig reducedMotion="user">
      <ProfileProvider>
        <DashboardContent />
        <PWAInstallPrompt />
      </ProfileProvider>
    </MotionConfig>
  );
};

export default DashboardLayout;
