import { getSeedData } from "@/lib/data";
import { mergeSimilarEvents } from "@/lib/normalize";
import { isAllowedSourceUrl, isAllowedSocialSourceUrl, sanitizeQueryText } from "@/lib/safety";
import { localizeContent, type Language } from "@/lib/i18n";
import {
  assertValidEvent,
  assertValidInfrastructure,
  assertValidStatement
} from "@/lib/validators";
import type {
  Event,
  EventQuery,
  FactCheckItem,
  InfrastructureStatus,
  SeedData,
  Statement,
  VerificationStatus,
  SocialMediaSource
} from "@/lib/types";

const FRESHNESS_WINDOW_MS = 72 * 60 * 60 * 1000;

function toTimestamp(value: string): number | undefined {
  const millis = Date.parse(value);
  return Number.isNaN(millis) ? undefined : millis;
}

function isFreshWithinWindow(value: string, nowMs: number): boolean {
  const millis = toTimestamp(value);
  if (typeof millis !== "number") {
    return false;
  }
  if (millis > nowMs) {
    return false;
  }
  return nowMs - millis <= FRESHNESS_WINDOW_MS;
}

function withinRange(value: string, from?: string, to?: string): boolean {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return false;
  }
  if (from && time < new Date(from).getTime()) {
    return false;
  }
  if (to && time > new Date(to).getTime()) {
    return false;
  }
  return true;
}

export function queryEvents(query: EventQuery): Event[] {
  const data = getSeedData().events;
  const nowMs = Date.now();

  const from = query.from;
  const to = query.to;
  const region = query.region ? sanitizeQueryText(query.region).toLowerCase() : undefined;
  const minConfidence = query.min_confidence ? Number(query.min_confidence) : undefined;
  const text = query.q ? sanitizeQueryText(query.q).toLowerCase() : undefined;

  const filtered = data.filter((event) => {
    assertValidEvent(event);

    if (!isAllowedSourceUrl(event.source_url)) {
      return false;
    }

    if (!isFreshWithinWindow(event.source_time, nowMs)) {
      return false;
    }

    if (!withinRange(event.timestamp, from, to)) {
      return false;
    }

    if (region) {
      const haystack = `${event.location.admin_level_1} ${event.location.admin_level_2}`.toLowerCase();
      if (!haystack.includes(region)) {
        return false;
      }
    }

    if (query.category && event.category !== query.category) {
      return false;
    }

    if (query.verification_status && event.verification_status !== query.verification_status) {
      return false;
    }

    if (typeof minConfidence === "number" && event.confidence < minConfidence) {
      return false;
    }

    if (text) {
      const searchSpace = `${event.description} ${event.location.admin_level_1} ${event.location.admin_level_2}`.toLowerCase();
      if (!searchSpace.includes(text)) {
        return false;
      }
    }

    return true;
  });

  return mergeSimilarEvents(filtered);
}

function localizeEvent(event: Event, lang: Language): Event {
  return {
    ...event,
    description: localizeContent(event.description, lang)
  };
}

export function queryInfrastructure(region?: string): InfrastructureStatus[] {
  const items = getSeedData().infrastructure;
  const nowMs = Date.now();
  const sanitizedRegion = region ? sanitizeQueryText(region).toLowerCase() : undefined;

  const filtered = items
    .map((item) => {
      assertValidInfrastructure(item);

      if (!isFreshWithinWindow(item.last_updated, nowMs)) {
        return null;
      }

      const evidence = item.evidence.filter(
        (row) => isAllowedSourceUrl(row.source_url) && isFreshWithinWindow(row.source_time, nowMs)
      );
      if (evidence.length === 0) {
        return null;
      }

      if (
        sanitizedRegion &&
        !evidence.some((row) => (row.note || "").toLowerCase().includes(sanitizedRegion))
      ) {
        return null;
      }

      return {
        ...item,
        evidence
      };
    })
    .filter((item): item is InfrastructureStatus => item !== null);

  return filtered.sort((a, b) => {
    const aUnknown = a.status === "unknown";
    const bUnknown = b.status === "unknown";
    if (aUnknown !== bUnknown) {
      return aUnknown ? 1 : -1;
    }
    return b.last_updated.localeCompare(a.last_updated);
  });
}

function localizeInfrastructureItem(item: InfrastructureStatus, lang: Language): InfrastructureStatus {
  return {
    ...item,
    evidence: item.evidence.map((evidence) => ({
      ...evidence,
      title: localizeContent(evidence.title, lang),
      note: evidence.note ? localizeContent(evidence.note, lang) : evidence.note
    }))
  };
}

export function queryStatements(params: {
  party?: string;
  from?: string;
  to?: string;
}): Statement[] {
  const nowMs = Date.now();
  const partyFilter = params.party ? sanitizeQueryText(params.party).toLowerCase() : undefined;

  return getSeedData().statements.filter((statement) => {
    assertValidStatement(statement);

    if (!isAllowedSourceUrl(statement.source_url)) {
      return false;
    }

    if (!isFreshWithinWindow(statement.timestamp, nowMs)) {
      return false;
    }

    if (!withinRange(statement.timestamp, params.from, params.to)) {
      return false;
    }

    if (partyFilter && !statement.party.toLowerCase().includes(partyFilter)) {
      return false;
    }

    return true;
  });
}

function localizeStatement(statement: Statement, lang: Language): Statement {
  return {
    ...statement,
    summary: localizeContent(statement.summary, lang)
  };
}

export function queryFactChecks(): FactCheckItem[] {
  return getSeedData().factchecks;
}

function localizeFactCheck(item: FactCheckItem, lang: Language): FactCheckItem {
  return {
    ...item,
    claim: localizeContent(item.claim, lang),
    sources: item.sources.map((source) => ({
      ...source,
      value: localizeContent(source.value, lang)
    })),
    gaps: item.gaps.map((gap) => localizeContent(gap, lang)),
    next_verification_steps: item.next_verification_steps.map((step) => localizeContent(step, lang))
  };
}

export function querySources(): Array<{ id: string; publisher: string; title: string; url: string; published_at: string }> {
  const nowMs = Date.now();
  return getSeedData().sources.filter(
    (source) => isAllowedSourceUrl(source.url) && isFreshWithinWindow(source.published_at, nowMs)
  );
}

export function querySocialMediaSources(): SocialMediaSource[] {
  const nowMs = Date.now();
  return getSeedData().social_media
    .map((source) => ({
      ...source,
      url: source.url || source.source_url || "",
      source_url: source.source_url || source.url
    }))
    .filter(
      (source) =>
        isAllowedSocialSourceUrl(source.url) && isFreshWithinWindow(source.published_at, nowMs)
    );
}

function localizeSource(source: { id: string; publisher: string; title: string; url: string; published_at: string }, lang: Language) {
  return {
    ...source,
    title: localizeContent(source.title, lang)
  };
}

export function getMeta(): {
  updated_at: string;
  last_successful_snapshot: string;
  coverage_start: string;
  coverage_end: string;
  headline: string;
} {
  return getSeedData().meta;
}

export function queryEventsWithLanguage(query: EventQuery, lang: Language): Event[] {
  return queryEvents(query).map((event) => localizeEvent(event, lang));
}

export function queryInfrastructureWithLanguage(region: string | undefined, lang: Language): InfrastructureStatus[] {
  return queryInfrastructure(region).map((item) => localizeInfrastructureItem(item, lang));
}

export function queryStatementsWithLanguage(
  params: {
    party?: string;
    from?: string;
    to?: string;
  },
  lang: Language
): Statement[] {
  return queryStatements(params).map((statement) => localizeStatement(statement, lang));
}

export function queryFactChecksWithLanguage(lang: Language): FactCheckItem[] {
  return queryFactChecks().map((item) => localizeFactCheck(item, lang));
}

export function querySourcesWithLanguage(lang: Language): Array<{ id: string; publisher: string; title: string; url: string; published_at: string }> {
  return querySources().map((source) => localizeSource(source, lang));
}

function localizeSocialMediaSource(source: SocialMediaSource, lang: Language): SocialMediaSource {
  return {
    ...source,
    title: localizeContent(source.title, lang)
  };
}

export function querySocialMediaSourcesWithLanguage(lang: Language): SocialMediaSource[] {
  return querySocialMediaSources().map((source) => localizeSocialMediaSource(source, lang));
}

export function getMetaWithLanguage(lang: Language): {
  updated_at: string;
  last_successful_snapshot: string;
  coverage_start: string;
  coverage_end: string;
  headline: string;
} {
  const meta = getMeta();
  return {
    ...meta,
    headline: localizeContent(meta.headline, lang)
  };
}

function localizeRegionalImpacts(
  impacts: SeedData["regional_impacts"],
  lang: Language
): SeedData["regional_impacts"] {
  return impacts.map((impact) => ({
    ...impact,
    summary: localizeContent(impact.summary, lang)
  }));
}

function localizeMedia(
  media: SeedData["media"],
  lang: Language
): SeedData["media"] {
  return media.map((item) => ({
    ...item,
    title: localizeContent(item.title, lang),
    content_warning: localizeContent(item.content_warning, lang)
  }));
}

function localizeFaq(items: SeedData["faq"], lang: Language): SeedData["faq"] {
  return items.map((item) => ({
    question: localizeContent(item.question, lang),
    answer: localizeContent(item.answer, lang)
  }));
}

function queryRegionalImpacts(): SeedData["regional_impacts"] {
  const nowMs = Date.now();
  return getSeedData().regional_impacts.filter((impact) => isFreshWithinWindow(impact.source_time, nowMs));
}

function queryMedia(): SeedData["media"] {
  const nowMs = Date.now();
  return getSeedData().media.filter((item) => isFreshWithinWindow(item.source_time, nowMs));
}

export function queryDashboardWithLanguage(lang: Language): SeedData {
  const seed = getSeedData();
  const meta = getMetaWithLanguage(lang);
  const regionalImpacts = queryRegionalImpacts();
  const media = queryMedia();

  return {
    ...seed,
    meta: {
      ...seed.meta,
      updated_at: meta.updated_at,
      last_successful_snapshot: meta.last_successful_snapshot,
      coverage_start: meta.coverage_start,
      coverage_end: meta.coverage_end,
      headline: meta.headline
    },
    events: queryEventsWithLanguage({}, lang),
    infrastructure: queryInfrastructureWithLanguage(undefined, lang),
    statements: queryStatementsWithLanguage({}, lang),
    factchecks: queryFactChecksWithLanguage(lang),
    sources: querySourcesWithLanguage(lang),
    social_media: querySocialMediaSourcesWithLanguage(lang),
    regional_impacts: localizeRegionalImpacts(regionalImpacts, lang),
    media: localizeMedia(media, lang),
    faq: localizeFaq(seed.faq, lang)
  };
}

export function countByVerification(events: Event[]): Record<VerificationStatus, number> {
  return events.reduce(
    (acc, event) => {
      acc[event.verification_status] += 1;
      return acc;
    },
    { verified: 0, unverified: 0, contested: 0 }
  );
}
