export const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function aliasCacheKey(alias: string): string {
  return `a:${alias}`;
}

export function json(data: unknown, status = 200, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), {
    ...init,
    status,
    headers,
  });
}

export function randomBase62(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = "";
  for (let i = 0; i < length; i += 1) {
    const index = bytes[i] % BASE62_ALPHABET.length;
    result += BASE62_ALPHABET[index];
  }
  return result;
}

export function sanitizeAlias(input: string): string {
  const lowered = input.trim().toLowerCase();
  return lowered.replace(/[^a-z0-9-_]/g, "");
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function formatDay(timestamp: number): string {
  const ms = timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp?: string | null,
): Promise<boolean> {
  if (!secret) {
    return true;
  }
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteIp) {
    form.append("remoteip", remoteIp);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: form,
    },
  );

  if (!response.ok) {
    return false;
  }

  const payload = (await response.json()) as { success?: boolean };
  return Boolean(payload.success);
}
