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
  
  // Get path from params (Cloudflare Pages Functions provides this)
  // params.path is undefined for root, or contains the path segment
  let path = params.path;
  if (path === undefined) {
    // If params.path is undefined, get from URL pathname
    path = url.pathname.slice(1); // Remove leading /
  }

  // Skip if this is an API route or static asset - let Pages handle it
  if (path.startsWith("api/") || path.startsWith("_assets/") || path.includes(".")) {
    return new Response("Not found", { status: 404 });
  }

  // Handle empty path (root) - fetch and return the static index.html
  if (!path || path.length === 0 || path === "/") {
    // For root, fetch the static index.html file
    try {
      const indexResponse = await fetch(new URL("/index.html", url.origin));
      if (indexResponse.ok) {
        return indexResponse;
      }
    } catch (e) {
      // Fall through to 404
    }
    return new Response("Not found", { status: 404 });
  }

  // Handle admin routes - fetch and return the static admin page
  if (path === "admin" || path.startsWith("admin/")) {
    try {
      const adminPath = path === "admin" ? "/admin/index.html" : `/${path}/index.html`;
      const adminResponse = await fetch(new URL(adminPath, url.origin));
      if (adminResponse.ok) {
        return adminResponse;
      }
      // Try without trailing slash
      const adminResponse2 = await fetch(new URL(`/${path}.html`, url.origin));
      if (adminResponse2.ok) {
        return adminResponse2;
      }
    } catch (e) {
      // Fall through to 404
    }
    return new Response("Not found", { status: 404 });
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

