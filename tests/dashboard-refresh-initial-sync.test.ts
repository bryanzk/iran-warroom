import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/source-probe", async () => {
  const actual = await vi.importActual<typeof import("@/lib/source-probe")>("@/lib/source-probe");
  return {
    ...actual,
    probeSourceVersion: vi.fn(),
    resolveApLiveUpdatesUrl: vi.fn()
  };
});

import { getDashboardRefreshService } from "@/lib/dashboard-refresh";
import { probeSourceVersion, resolveApLiveUpdatesUrl } from "@/lib/source-probe";

describe("dashboard initial sync refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.__warroomDashboardRefreshService__ = undefined;
    vi.mocked(resolveApLiveUpdatesUrl).mockResolvedValue({
      checkedAt: "2026-03-03T00:00:00Z"
    });
  });

  it("updates snapshot on first probe when version differs from seed baseline", async () => {
    const apLiveUrl = "https://apnews.com/live/live-updates-israel-iran-february-28-2026";
    const checkedAt = "2026-03-02T16:10:00Z";

    vi.mocked(probeSourceVersion).mockImplementation(async (url: string) => {
      if (url === apLiveUrl) {
        return {
          version: "etag:ap-live-new",
          checkedAt,
          status: 200
        };
      }
      return {
        checkedAt,
        status: 404
      };
    });

    const service = getDashboardRefreshService();
    const touched = await service.refreshOnce();

    expect(touched).toBeGreaterThan(0);

    const snapshot = service.getSnapshot();
    expect(snapshot.meta.updated_at).toBe(checkedAt);
    expect(snapshot.sources.some((item) => item.url === apLiveUrl && item.published_at === checkedAt)).toBe(true);
  });

  it("switches AP live source URL when AP navbar points to a newer live page", async () => {
    const oldLiveUrl = "https://apnews.com/live/live-updates-israel-iran-february-28-2026";
    const nextLiveUrl = "https://apnews.com/live/iran-war-israel-trump-03-03-2026";
    const checkedAt = "2026-03-03T19:40:00Z";

    vi.mocked(resolveApLiveUpdatesUrl).mockResolvedValue({
      url: nextLiveUrl,
      checkedAt
    });

    vi.mocked(probeSourceVersion).mockImplementation(async (url: string) => {
      if (url === nextLiveUrl) {
        return {
          version: "etag:ap-live-next",
          checkedAt,
          status: 200
        };
      }
      return { checkedAt, status: 404 };
    });

    const service = getDashboardRefreshService();
    await service.refreshOnce(true);

    const snapshot = service.getSnapshot();
    expect(snapshot.sources.some((item) => item.url === nextLiveUrl)).toBe(true);
    expect(snapshot.sources.some((item) => item.url === oldLiveUrl)).toBe(false);
    expect(snapshot.events.some((item) => item.source_url === nextLiveUrl)).toBe(true);
  });
});
