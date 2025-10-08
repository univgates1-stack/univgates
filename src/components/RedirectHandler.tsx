import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const RedirectHandler = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isPreviewDomain = window.location.hostname === 'preview--univgates-connect.lovable.app';
    
    if (isPreviewDomain) {
      const currentPath = location.pathname + location.search + location.hash;
      const redirectUrl = `https://univgates.com.tr${currentPath}`;
      window.location.replace(redirectUrl);
    }
  }, [location]);

  return null;
};