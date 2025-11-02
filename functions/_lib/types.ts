export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  CLICK_QUEUE?: Queue<ClickEvent>;
  TURNSTILE_SECRET?: string;
  ACCESS_AUD?: string;
  ADMIN_PASSWORD_HASH?: string;
}

export interface LinkRecord {
  id: string;
  alias: string;
  target: string;
  created_at: number;
  expires_at: number | null;
  password_hash: string | null;
  is_active: number;
  clicks_total: number;
  created_by: string | null;
}

export interface ClickEvent {
  alias: string;
  ts: number;
  ua?: string | null;
  ref?: string | null;
  ip?: string | null;
}

export interface CreateLinkInput {
  alias: string;
  target: string;
  expiresAt?: number | null;
  passwordHash?: string | null;
  createdBy?: string | null;
}
