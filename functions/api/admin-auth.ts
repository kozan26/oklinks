import { json, sha256Hex } from "../_lib/utils";
import type { Env } from "../_lib/types";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json();
  const password = body?.password;

  if (!password || typeof password !== "string") {
    return json({ error: "password_required" }, 400);
  }

  // Get admin password from environment variable
  const adminPasswordHash = env.ADMIN_PASSWORD_HASH;
  if (!adminPasswordHash) {
    console.error("ADMIN_PASSWORD_HASH not configured");
    return json({ error: "admin_not_configured" }, 500);
  }

  // Hash the provided password and compare
  const providedHash = await sha256Hex(password);
  const isValid = providedHash === adminPasswordHash;

  if (!isValid) {
    return json({ error: "invalid_password" }, 401);
  }

  // Return a session token (simple approach - in production, use proper JWT)
  const sessionToken = crypto.randomUUID();
  const sessionData = {
    token: sessionToken,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  // Store session in KV cache
  await env.CACHE.put(`admin:session:${sessionToken}`, JSON.stringify(sessionData), {
    expirationTtl: 24 * 60 * 60, // 24 hours
  });

  return json({ token: sessionToken });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return json({ authenticated: false }, 401);
  }

  const sessionData = await env.CACHE.get(`admin:session:${token}`);
  if (!sessionData) {
    return json({ authenticated: false }, 401);
  }

  try {
    const session = JSON.parse(sessionData);
    if (session.expiresAt < Date.now()) {
      await env.CACHE.delete(`admin:session:${token}`);
      return json({ authenticated: false }, 401);
    }
    return json({ authenticated: true });
  } catch {
    return json({ authenticated: false }, 401);
  }
};

