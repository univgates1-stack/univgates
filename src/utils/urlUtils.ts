interface ImportMetaEnv {
  readonly VITE_APP_URL: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export const getBaseUrl = () => {
  return import.meta.env.VITE_APP_URL || window.location.origin;
};

export const buildUrl = (path: string) => {
  const base = getBaseUrl();
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};