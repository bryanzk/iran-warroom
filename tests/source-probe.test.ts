import { describe, expect, it } from "vitest";
import { extractPreferredApLiveUrlFromHtml, hasVersionChanged } from "@/lib/source-probe";

describe("source probe version comparison", () => {
  it("detects newer ISO timestamp as changed", () => {
    expect(hasVersionChanged("2026-03-02T16:00:00Z", "2026-03-02T15:00:00Z")).toBe(true);
  });

  it("ignores same or older ISO timestamp", () => {
    expect(hasVersionChanged("2026-03-02T15:00:00Z", "2026-03-02T15:00:00Z")).toBe(false);
    expect(hasVersionChanged("2026-03-02T14:00:00Z", "2026-03-02T15:00:00Z")).toBe(false);
  });

  it("falls back to direct token comparison for opaque versions", () => {
    expect(hasVersionChanged("etag:abc", "etag:def")).toBe(true);
    expect(hasVersionChanged("etag:abc", "etag:abc")).toBe(false);
  });

  it("does not report change when no reference exists", () => {
    expect(hasVersionChanged("etag:abc")).toBe(false);
  });

  it("extracts the latest AP Iran live-updates URL when navbar links rotate", () => {
    const html = `
      <nav>
        <a href="https://apnews.com/live/live-updates-israel-iran-february-28-2026"><span class='islive'>LIVE&nbsp;</span>Older updates</a>
        <a href="/live/iran-war-israel-trump-03-03-2026"><span class='islive'>LIVE&nbsp;</span>updates</a>
        <a href="/live/election-primary-3-3-2026"><span class='islive'>LIVE&nbsp;</span>Live updates: Midterm primary voters head to the polls</a>
      </nav>
    `;

    expect(extractPreferredApLiveUrlFromHtml(html)).toBe(
      "https://apnews.com/live/iran-war-israel-trump-03-03-2026"
    );
  });
});
