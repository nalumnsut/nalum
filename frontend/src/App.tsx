import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { SocketProvider } from "@/hooks/useSocket";
import { startKeepAlive, stopKeepAlive } from "@/lib/keepAlive";
import { AppRoutes } from "@/routes";
import { AuthErrorHandler, SessionLoadingScreen } from "@/components/app/AppComponents";
import {
  AuthenticatedCacheBoundary,
  ConnectionLifecycleSync,
} from "@/components/AppLifecycleSync";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { useLocation } from "react-router-dom";
import { usePageTracking } from "@/hooks/usePageTracking";
import { AxiosError } from "axios";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ContributionPopup } from "@/components/ContributionPopup";


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

function AppContent() {
  const { isLoading } = useAuth();
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(location.pathname === "/");

  usePageTracking();

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
        <ContributionPopup ready={!showIntro} />
        <Toaster />
      </TooltipProvider>
    </>
  );
}

function App() {
  console.log("GOOGLE_CLIENT_ID is:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
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
    </GoogleOAuthProvider>
  );
}

export default App;
