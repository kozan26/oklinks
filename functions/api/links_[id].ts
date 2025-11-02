import {
  deleteLink as deleteLinkRecord,
  getLinkById,
} from "../_lib/link-service";
import { aliasCacheKey, json } from "../_lib/utils";
import type { Env } from "../_lib/types";

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = params?.id;
  if (!id) {
    return json({ error: "missing_id" }, 400);
  }

  const record = await getLinkById(env, id);
  return json(record ?? null);
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env, request }) => {
  try {
    // Extract ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1] || params?.id;
    
    if (!id || typeof id !== 'string') {
      console.error('Delete failed: missing or invalid ID', { id, params, pathname: url.pathname });
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
  } catch (error) {
    console.error('Delete error:', error);
    return json({ error: "server_error", deleted: false, message: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
};
