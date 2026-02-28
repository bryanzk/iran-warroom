import { describe, expect, it } from "vitest";
import {
  countByVerification,
  queryEvents,
  queryInfrastructure,
  querySources,
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
});
