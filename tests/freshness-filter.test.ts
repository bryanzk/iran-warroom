import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  queryDashboardWithLanguage,
  queryEvents,
  queryInfrastructure,
  querySocialMediaSources,
  querySources,
  queryStatements
} from "@/lib/query";

describe("freshness filter and infrastructure ordering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("filters stale records globally with a 72h window", () => {
    vi.setSystemTime(new Date("2026-03-20T12:00:00Z"));

    expect(queryEvents({})).toHaveLength(0);
    expect(queryInfrastructure()).toHaveLength(0);
    expect(queryStatements({})).toHaveLength(0);
    expect(querySources()).toHaveLength(0);
    expect(querySocialMediaSources()).toHaveLength(0);

    const dashboard = queryDashboardWithLanguage("en");
    expect(dashboard.events).toHaveLength(0);
    expect(dashboard.infrastructure).toHaveLength(0);
    expect(dashboard.statements).toHaveLength(0);
    expect(dashboard.sources).toHaveLength(0);
    expect(dashboard.social_media).toHaveLength(0);
    expect(dashboard.regional_impacts).toHaveLength(0);
    expect(dashboard.media).toHaveLength(0);

    // factchecks/faq are intentionally not freshness-filtered
    expect(dashboard.factchecks.length).toBeGreaterThan(0);
    expect(dashboard.faq.length).toBeGreaterThan(0);
  });

  it("keeps freshness filtering even when from/to is explicitly provided", () => {
    vi.setSystemTime(new Date("2026-03-20T12:00:00Z"));

    const events = queryEvents({
      from: "2026-02-01T00:00:00Z",
      to: "2026-03-19T23:59:59Z"
    });

    expect(events).toHaveLength(0);
  });

  it("orders infrastructure with unknown status at the end", () => {
    vi.setSystemTime(new Date("2026-03-03T15:00:00Z"));

    const items = queryInfrastructure();
    expect(items.length).toBeGreaterThan(0);

    const firstUnknownIndex = items.findIndex((item) => item.status === "unknown");
    expect(firstUnknownIndex).toBeGreaterThanOrEqual(0);

    const tail = items.slice(firstUnknownIndex);
    expect(tail.every((item) => item.status === "unknown")).toBe(true);
  });
});
