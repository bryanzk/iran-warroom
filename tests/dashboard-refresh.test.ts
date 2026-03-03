import { describe, expect, it } from "vitest";
import seed from "@/data/seed.json";
import { applySourceUpdateToSnapshot, switchSourceUrlInSnapshot } from "@/lib/dashboard-refresh";
import type { SeedData } from "@/lib/types";

function cloneSeed(): SeedData {
  return JSON.parse(JSON.stringify(seed)) as SeedData;
}

describe("dashboard refresh", () => {
  it("propagates source updates to all linked dashboard sections", () => {
    const snapshot = cloneSeed();
    const observedAt = "2026-03-02T13:00:00Z";
    const apLiveUrl = "https://apnews.com/live/live-updates-israel-iran-february-28-2026";

    const touched = applySourceUpdateToSnapshot(snapshot, apLiveUrl, observedAt);

    expect(touched).toBeGreaterThan(0);
    expect(snapshot.meta.updated_at).toBe(observedAt);
    expect(snapshot.meta.last_successful_snapshot).toBe(observedAt);
    expect(snapshot.meta.coverage_end).toBe(observedAt);

    expect(snapshot.sources.some((item) => item.url === apLiveUrl && item.published_at === observedAt)).toBe(true);
    expect(snapshot.events.some((item) => item.source_url === apLiveUrl && item.source_time === observedAt)).toBe(true);
    expect(snapshot.infrastructure.some((item) => item.evidence.some((evidence) => evidence.source_url === apLiveUrl && evidence.source_time === observedAt))).toBe(true);
    expect(snapshot.infrastructure.some((item) => item.evidence.some((evidence) => evidence.source_url === apLiveUrl) && item.last_updated === observedAt)).toBe(true);
    expect(snapshot.statements.some((item) => item.source_url === apLiveUrl && item.timestamp === observedAt)).toBe(true);
    expect(snapshot.factchecks.some((item) => item.sources.some((source) => source.source_url === apLiveUrl && source.source_time === observedAt))).toBe(true);
    expect(snapshot.regional_impacts.some((item) => item.source_url === apLiveUrl && item.source_time === observedAt)).toBe(true);
    expect(snapshot.media.some((item) => item.source_url === apLiveUrl && item.source_time === observedAt)).toBe(true);
  });

  it("updates social media entries when the post url changes", () => {
    const snapshot = cloneSeed();
    const observedAt = "2026-03-02T13:05:00Z";
    const socialUrl = "https://x.com/IRIFAIRSTRIKE/status/1912345678901234567";

    const touched = applySourceUpdateToSnapshot(snapshot, socialUrl, observedAt);

    expect(touched).toBeGreaterThan(0);
    expect(snapshot.social_media.some((item) => item.url === socialUrl && item.published_at === observedAt)).toBe(true);
    expect(snapshot.meta.updated_at).toBe(observedAt);
  });

  it("keeps snapshot unchanged for unmatched source url", () => {
    const snapshot = cloneSeed();
    const before = cloneSeed();

    const touched = applySourceUpdateToSnapshot(
      snapshot,
      "https://example.com/no-match",
      "2026-03-02T13:20:00Z"
    );

    expect(touched).toBe(0);
    expect(snapshot).toEqual(before);
  });

  it("replaces source url across linked sections when AP live updates URL rotates", () => {
    const snapshot = cloneSeed();
    const observedAt = "2026-03-03T19:40:00Z";
    const oldUrl = "https://apnews.com/live/live-updates-israel-iran-february-28-2026";
    const newUrl = "https://apnews.com/live/iran-war-israel-trump-03-03-2026";

    const touched = switchSourceUrlInSnapshot(snapshot, oldUrl, newUrl, observedAt);

    expect(touched).toBeGreaterThan(0);
    expect(snapshot.sources.some((item) => item.url === newUrl)).toBe(true);
    expect(snapshot.sources.some((item) => item.url === oldUrl)).toBe(false);
    expect(snapshot.events.some((item) => item.source_url === newUrl)).toBe(true);
    expect(snapshot.infrastructure.some((item) => item.evidence.some((e) => e.source_url === newUrl))).toBe(true);
    expect(snapshot.meta.updated_at).toBe(observedAt);
  });
});
