import { describe, expect, it } from "vitest";
import { isAllowedSourceUrl, sanitizeQueryText } from "@/lib/safety";

describe("security checks", () => {
  it("sanitizes control characters from query", () => {
    const cleaned = sanitizeQueryText(" Tehran\u0000\u0007 <script> ");
    expect(cleaned).toBe("Tehran <script>");
  });

  it("accepts whitelisted source domains", () => {
    expect(isAllowedSourceUrl("https://apnews.com/live/live-updates-israel-iran-february-28-2026")).toBe(true);
    expect(isAllowedSourceUrl("https://subdomain.reuters.com/world/story")).toBe(true);
  });

  it("rejects non-whitelisted source domains", () => {
    expect(isAllowedSourceUrl("https://evil.example.com/fake")).toBe(false);
    expect(isAllowedSourceUrl("javascript:alert(1)")).toBe(false);
  });
});
