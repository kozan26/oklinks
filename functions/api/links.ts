import {
  aliasExists,
  listLinks,
  saveLink,
  upsertAliasCache,
} from "../_lib/link-service";
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

  const expiresAt = parseExpiresAt(body.expiresAt ?? null);
  const passwordHash = body.password ? await sha256Hex(body.password) : null;
  const createdBy =
    request.headers.get("CF-Access-Authenticated-User-Email") ?? null;

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

  await upsertAliasCache(env, {
    alias,
    target: body.target,
    expires_at: expiresAt,
    is_active: 1,
  });

  return json({ id, alias, target: body.target });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;
  const links = await listLinks(env, { limit: Number.isFinite(limit) ? limit : 50 });
  return json({ links });
};
