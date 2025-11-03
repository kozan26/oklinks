import {
  aliasExists,
  deleteLink as deleteLinkRecord,
  getActiveLinkByTarget,
  getLinkById,
  listLinks,
  saveLink,
  upsertAliasCache,
} from "../_lib/link-service";
import { aliasCacheKey } from "../_lib/utils";
import type { Env } from "../_lib/types";
import {
  isValidHttpUrl,
  json,
  randomBase62,
  readJson,
  sanitizeAlias,
  sha256Hex,
} from "../_lib/utils";

interface CreateLinkRequest {
  alias?: string;
  target?: string;
  expiresAt?: string | number | null;
  password?: string;
}

function parseExpiresAt(input: string | number | null | undefined): number | null {
  if (input === undefined || input === null || input === "") {
    return null;
  }
  if (typeof input === "number") {
    if (input <= 0) {
      return null;
    }
    return input > 1_000_000_000_000 ? Math.floor(input / 1000) : Math.floor(input);
  }
  const parsed = Date.parse(input);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.floor(parsed / 1000);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // POST should only handle /api/links (create new link)
  // DELETE requests to /api/links/{id} should be handled by links_[id].ts
  // This handler only creates new links
  const { request, env } = context;
  const contentType = request.headers.get("content-type") ?? "";

  let body: CreateLinkRequest | null = null;
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    body = {
      target: form.get("target")?.toString(),
      alias: form.get("alias")?.toString(),
      expiresAt: form.get("expiresAt")?.toString() ?? null,
      password: form.get("password")?.toString(),
    };
  } else {
    body = await readJson<CreateLinkRequest>(request);
  }

  if (!body || typeof body.target !== "string" || !isValidHttpUrl(body.target)) {
    return json({ error: "invalid_target" }, 400);
  }

  const expiresAt = parseExpiresAt(body.expiresAt ?? null);
  const passwordHash = body.password ? await sha256Hex(body.password) : null;
  const createdBy =
    request.headers.get("CF-Access-Authenticated-User-Email") ?? null;

  // Check if the same URL was already shortened (only if no custom alias and no password)
  if (!body.alias && !body.password) {
    const existingLink = await getActiveLinkByTarget(env, body.target);
    if (existingLink) {
      // Return the existing link
      const responsePayload = {
        id: existingLink.id,
        alias: existingLink.alias,
        target: existingLink.target,
      };

      // Ensure cache is up to date
      await upsertAliasCache(env, {
        alias: existingLink.alias,
        target: existingLink.target,
        expires_at: existingLink.expires_at,
        is_active: existingLink.is_active,
      });

      const prefersHtml =
        contentType.includes("application/x-www-form-urlencoded") &&
        (request.headers.get("accept") ?? "").includes("text/html");

      if (prefersHtml) {
        const origin = new URL(request.url).origin;
        const shortUrl = `${origin.replace(/\/$/, "")}/${existingLink.alias}`;
        const html = `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <title>Kısa bağlantı bulundu · sakla</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#0B0D0E; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:2rem; }
      a { color:#43D5FF; }
      .card { background:#1A1C1E; padding:2rem; border-radius:1rem; max-width:32rem; text-align:center; border:1px solid rgba(67,213,255,0.3); box-shadow:0 25px 60px rgba(0,0,0,0.6);}
      .short { font-size:1.2rem; margin:1rem 0; font-weight:600; }
      .buttons { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; }
      button { background:#3A3F36; border:1px solid rgba(67,213,255,0.4); color:#43D5FF; padding:0.6rem 1.4rem; border-radius:999px; cursor:pointer; }
      button:hover { background:#2a2d28; }
      .note { margin-top:1rem; font-size:0.85rem; color:rgba(255,255,255,0.6); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Bağlantı zaten mevcut</h1>
      <p class="short"><a href="${shortUrl}">${shortUrl}</a></p>
      <p class="note">Bu URL daha önce kısaltılmış.</p>
      <div class="buttons">
        <button type="button" onclick="navigator.clipboard.writeText('${shortUrl}').then(()=>this.textContent='Kopyalandı!').catch(()=>this.textContent='Elle kopyala')">Kopyala</button>
        <a href="${shortUrl}" rel="noopener" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.6rem 1.4rem;border-radius:999px;border:1px solid rgba(67,213,255,0.4);text-decoration:none;">Bağlantıyı aç</a>
        <a href="/" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.6rem 1.4rem;border-radius:999px;border:1px solid rgba(255,255,255,0.12);text-decoration:none;color:#fff;">Yeni bir tane oluştur</a>
      </div>
      <p style="margin-top:1.5rem;font-size:0.85rem;color:rgba(255,255,255,0.6);">Hedef: <span style="word-break:break-all;">${body.target}</span></p>
    </div>
  </body>
</html>`;
        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      }

      return json(responsePayload);
    }
  }

  let alias = "";
  if (body.alias) {
    alias = sanitizeAlias(body.alias);
  }
  if (!alias) {
    alias = sanitizeAlias(randomBase62());
  }
  if (!alias) {
    return json({ error: "alias_unavailable" }, 400);
  }

  const collision = await aliasExists(env, alias);
  if (collision) {
    return json({ error: "alias_taken" }, 409);
  }

  const id = crypto.randomUUID();

  try {
    await saveLink(
      env,
      {
        id,
        alias,
        target: body.target,
        expires_at: expiresAt,
        password_hash: passwordHash,
        is_active: 1,
        created_by: createdBy,
      },
    );
  } catch (error) {
    console.error("Failed to insert link", error);
    return json({ error: "alias_taken" }, 409);
  }

  const responsePayload = {
    id,
    alias,
    target: body.target,
  };

  await upsertAliasCache(env, {
    alias,
    target: body.target,
    expires_at: expiresAt,
    is_active: 1,
  });

  const prefersHtml =
    contentType.includes("application/x-www-form-urlencoded") &&
    (request.headers.get("accept") ?? "").includes("text/html");

  if (prefersHtml) {
    const origin = new URL(request.url).origin;
    const shortUrl = `${origin.replace(/\/$/, "")}/${alias}`;
    const html = `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <title>Kısa bağlantı oluşturuldu · sakla</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#0B0D0E; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:2rem; }
      a { color:#43D5FF; }
      .card { background:#1A1C1E; padding:2rem; border-radius:1rem; max-width:32rem; text-align:center; border:1px solid rgba(67,213,255,0.3); box-shadow:0 25px 60px rgba(0,0,0,0.6);}
      .short { font-size:1.2rem; margin:1rem 0; font-weight:600; }
      .buttons { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; }
      button { background:#3A3F36; border:1px solid rgba(67,213,255,0.4); color:#43D5FF; padding:0.6rem 1.4rem; border-radius:999px; cursor:pointer; }
      button:hover { background:#2a2d28; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Bağlantı hazır</h1>
      <p class="short"><a href="${shortUrl}">${shortUrl}</a></p>
      <div class="buttons">
        <button type="button" onclick="navigator.clipboard.writeText('${shortUrl}').then(()=>this.textContent='Kopyalandı!').catch(()=>this.textContent='Elle kopyala')">Kopyala</button>
        <a href="${shortUrl}" rel="noopener" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.6rem 1.4rem;border-radius:999px;border:1px solid rgba(67,213,255,0.4);text-decoration:none;">Bağlantıyı aç</a>
        <a href="/" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.6rem 1.4rem;border-radius:999px;border:1px solid rgba(255,255,255,0.12);text-decoration:none;color:#fff;">Yeni bir tane oluştur</a>
      </div>
      <p style="margin-top:1.5rem;font-size:0.85rem;color:rgba(255,255,255,0.6);">Hedef: <span style="word-break:break-all;">${body.target}</span></p>
    </div>
  </body>
</html>`;
    return new Response(html, {
      status: 201,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  return json(responsePayload);
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Only handle DELETE for /api/links/{id}
  if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'links') {
    const id = pathParts[2];
    
    if (!id || typeof id !== 'string') {
      console.error('Delete failed: missing or invalid ID', { id, url: request.url });
      return json({ error: "missing_id", deleted: false }, 400);
    }

    console.log('Attempting to delete link:', id);
    const record = await getLinkById(env, id);
    
    if (!record) {
      console.error('Delete failed: link not found', { id });
      return json({ error: "link_not_found", deleted: false }, 404);
    }

    const success = await deleteLinkRecord(env, id);
    
    if (!success) {
      console.error('Delete failed: database deletion returned false', { id });
      return json({ error: "delete_failed", deleted: false }, 500);
    }

    // Clear cache
    if (record) {
      await env.CACHE.delete(aliasCacheKey(record.alias));
    }

    console.log('Link deleted successfully:', id);
    return json({ deleted: true, id });
  }
  
  // For other DELETE requests, return method not allowed
  return json({ error: "method_not_allowed" }, 405);
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Handle GET for /api/links/{id} - get a specific link by ID
  if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'links') {
    const id = pathParts[2];
    if (!id || typeof id !== 'string') {
      return json({ error: "missing_id" }, 400);
    }
    const record = await getLinkById(env, id);
    return json(record ?? null);
  }
  
  // Otherwise, handle as list request for /api/links
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;
  const links = await listLinks(env, { limit: Number.isFinite(limit) ? limit : 50 });
  return json({ links });
};
