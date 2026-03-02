import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/query", () => ({
  querySources: vi.fn(),
  querySocialMediaSources: vi.fn()
}));

vi.mock("@/lib/source-probe", async () => {
  const actual = await vi.importActual<typeof import("@/lib/source-probe")>("@/lib/source-probe");
  return {
    ...actual,
    probeSourceVersion: vi.fn()
  };
});

import { getLiveFeedService } from "@/lib/live-feed";
import { querySocialMediaSources, querySources } from "@/lib/query";
import { probeSourceVersion } from "@/lib/source-probe";

describe("live feed refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.__warroomLiveFeedService__ = undefined;
  });

  it("emits source_update on first refresh when probe version differs from seed baseline", async () => {
    vi.mocked(querySources).mockReturnValue([
      {
        id: "S1",
        publisher: "AP",
        title: "Example source",
        url: "https://example.com/source",
        published_at: "2026-02-28T06:19:16Z"
      }
    ]);
    vi.mocked(querySocialMediaSources).mockReturnValue([]);
    vi.mocked(probeSourceVersion).mockResolvedValue({
      version: "etag:new-version",
      checkedAt: "2026-03-02T15:50:00Z",
      status: 200
    });

    const service = getLiveFeedService();
    await service.refresh();
    await service.refresh();

    const messages = service.getMessages("en", 30);
    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe("source_update");
    expect(messages[0].source_url).toBe("https://example.com/source");
  });
});
