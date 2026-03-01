import { describe, expect, it } from "vitest";
import {
  countByVerification,
  queryDashboardWithLanguage,
  queryEvents,
  queryInfrastructure,
  querySources,
  querySocialMediaSources,
  queryStatements
} from "@/lib/query";

describe("query layer", () => {
  it("filters events by region and min confidence", () => {
    const events = queryEvents({ region: "tehran", min_confidence: "0.8" });

    expect(events.length).toBeGreaterThan(0);
    expect(events.every((event) => event.location.admin_level_2.toLowerCase().includes("tehran"))).toBe(true);
    expect(events.every((event) => event.confidence >= 0.8)).toBe(true);
  });

  it("filters events by verification status", () => {
    const events = queryEvents({ verification_status: "unverified" });
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((event) => event.verification_status === "unverified")).toBe(true);
  });

  it("filters statements by party", () => {
    const statements = queryStatements({ party: "UN" });
    expect(statements.length).toBe(1);
    expect(statements[0].party).toContain("UN");
  });

  it("returns only whitelisted sources", () => {
    const sources = querySources();
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.every((source) => source.url.includes("http"))).toBe(true);
  });

  it("returns trusted social media sources only", () => {
    const socialSources = querySocialMediaSources();
    expect(socialSources.length).toBeGreaterThan(0);
    expect(socialSources.every((source) => source.platform.length > 0)).toBe(true);
    expect(socialSources.every((source) => source.url.startsWith("http"))).toBe(true);
  });

  it("supports infrastructure region filtering", () => {
    const items = queryInfrastructure("访问速度");
    expect(items.some((item) => item.sector === "communications")).toBe(true);
  });

  it("counts by verification", () => {
    const counts = countByVerification(queryEvents({}));
    expect(counts.verified).toBeGreaterThan(0);
    expect(counts.unverified).toBeGreaterThan(0);
    expect(counts.contested).toBeGreaterThan(0);
  });

  it("builds dashboard payload for auto-refresh sections", () => {
    const payload = queryDashboardWithLanguage("en");
    expect(payload.events.length).toBeGreaterThan(0);
    expect(payload.infrastructure.length).toBeGreaterThan(0);
    expect(payload.statements.length).toBeGreaterThan(0);
    expect(payload.factchecks.length).toBeGreaterThan(0);
    expect(payload.sources.length).toBeGreaterThan(0);
    expect(payload.social_media.length).toBeGreaterThan(0);
    expect(payload.meta.headline).toContain("As of");
  });
});
