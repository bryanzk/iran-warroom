import { describe, expect, it } from "vitest";
import {
  getMetaWithLanguage,
  queryEventsWithLanguage,
  queryFactChecksWithLanguage,
  queryInfrastructureWithLanguage,
  querySourcesWithLanguage,
  querySocialMediaSourcesWithLanguage,
  queryStatementsWithLanguage
} from "@/lib/query";
import { parseLanguage } from "@/lib/i18n";

describe("i18n query layer", () => {
  it("parses language param with en default", () => {
    expect(parseLanguage("en")).toBe("en");
    expect(parseLanguage("zh")).toBe("zh");
    expect(parseLanguage(null)).toBe("en");
    expect(parseLanguage("fr")).toBe("en");
  });

  it("localizes event descriptions in english", () => {
    const events = queryEventsWithLanguage({}, "en");
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].description).toContain("Credible media");
  });

  it("localizes infrastructure evidence in english", () => {
    const data = queryInfrastructureWithLanguage(undefined, "en");
    const communications = data.find((item) => item.sector === "communications");
    expect(communications?.evidence[0].note).toContain("Access speed");
  });

  it("localizes statement summaries in english", () => {
    const statements = queryStatementsWithLanguage({}, "en");
    expect(statements.some((item) => item.summary.includes("restraint"))).toBe(true);
  });

  it("localizes fact-check text in english", () => {
    const list = queryFactChecksWithLanguage("en");
    expect(list[0].claim).toContain("casualty figures");
  });

  it("localizes source titles and meta headline in english", () => {
    const sources = querySourcesWithLanguage("en");
    const meta = getMetaWithLanguage("en");

    expect(sources.length).toBeGreaterThan(0);
    expect(meta.headline).toContain("As of");
  });

  it("localizes social media source titles in english", () => {
    const socialSources = querySocialMediaSourcesWithLanguage("en");
    expect(socialSources.length).toBeGreaterThan(0);
    expect(socialSources.some((source) => source.title.includes("The Iranian Ministry of Foreign Affairs"))).toBe(true);
  });
});
