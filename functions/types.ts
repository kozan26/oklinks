export interface CloudflarePagesEnv {
  DB?: D1Database;
  CACHE?: KVNamespace;
  CLICK_QUEUE?: Queue;
  TURNSTILE_SECRET?: string;
  ACCESS_AUD?: string;
  ASSETS?: Fetcher; // For serving static files in Pages Functions
}

