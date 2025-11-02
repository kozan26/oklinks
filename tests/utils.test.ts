import { describe, expect, it, vi } from "vitest";
import { randomBase62, sanitizeAlias } from "../functions/_lib/utils";
import { resolveAlias } from "../functions/_lib/link-service";
import type { Env, LinkRecord } from "../functions/_lib/types";

const ALLOWED = /^[0-9A-Za-z]+$/;

describe("sanitizeAlias", () => {
  it("strips unsupported characters", () => {
    expect(sanitizeAlias("Hello World!!")).toBe("helloworld");
  });
});

describe("randomBase62", () => {
  it("generates the requested length", () => {
    const value = randomBase62(10);
    expect(value).toHaveLength(10);
    expect(ALLOWED.test(value)).toBe(true);
  });
});

describe("resolveAlias", () => {
  const baseRecord: LinkRecord = {
    id: "id-1",
    alias: "sample",
    target: "https://example.com",
    created_at: Math.floor(Date.now() / 1000),
    expires_at: null,
    password_hash: null,
    is_active: 1,
    clicks_total: 0,
    created_by: null,
  };

  function createEnv(record: LinkRecord | null, cachePayload?: string): Env {
    const store: Record<string, string> = cachePayload
      ? { [`a:${baseRecord.alias}`]: cachePayload }
      : {};

    return {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(record),
            all: vi.fn().mockResolvedValue({ results: record ? [record] : [] }),
            run: vi.fn().mockResolvedValue({ success: true, changes: 1 }),
          }),
        }),
        batch: vi.fn(),
      } as unknown as D1Database,
      CACHE: {
        async get(key: string) {
          return store[key] ?? null;
        },
        async put(key: string, value: string) {
          store[key] = value;
        },
        async delete(key: string) {
          delete store[key];
        },
      } as unknown as KVNamespace,
    };
  }

  it("returns match from cache when active", async () => {
    const cachePayload = JSON.stringify({
      target: baseRecord.target,
      expiresAt: null,
      isActive: true,
    });
    const env = createEnv(null, cachePayload);
    const result = await resolveAlias(env, baseRecord.alias);
    expect(result?.target).toBe(baseRecord.target);
  });

  it("falls back to D1 and hydrates cache", async () => {
    const env = createEnv(baseRecord);
    const result = await resolveAlias(env, baseRecord.alias);
    expect(result?.target).toBe(baseRecord.target);
  });
});
