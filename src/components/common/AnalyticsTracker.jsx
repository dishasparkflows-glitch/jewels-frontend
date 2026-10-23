import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../../config/firebase';

/**
 * AnalyticsTracker component
 * Automatically records page_view events to Firebase Analytics whenever the user navigates.
 */
export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Record page view on route change
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return null;
}
