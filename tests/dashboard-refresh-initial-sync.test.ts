import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/source-probe", async () => {
  const actual = await vi.importActual<typeof import("@/lib/source-probe")>("@/lib/source-probe");
  return {
    ...actual,
    probeSourceVersion: vi.fn()
  };
});

import { getDashboardRefreshService } from "@/lib/dashboard-refresh";
import { probeSourceVersion } from "@/lib/source-probe";

describe("dashboard initial sync refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.__warroomDashboardRefreshService__ = undefined;
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
});
