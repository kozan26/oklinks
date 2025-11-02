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

  // Skip API routes and static assets - let other Functions handle them
  if (path.startsWith("api/") || path.startsWith("_assets/") || path.includes(".")) {
    return new Response("Not found", { status: 404 });
  }

  // Handle root route - serve index.html
  if (!path || path.length === 0 || path === "/" || path === "index.html") {
    try {
      // Try to serve via ASSETS binding if available
      if (env.ASSETS) {
        const assetRequest = new Request(new URL("/index.html", url.origin).toString());
        const assetResponse = await env.ASSETS.fetch(assetRequest);
        if (assetResponse && assetResponse.ok) {
          return assetResponse;
        }
      }
    } catch (e) {
      console.error("Error serving index.html:", e);
    }
    return new Response("Not found", { status: 404 });
  }

  // Handle admin routes - serve admin/index.html
  if (path === "admin" || path.startsWith("admin/")) {
    try {
      if (env.ASSETS) {
        // Try /admin/index.html first
        const adminPath = path === "admin" ? "/admin/index.html" : `/${path}/index.html`;
        const adminRequest = new Request(new URL(adminPath, url.origin).toString());
        const adminResponse = await env.ASSETS.fetch(adminRequest);
        if (adminResponse && adminResponse.ok) {
          return adminResponse;
        }
      }
    } catch (e) {
      console.error("Error serving admin page:", e);
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

  try {
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
  } catch (error) {
    console.error("Error resolving alias:", error);
    return new Response("Error processing request", { status: 500 });
  }
}

