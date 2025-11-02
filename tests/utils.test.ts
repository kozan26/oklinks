import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  randomBase62,
  sanitizeAlias,
  formatDay,
  validateUrl,
  sha256Hex,
} from "../functions/utils";

describe("randomBase62", () => {
  it("should generate a string of the specified length", () => {
    const result = randomBase62(6);
    expect(result).toHaveLength(6);
  });

  it("should generate different values on consecutive calls", () => {
    const result1 = randomBase62(10);
    const result2 = randomBase62(10);
    // Very unlikely to be the same
    expect(result1).not.toBe(result2);
  });

  it("should only contain Base62 characters", () => {
    const result = randomBase62(100);
    expect(result).toMatch(/^[0-9A-Za-z]+$/);
  });
});

describe("sanitizeAlias", () => {
  it("should sanitize valid aliases", () => {
    expect(sanitizeAlias("hello-world")).toBe("hello-world");
    expect(sanitizeAlias("test123")).toBe("test123");
    expect(sanitizeAlias("my_link")).toBe("my_link");
  });

  it("should convert to lowercase", () => {
    expect(sanitizeAlias("HELLO")).toBe("hello");
    expect(sanitizeAlias("Test123")).toBe("test123");
  });

  it("should remove invalid characters", () => {
    expect(sanitizeAlias("hello.world")).toBe("helloworld");
    expect(sanitizeAlias("test@123")).toBe("test123");
    expect(sanitizeAlias("foo bar")).toBe("foobar");
  });

  it("should return null for empty strings", () => {
    expect(sanitizeAlias("")).toBe(null);
    expect(sanitizeAlias("   ")).toBe(null);
  });

  it("should return null for aliases that are too long", () => {
    expect(sanitizeAlias("a".repeat(51))).toBe(null);
  });
});

describe("formatDay", () => {
  it("should format timestamp as YYYY-MM-DD", () => {
    // Unix timestamp for 2024-01-15 00:00:00 UTC
    const timestamp = 1705276800;
    expect(formatDay(timestamp)).toBe("2024-01-15");
  });

  it("should handle different dates correctly", () => {
    const timestamp = 1609459200; // 2021-01-01
    expect(formatDay(timestamp)).toBe("2021-01-01");
  });
});

describe("validateUrl", () => {
  it("should accept valid HTTP URLs", () => {
    expect(validateUrl("http://example.com")).toBe(true);
    expect(validateUrl("http://example.com/path")).toBe(true);
  });

  it("should accept valid HTTPS URLs", () => {
    expect(validateUrl("https://example.com")).toBe(true);
    expect(validateUrl("https://example.com/path?query=1")).toBe(true);
  });

  it("should reject invalid URLs", () => {
    expect(validateUrl("not-a-url")).toBe(false);
    expect(validateUrl("ftp://example.com")).toBe(false);
    expect(validateUrl("javascript:alert(1)")).toBe(false);
  });

  it("should reject empty strings", () => {
    expect(validateUrl("")).toBe(false);
  });
});

describe("sha256Hex", () => {
  it("should hash a string consistently", async () => {
    const result1 = await sha256Hex("test");
    const result2 = await sha256Hex("test");
    expect(result1).toBe(result2);
  });

  it("should produce a hex string of 64 characters", async () => {
    const result = await sha256Hex("test");
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should produce different hashes for different inputs", async () => {
    const result1 = await sha256Hex("test1");
    const result2 = await sha256Hex("test2");
    expect(result1).not.toBe(result2);
  });
});

