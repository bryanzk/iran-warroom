import { describe, expect, it } from "vitest";
import seed from "@/data/seed.json";
import { applySourceUpdateToSnapshot, switchSourceUrlInSnapshot } from "@/lib/dashboard-refresh";
import type { SeedData } from "@/lib/types";

function cloneSeed(): SeedData {
  return JSON.parse(JSON.stringify(seed)) as SeedData;
}

describe("dashboard refresh", () => {
  it("preserves source publication timestamps while updating snapshot sync metadata", () => {
    const snapshot = cloneSeed();
    const before = cloneSeed();
    const observedAt = "2026-03-02T13:00:00Z";
    const apLiveUrl = "https://apnews.com/live/live-updates-israel-iran-february-28-2026";

    const touched = applySourceUpdateToSnapshot(snapshot, apLiveUrl, observedAt);

    expect(touched).toBeGreaterThan(0);
    expect(snapshot.meta.updated_at).toBe(observedAt);
    expect(snapshot.meta.last_successful_snapshot).toBe(observedAt);
    expect(snapshot.meta.coverage_end).toBe(observedAt);

    expect(snapshot.sources.filter((item) => item.url === apLiveUrl).map((item) => item.published_at)).toEqual(
      before.sources.filter((item) => item.url === apLiveUrl).map((item) => item.published_at)
    );
    expect(snapshot.events.filter((item) => item.source_url === apLiveUrl).map((item) => item.source_time)).toEqual(
      before.events.filter((item) => item.source_url === apLiveUrl).map((item) => item.source_time)
    );
    expect(
      snapshot.infrastructure
        .flatMap((item) => item.evidence.filter((evidence) => evidence.source_url === apLiveUrl))
        .map((evidence) => evidence.source_time)
    ).toEqual(
      before.infrastructure
        .flatMap((item) => item.evidence.filter((evidence) => evidence.source_url === apLiveUrl))
        .map((evidence) => evidence.source_time)
    );
    expect(snapshot.statements.filter((item) => item.source_url === apLiveUrl).map((item) => item.timestamp)).toEqual(
      before.statements.filter((item) => item.source_url === apLiveUrl).map((item) => item.timestamp)
    );
  });

  it("keeps social media published_at unchanged when only refresh detection happens", () => {
    const snapshot = cloneSeed();
    const before = cloneSeed();
    const observedAt = "2026-03-02T13:05:00Z";
    const socialUrl = "https://x.com/IRIFAIRSTRIKE/status/1912345678901234567";

    const touched = applySourceUpdateToSnapshot(snapshot, socialUrl, observedAt);

    expect(touched).toBeGreaterThan(0);
    expect(snapshot.social_media.filter((item) => item.url === socialUrl).map((item) => item.published_at)).toEqual(
      before.social_media.filter((item) => item.url === socialUrl).map((item) => item.published_at)
    );
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
