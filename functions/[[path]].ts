import { recordClick, resolveAlias } from "./_lib/link-service";
import type { Env } from "./_lib/types";
import { json, sanitizeAlias, sha256Hex } from "./_lib/utils";

async function generatePlaceholderQrSvg(data: string): Promise<string> {
  const size = 29;
  const cell = 8;
  const padding = cell * 4;
  const dimension = size * cell + padding * 2;

  let seed = await sha256Hex(data);
  const cells: boolean[] = [];
  while (cells.length < size * size) {
    for (let i = 0; i < seed.length && cells.length < size * size; i += 1) {
      const nibble = parseInt(seed[i], 16);
      cells.push((nibble & 0b1) === 1);
    }
    seed = await sha256Hex(seed + data);
  }

  const rects: string[] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = y * size + x;
      if (!cells[index]) {
        continue;
      }
      const px = padding + x * cell;
      const py = padding + y * cell;
      rects.push(
        `<rect x="${px}" y="${py}" width="${cell}" height="${cell}" rx="1" ry="1" fill="#0B0D0E" />`,
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" shape-rendering="crispEdges">\n  <rect width="100%" height="100%" fill="#43D5FF" />\n  <g fill="#0B0D0E">${rects.join("\n")}</g>\n  <text x="50%" y="${dimension - padding / 2}" text-anchor="middle" font-family="monospace" font-size="${cell * 1.6}" fill="#0B0D0E" opacity="0.25">oklinks</text>\n</svg>`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params, next } = context;

  if (request.method !== "GET") {
    return next();
  }

  const pathParam = params?.path ?? "";
  const segments = Array.isArray(pathParam)
    ? pathParam
    : String(pathParam)
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean);

  if (segments.length === 0) {
    return next();
  }

  // Skip static files - let Astro/Cloudflare Pages serve them
  const firstSegment = segments[0];
  const staticExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.css', '.js', '.woff', '.woff2', '.ttf', '.eot'];
  const isStaticFile = staticExtensions.some(ext => firstSegment.toLowerCase().endsWith(ext));
  if (isStaticFile) {
    return next();
  }

  if (segments[0] === "admin") {
    return next();
  }

  if (segments[0] === "qr" && segments.length >= 2) {
    const alias = sanitizeAlias(segments[1]);
    if (!alias) {
      return new Response("Not found", { status: 404 });
    }
    const resolved = await resolveAlias(env, alias);
    if (!resolved) {
      return new Response("Not found", { status: 404 });
    }
    const svg = await generatePlaceholderQrSvg(resolved.target);
    return new Response(svg, {
      status: 200,
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  const alias = sanitizeAlias(segments[0]);
  if (!alias) {
    return next();
  }

  const resolved = await resolveAlias(env, alias);
  if (!resolved) {
    return new Response("Not found", {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  }

  const timestamp = Date.now();
  const event = {
    alias,
    ts: timestamp,
    ua: request.headers.get("user-agent"),
    ref: request.headers.get("referer"),
    ip: request.headers.get("CF-Connecting-IP"),
  };

  if (env.CLICK_QUEUE) {
    try {
      await env.CLICK_QUEUE.send(event);
    } catch (error) {
      console.warn("Queue send failed, falling back to direct logging", error);
      await recordClick(env, alias, timestamp);
    }
  } else {
    await recordClick(env, alias, timestamp);
  }

  return Response.redirect(resolved.target, 302);
};
