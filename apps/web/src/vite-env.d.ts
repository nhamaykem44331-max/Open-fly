/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the OpenFly API (e.g. http://localhost:3001). Unset → app runs on mock data. */
  readonly VITE_API_URL?: string
  /** Google Web OAuth client ID (public). Set → real Google Sign-In via GIS; unset → mock stub. */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
