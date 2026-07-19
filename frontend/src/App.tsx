import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { startKeepAlive, stopKeepAlive } from "@/lib/keepAlive";
import { AppRoutes } from "@/routes";
import { AuthErrorHandler, SessionLoadingScreen } from "@/components/app/AppComponents";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { useLocation } from "react-router-dom";
import { usePageTracking } from "@/hooks/usePageTracking";
import { AxiosError } from "axios";
import { useTheme } from "next-themes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: unknown) => {
        const axiosError = error as AxiosError;
        if (axiosError?.response?.status === 401) {
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
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
