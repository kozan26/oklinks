import type { CloudflarePagesEnv } from "../types";
import { json } from "../utils";

export async function onRequestGet(context: {
  request: Request;
  env: CloudflarePagesEnv;
  params: { id: string };
}): Promise<Response> {
  const { env, params } = context;

  try {
    const result = await env.DB.prepare("SELECT * FROM links WHERE id = ?")
      .bind(params.id)
      .first<{
        id: string;
        alias: string;
        target: string;
        created_at: number;
        expires_at: number | null;
        password_hash: string | null;
        is_active: number;
        clicks_total: number;
        created_by: string | null;
      }>();

    if (!result) {
      return json({ error: "Link not found" }, 404);
    }

    // Don't expose password_hash in response
    const { password_hash, ...link } = result;

    return json(link);
  } catch (error) {
    console.error("Error fetching link:", error);
    return json({ error: "Internal server error" }, 500);
  }
}

export async function onRequestDelete(context: {
  request: Request;
  env: CloudflarePagesEnv;
  params: { id: string };
}): Promise<Response> {
  const { env, params } = context;

  try {
    // Get alias before deleting
    const link = await env.DB.prepare("SELECT alias FROM links WHERE id = ?")
      .bind(params.id)
      .first<{ alias: string }>();

    const result = await env.DB.prepare("DELETE FROM links WHERE id = ?")
      .bind(params.id)
      .run();

    // Also remove from KV cache
    if (link) {
      await env.CACHE.delete(`a:${link.alias}`);
    }

    return json({ deleted: result.meta.changes > 0 });
  } catch (error) {
    console.error("Error deleting link:", error);
    return json({ error: "Internal server error" }, 500);
  }
}

