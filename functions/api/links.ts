import type { CloudflarePagesEnv } from "../types";
import {
  json,
  randomBase62,
  sanitizeAlias,
  sha256Hex,
  validateUrl,
} from "../utils";

interface CreateLinkRequest {
  alias?: string;
  target: string;
  expiresAt?: number;
  password?: string;
  turnstileToken?: string;
}

async function verifyTurnstile(
  token: string,
  secret: string,
  ip?: string
): Promise<boolean> {
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip) {
    formData.append("remoteip", ip);
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    const result = await response.json<{ success: boolean }>();
    return result.success === true;
  } catch {
    return false;
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: CloudflarePagesEnv;
}): Promise<Response> {
  const { request, env } = context;

  try {
    const body = await request.json<CreateLinkRequest>();

    // Validate Turnstile if secret is set (optional - skip if not configured)
    if (env.TURNSTILE_SECRET) {
      if (!body.turnstileToken) {
        return json({ error: "Turnstile token required" }, 400);
      }
      const ip = request.headers.get("CF-Connecting-IP") || undefined;
      const isValid = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET, ip);
      if (!isValid) {
        return json({ error: "Turnstile verification failed" }, 400);
      }
    }

    // Validate target URL
    if (!body.target || !validateUrl(body.target)) {
      return json({ error: "Invalid target URL" }, 400);
    }

    // Sanitize or generate alias
    let alias: string;
    if (body.alias) {
      const sanitized = sanitizeAlias(body.alias);
      if (!sanitized) {
        return json({ error: "Invalid alias format" }, 400);
      }
      alias = sanitized;
    } else {
      alias = randomBase62(6);
    }

    // Check collision: KV first
    const kvKey = `a:${alias}`;
    const cached = await env.CACHE.get(kvKey);
    if (cached) {
      return json({ error: "Alias already taken", alias_taken: true }, 409);
    }

    // Check D1
    const existing = await env.DB.prepare(
      "SELECT alias FROM links WHERE alias = ? LIMIT 1"
    )
      .bind(alias)
      .first<{ alias: string }>();

    if (existing) {
      return json({ error: "Alias already taken", alias_taken: true }, 409);
    }

    // Generate ID and hash password
    const id = randomBase62(12);
    const passwordHash = body.password ? await sha256Hex(body.password) : null;

    // Insert into D1
    const expiresAt = body.expiresAt ? Math.floor(body.expiresAt / 1000) : null;
    const createdBy = request.headers.get("CF-Connecting-IP") || null;

    await env.DB.prepare(
      `INSERT INTO links (id, alias, target, expires_at, password_hash, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(id, alias, body.target, expiresAt, passwordHash, createdBy)
      .run();

    // Cache in KV with 3600s TTL
    await env.CACHE.put(kvKey, body.target, { expirationTtl: 3600 });

    return json({
      id,
      alias,
      target: body.target,
    });
  } catch (error) {
    console.error("Error creating link:", error);
    return json({ error: "Internal server error" }, 500);
  }
}

export async function onRequestGet(context: {
  request: Request;
  env: CloudflarePagesEnv;
}): Promise<Response> {
  const { env, request } = context;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);

  try {
    const result = await env.DB.prepare(
      `SELECT id, alias, target, created_at, expires_at, is_active, clicks_total, created_by
       FROM links
       ORDER BY created_at DESC
       LIMIT ?`
    )
      .bind(limit)
      .all<{
        id: string;
        alias: string;
        target: string;
        created_at: number;
        expires_at: number | null;
        is_active: number;
        clicks_total: number;
        created_by: string | null;
      }>();

    return json(result.results || []);
  } catch (error) {
    console.error("Error fetching links:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
