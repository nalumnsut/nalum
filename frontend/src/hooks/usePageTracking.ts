import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/**
 * Automatically fires GA4 page_view and backend visit tracking.
 * Tracks 1 pre-login visit and 1 post-login visit per session.
 */
export function usePageTracking(): void {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const fullPath = location.pathname + location.search;
    trackPageView(fullPath);

    try {
      if (isAuthenticated) {
        // Track 1 post-login visit per session
        const hasLoggedPostLogin = sessionStorage.getItem("nalum_session_postlogin_visit");
        if (!hasLoggedPostLogin) {
          sessionStorage.setItem("nalum_session_postlogin_visit", "true");
          api.post("/analytics/visit", { path: fullPath }).catch(() => {});
        }
      } else {
        // Track 1 pre-login visit per session
        const hasLoggedPreLogin = sessionStorage.getItem("nalum_session_prelogin_visit");
        if (!hasLoggedPreLogin) {
          sessionStorage.setItem("nalum_session_prelogin_visit", "true");
          api.post("/analytics/visit", { path: fullPath }).catch(() => {});
        }
      }
    } catch (e) {
      // Ignore analytics errors silently
    }
  }, [location.pathname, location.search, isAuthenticated, isLoading]);
}

