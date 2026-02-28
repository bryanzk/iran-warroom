import { describe, expect, it } from "vitest";
import { extractVersionFromHtml } from "@/lib/live-feed";

describe("live feed parser", () => {
  it("extracts article modified time", () => {
    const html = '<meta property="article:modified_time" content="2026-02-28T14:25:10.306">';
    expect(extractVersionFromHtml(html)).toBe("2026-02-28T14:25:10.306");
  });

  it("extracts json-ld dateModified", () => {
    const html = '{"dateModified":"2026-02-28T13:45:09Z"}';
    expect(extractVersionFromHtml(html)).toBe("2026-02-28T13:45:09Z");
  });

  it("returns undefined when no version marker found", () => {
    expect(extractVersionFromHtml("<html><head></head><body>none</body></html>")).toBeUndefined();
  });
});
