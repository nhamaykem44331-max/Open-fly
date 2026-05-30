/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the OpenFly API (e.g. http://localhost:3001). Unset → app runs on mock data. */
  readonly VITE_API_URL?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
