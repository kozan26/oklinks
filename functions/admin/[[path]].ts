import type { Env } from "../_lib/types";

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return new Response(null, { status: 401 });
  }

  const sessionData = await env.CACHE.get(`admin:session:${token}`);
  if (!sessionData) {
    return new Response(null, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionData);
    if (session.expiresAt < Date.now()) {
      await env.CACHE.delete(`admin:session:${token}`);
      return new Response(null, { status: 401 });
    }
    // Allow the request to continue
    return;
  } catch {
    return new Response(null, { status: 401 });
  }
};

