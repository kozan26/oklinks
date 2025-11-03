import { aliasCacheKey, formatDay } from "./utils";
import type { Env, LinkRecord } from "./types";

export async function getLinkById(env: Env, id: string): Promise<LinkRecord | null> {
  const row = await env.DB.prepare(
    "SELECT * FROM links WHERE id = ? LIMIT 1",
  )
    .bind(id)
    .first<LinkRecord>();
  return row ?? null;
}

export async function getLinkByAlias(
  env: Env,
  alias: string,
): Promise<LinkRecord | null> {
  const row = await env.DB.prepare(
    "SELECT * FROM links WHERE alias = ? LIMIT 1",
  )
    .bind(alias)
    .first<LinkRecord>();
  return row ?? null;
}

export async function saveLink(
  env: Env,
  record: Omit<LinkRecord, "clicks_total" | "created_at">,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO links (id, alias, target, created_at, expires_at, password_hash, is_active, clicks_total, created_by)
     VALUES (?, ?, ?, strftime('%s','now'), ?, ?, ?, ?, ?)`
  )
    .bind(
      record.id,
      record.alias,
      record.target,
      record.expires_at,
      record.password_hash,
      record.is_active,
      0,
      record.created_by,
    )
    .run();
}

export async function upsertAliasCache(
  env: Env,
  record: Pick<LinkRecord, "alias" | "target" | "expires_at" | "is_active">,
  ttlSeconds = 3600,
): Promise<void> {
  await env.CACHE.put(
    aliasCacheKey(record.alias),
    JSON.stringify({
      target: record.target,
      expiresAt: record.expires_at,
      isActive: Boolean(record.is_active),
    }),
    { expirationTtl: ttlSeconds },
  );
}

export interface ResolvedAlias {
  target: string;
  record: LinkRecord | null;
  expiresAt: number | null;
}

export async function resolveAlias(
  env: Env,
  alias: string,
): Promise<ResolvedAlias | null> {
  const cacheKey = aliasCacheKey(alias);
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    try {
      const payload = JSON.parse(cached) as {
        target: string;
        expiresAt: number | null;
        isActive: boolean;
      };
      if (!payload.isActive) {
        return null;
      }
      if (
        payload.expiresAt &&
        payload.expiresAt > 0 &&
        payload.expiresAt < Math.floor(Date.now() / 1000)
      ) {
        return null;
      }
      return {
        target: payload.target,
        record: null,
        expiresAt: payload.expiresAt ?? null,
      };
    } catch (error) {
      console.warn("Failed to parse cache payload", error);
    }
  }

  const row = await getLinkByAlias(env, alias);
  if (!row) {
    return null;
  }

  if (!row.is_active) {
    return null;
  }

  if (row.expires_at && row.expires_at < Math.floor(Date.now() / 1000)) {
    return null;
  }

  await upsertAliasCache(env, row);

  return { target: row.target, record: row, expiresAt: row.expires_at };
}

export async function aliasExists(env: Env, alias: string): Promise<boolean> {
  const cached = await env.CACHE.get(aliasCacheKey(alias));
  if (cached) {
    return true;
  }
  const row = await env.DB.prepare(
    "SELECT 1 FROM links WHERE alias = ? LIMIT 1",
  )
    .bind(alias)
    .first<{ 1: number }>();
  return Boolean(row);
}

export async function getActiveLinkByTarget(
  env: Env,
  target: string,
): Promise<LinkRecord | null> {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    `SELECT * FROM links 
     WHERE target = ? 
     AND is_active = 1 
     AND (expires_at IS NULL OR expires_at > ?)
     AND password_hash IS NULL
     ORDER BY created_at DESC
     LIMIT 1`
  )
    .bind(target, now)
    .first<LinkRecord>();
  return row ?? null;
}

export interface ListLinksOptions {
  limit?: number;
}

export async function listLinks(
  env: Env,
  options: ListLinksOptions = {},
): Promise<LinkRecord[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const { results } = await env.DB.prepare(
    `SELECT * FROM links ORDER BY created_at DESC LIMIT ?`,
  )
    .bind(limit)
    .all<LinkRecord>();
  return results ?? [];
}

export interface LinkStats {
  total: number;
  protected: number;
  live: number;
  expired: number;
  inactive: number;
  expiringSoon: number;
  totalClicks: number;
}

export async function getLinkStats(env: Env): Promise<LinkStats> {
  const { results } = await env.DB.prepare(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END) AS protected_count,
       SUM(CASE WHEN is_active = 1 AND (expires_at IS NULL OR expires_at > strftime('%s','now')) THEN 1 ELSE 0 END) AS live_count,
       SUM(CASE WHEN expires_at IS NOT NULL AND expires_at <= strftime('%s','now') THEN 1 ELSE 0 END) AS expired_count,
       SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive_count,
       SUM(CASE WHEN expires_at IS NOT NULL AND expires_at > strftime('%s','now') AND expires_at <= strftime('%s','now','+7 days') THEN 1 ELSE 0 END) AS expiring_soon_count,
       SUM(clicks_total) AS total_clicks
     FROM links`,
  ).all<{
    total: number | null;
    protected_count: number | null;
    live_count: number | null;
    expired_count: number | null;
    inactive_count: number | null;
    expiring_soon_count: number | null;
    total_clicks: number | null;
  }>();

  const row = results?.[0] ?? null;
  return {
    total: Number(row?.total) || 0,
    protected: Number(row?.protected_count) || 0,
    live: Number(row?.live_count) || 0,
    expired: Number(row?.expired_count) || 0,
    inactive: Number(row?.inactive_count) || 0,
    expiringSoon: Number(row?.expiring_soon_count) || 0,
    totalClicks: Number(row?.total_clicks) || 0,
  };
}

export async function deleteLink(
  env: Env,
  id: string,
): Promise<boolean> {
  const result = await env.DB.prepare("DELETE FROM links WHERE id = ?")
    .bind(id)
    .run();
  if (!result.success) {
    console.error("deleteLink: deletion run failed", {
      id,
      error: (result as { error?: unknown }).error,
    });
    return false;
  }

  const changes =
    typeof (result as { changes?: unknown }).changes === "number"
      ? (result as { changes: number }).changes
      : typeof result.meta?.changes === "number"
        ? result.meta.changes
        : 0;
  return changes > 0;
}

export async function recordClick(
  env: Env,
  alias: string,
  timestamp: number,
): Promise<void> {
  const day = formatDay(timestamp);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO click_daily (alias, day, count)
       VALUES (?, ?, 1)
       ON CONFLICT(alias, day) DO UPDATE SET count = count + 1`,
    ).bind(alias, day),
    env.DB.prepare(
      "UPDATE links SET clicks_total = clicks_total + 1 WHERE alias = ?",
    ).bind(alias),
  ]);
}
