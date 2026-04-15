import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // Save current page to localStorage whenever route changes
    // Only save internal pages (not login, signup, or landing)
    if (!['/', '/login', '/signup'].includes(location.pathname)) {
      localStorage.setItem('lastPage', location.pathname);
    }
  }, [location.pathname]);
}
