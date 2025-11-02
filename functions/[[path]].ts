import type { CloudflarePagesEnv } from "./types";
import { formatDay, generateQRSVG } from "./utils";

interface ClickEvent {
  alias: string;
  ts: number;
  ua: string | null;
  ref: string | null;
}

async function resolveAlias(
  alias: string,
  env: CloudflarePagesEnv
): Promise<string | null> {
  // Try KV first (if available)
  const kvKey = `a:${alias}`;
  if (env.CACHE) {
    const cached = await env.CACHE.get(kvKey);
    if (cached) {
      return cached;
    }
  }

  // Check D1 (required)
  if (!env.DB) {
    return null;
  }
  const result = await env.DB.prepare(
    `SELECT target, is_active, expires_at FROM links WHERE alias = ? LIMIT 1`
  )
    .bind(alias)
    .first<{
      target: string;
      is_active: number;
      expires_at: number | null;
    }>();

  if (!result) {
    return null;
  }

  // Check if active
  if (result.is_active === 0) {
    return null;
  }

  // Check expiry
  if (result.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now > result.expires_at) {
      return null;
    }
  }

  // Cache in KV with 3600s TTL (if available)
  if (env.CACHE) {
    await env.CACHE.put(kvKey, result.target, { expirationTtl: 3600 });
  }

  return result.target;
}

export async function onRequest(context: {
  request: Request;
  env: CloudflarePagesEnv;
  params: { path?: string };
}): Promise<Response> {
  const { request, env, params } = context;
  const url = new URL(request.url);
  
  // Get path from params first, then fall back to URL pathname
  let path = params.path;
  if (!path || path === "") {
    path = url.pathname.slice(1); // Remove leading /
  }

  // Handle QR code generation
  if (path.startsWith("qr/")) {
    const alias = path.slice(3);
    const target = await resolveAlias(alias, env);

    if (!target) {
      return new Response("Alias not found", { status: 404 });
    }

    const qrSvg = generateQRSVG(target);
    return new Response(qrSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Handle empty path (root)
  if (!path || path.length === 0 || path === "/") {
    // Return 404 - root should be handled by static files (index.html)
    return new Response("Not found", { status: 404 });
  }

  // Treat first segment as alias
  const alias = path.split("/")[0];
  if (!alias || alias.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  // Don't try to resolve if DB isn't configured
  if (!env.DB) {
    return new Response("Database not configured", { status: 503 });
  }

  const target = await resolveAlias(alias, env);

  if (!target) {
    return new Response("Link not found", { status: 404 });
  }

  // Enqueue click event (if queue is available)
  if (env.CLICK_QUEUE) {
    const clickEvent: ClickEvent = {
      alias,
      ts: Math.floor(Date.now() / 1000),
      ua: request.headers.get("user-agent") || null,
      ref: request.headers.get("referer") || null,
    };

    try {
      await env.CLICK_QUEUE.send(clickEvent);
    } catch (error) {
      // Log but don't fail the redirect
      console.error("Failed to enqueue click event:", error);
    }
  }

  // Redirect
  return Response.redirect(target, 302);
}

