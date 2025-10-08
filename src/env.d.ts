/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL: string | undefined
  readonly PROD: boolean
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}