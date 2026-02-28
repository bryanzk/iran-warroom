import { describe, expect, it } from "vitest";
import { getSeedData } from "@/lib/data";
import {
  assertValidEvent,
  assertValidInfrastructure,
  assertValidStatement
} from "@/lib/validators";

describe("schema validation", () => {
  it("validates all seed events", () => {
    const seed = getSeedData();
    for (const event of seed.events) {
      expect(() => assertValidEvent(event)).not.toThrow();
    }
  });

  it("validates infrastructure status entries", () => {
    const seed = getSeedData();
    for (const item of seed.infrastructure) {
      expect(() => assertValidInfrastructure(item)).not.toThrow();
    }
  });

  it("validates statement entries", () => {
    const seed = getSeedData();
    for (const statement of seed.statements) {
      expect(() => assertValidStatement(statement)).not.toThrow();
    }
  });

  it("rejects event without source_url", () => {
    expect(() =>
      assertValidEvent({
        id: "evt_invalid",
        timestamp: "2026-02-28T00:00:00Z",
        location: {
          lat: 0,
          lng: 0,
          country: "Iran",
          admin_level_1: "A",
          admin_level_2: "B"
        },
        category: "other",
        description: "missing source",
        source_time: "2026-02-28T00:00:00Z",
        confidence: 0.4,
        verification_status: "unverified"
      })
    ).toThrow(/Invalid Event/);
  });
});
