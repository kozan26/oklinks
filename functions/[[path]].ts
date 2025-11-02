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
  try {
    // Try KV first (if available)
    const kvKey = `a:${alias}`;
    if (env.CACHE) {
      try {
        const cached = await env.CACHE.get(kvKey);
        if (cached) {
          return cached;
        }
      } catch (kvError) {
        console.error("KV cache read error:", kvError);
        // Continue to D1 lookup
      }
    }

    // Check D1 (required)
    if (!env.DB) {
      return null;
    }

    let result;
    try {
      result = await env.DB.prepare(
        `SELECT target, is_active, expires_at FROM links WHERE alias = ? LIMIT 1`
      )
        .bind(alias)
        .first<{
          target: string;
          is_active: number;
          expires_at: number | null;
        }>();
    } catch (dbError) {
      console.error("Database query error:", dbError);
      return null;
    }

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

    // Validate target exists
    if (!result.target || typeof result.target !== "string") {
      console.error("Invalid target in database for alias:", alias);
      return null;
    }

    // Cache in KV with 3600s TTL (if available) - don't block on cache write
    if (env.CACHE && result.target) {
      env.CACHE.put(kvKey, result.target, { expirationTtl: 3600 }).catch((error) => {
        console.error("KV cache write error:", error);
      });
    }

    return result.target;
  } catch (error: any) {
    console.error("Error in resolveAlias:", error?.message || error);
    return null;
  }
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

  // Skip API routes - let other Functions handle them
  if (path.startsWith("api/")) {
    return new Response("Not found", { status: 404 });
  }

  // IMPORTANT: Check ASSETS first for static files before handling as alias
  // This ensures static files (index.html, admin/index.html, etc.) are served correctly
  if (env.ASSETS) {
    try {
      // Try to fetch the static asset
      const assetResponse = await env.ASSETS.fetch(request);
      // If asset exists (status is not 404), return it
      if (assetResponse && assetResponse.status !== 404) {
        return assetResponse;
      }
    } catch (e: any) {
      // If ASSETS fetch fails, continue to alias resolution
      console.error("ASSETS fetch error:", e?.message || e);
    }
  }

  // Skip static asset files (should have been handled by ASSETS above)
  if (path.startsWith("_assets/") || path.includes(".")) {
    return new Response("Not found", { status: 404 });
  }

  // For root/admin routes, if ASSETS didn't find them, return 404
  // This should not happen if static files are properly deployed
  if (!path || path.length === 0 || path === "/" || path === "index.html") {
    return new Response("Not found", { status: 404 });
  }

  if (path === "admin" || path.startsWith("admin/")) {
    return new Response("Not found", { status: 404 });
  }

  // Handle QR code generation
  if (path.startsWith("qr/")) {
    try {
      const alias = path.slice(3);
      if (!alias || alias.length === 0) {
        return new Response("Alias not found", { status: 404 });
      }

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
    } catch (error: any) {
      console.error("Error generating QR code:", error?.message || error);
      return new Response("Error generating QR code", { status: 500 });
    }
  }

  // Treat first segment as alias (short link redirect)
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

    // Validate target URL before redirecting
    if (!target || typeof target !== "string" || target.length === 0) {
      console.error("Invalid target URL for alias:", alias);
      return new Response("Invalid link configuration", { status: 500 });
    }

    // Ensure target is a valid URL
    try {
      new URL(target);
    } catch (urlError) {
      console.error("Invalid URL format for alias:", alias, "target:", target);
      return new Response("Invalid link URL", { status: 500 });
    }

    // Enqueue click event (if queue is available) - don't block redirect
    if (env.CLICK_QUEUE) {
      const clickEvent: ClickEvent = {
        alias,
        ts: Math.floor(Date.now() / 1000),
        ua: request.headers.get("user-agent") || null,
        ref: request.headers.get("referer") || null,
      };

      // Fire and forget - don't wait for queue
      env.CLICK_QUEUE.send(clickEvent).catch((error) => {
        console.error("Failed to enqueue click event:", error);
      });
    }

    // Redirect
    return Response.redirect(target, 302);
  } catch (error: any) {
    console.error("Error resolving alias:", error?.message || error);
    console.error("Alias that failed:", alias);
    console.error("Error stack:", error?.stack);
    return new Response("Error processing request", { status: 500 });
  }
}

