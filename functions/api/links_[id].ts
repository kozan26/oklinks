import {
  deleteLink as deleteLinkRecord,
  getLinkById,
} from "../_lib/link-service";
import { aliasCacheKey, json } from "../_lib/utils";
import type { Env } from "../_lib/types";

export const onRequest: PagesFunction<Env> = async ({ params, env, request }) => {
  const method = request.method;
  
  // Handle GET requests
  if (method === "GET") {
    const id = params?.id;
    if (!id) {
      return json({ error: "missing_id" }, 400);
    }

    const record = await getLinkById(env, id);
    return json(record ?? null);
  }
  
  // Handle DELETE requests
  if (method === "DELETE") {
  try {
    // In Cloudflare Pages Functions, params.id should be populated from the filename pattern
    let id = params?.id as string | undefined;
    
    // Fallback: extract from URL if params.id is not available
    if (!id) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      // Path should be /api/links/{id}
      if (pathParts.length >= 3 && pathParts[0] === 'api' && pathParts[1] === 'links') {
        id = pathParts[2];
      }
    }
    
    if (!id || typeof id !== 'string') {
      console.error('Delete failed: missing or invalid ID', { id, params, url: request.url });
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
    return json({ 
      error: "server_error", 
      deleted: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
  }
  
  // Method not allowed
  return json({ error: "method_not_allowed" }, 405);
};
