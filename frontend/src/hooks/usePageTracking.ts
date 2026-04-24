import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

/**
 * Automatically fires a GA4 page_view event whenever the React Router
 * location changes.  Import and call this hook once inside `App` or any
 * top-level component that lives inside `<BrowserRouter>`.
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
}
