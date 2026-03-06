/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_TENANT_A_TOKEN: string
  readonly VITE_TENANT_B_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
