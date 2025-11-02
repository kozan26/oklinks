const BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function randomBase62(length = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += BASE62_CHARS.charAt(Math.floor(Math.random() * BASE62_CHARS.length));
  }
  return result;
}

export async function sha256Hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function sanitizeAlias(alias: string): string | null {
  // Allow only lowercase letters, numbers, hyphens, and underscores
  const sanitized = alias.toLowerCase().replace(/[^a-z0-9-_]/g, "");
  if (sanitized.length === 0 || sanitized.length > 50) {
    return null;
  }
  return sanitized;
}

export function formatDay(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Simple QR code SVG generator (stub - can be swapped later)
export function generateQRSVG(data: string, size = 200): string {
  // This is a simplified placeholder. In production, use a proper QR library.
  // For now, return a simple placeholder that encodes the URL in a data URI
  const encoded = encodeURIComponent(data);
  // Create a simple grid-based QR-like pattern (very basic)
  const gridSize = 25;
  const cellSize = size / gridSize;
  let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;

  // Generate a deterministic pattern based on the data
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const hash = (encoded.charCodeAt((i * gridSize + j) % encoded.length) + i + j) % 3;
      if (hash === 0) {
        svg += `<rect x="${i * cellSize}" y="${j * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
  }

  svg += `</svg>`;
  return svg;
}

