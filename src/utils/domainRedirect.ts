const PRODUCTION_DOMAIN = 'univgates.com.tr';
const PREVIEW_DOMAIN = 'preview--univgates-connect.lovable.app';

export const handleDomainRedirect = () => {
  if (typeof window === 'undefined') return;
  
  const currentDomain = window.location.hostname;
  if (currentDomain === PREVIEW_DOMAIN) {
    const targetUrl = `https://${PRODUCTION_DOMAIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(targetUrl);
  }
};

export const ensureProductionDomain = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === PRODUCTION_DOMAIN;
};