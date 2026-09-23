/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** If true, skip Google Books JS viewer and use output=embed iframe only. */
  readonly VITE_GOOGLE_BOOKS_IFRAME_ONLY?: string;
  /**
   * Milliseconds before auto-switching to simple embed if the JS viewer is not ready.
   * Omit for default 8000. Set to 0 to disable auto-switch (offer button still appears).
   */
  readonly VITE_GOOGLE_BOOKS_AUTO_IFRAME_FALLBACK_MS?: string;
  /**
   * If true, do not embed Google Books (no iframe, no JS viewer). Only Nestory UI + optional link to open Google Books in a new tab.
   */
  readonly VITE_GOOGLE_BOOKS_DISABLE_EMBED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
