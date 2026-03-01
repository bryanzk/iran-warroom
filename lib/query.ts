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
  const sanitizedRegion = region ? sanitizeQueryText(region).toLowerCase() : undefined;

  return items.filter((item) => {
    assertValidInfrastructure(item);

    if (!item.evidence.every((evidence) => isAllowedSourceUrl(evidence.source_url))) {
      return false;
    }

    if (!sanitizedRegion) {
      return true;
    }

    return item.evidence.some((evidence) => (evidence.note || "").toLowerCase().includes(sanitizedRegion));
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
  const partyFilter = params.party ? sanitizeQueryText(params.party).toLowerCase() : undefined;

  return getSeedData().statements.filter((statement) => {
    assertValidStatement(statement);

    if (!isAllowedSourceUrl(statement.source_url)) {
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
  return getSeedData().sources.filter((source) => isAllowedSourceUrl(source.url));
}

export function querySocialMediaSources(): SocialMediaSource[] {
  return getSeedData().social_media
    .map((source) => ({
      ...source,
      url: source.url || source.source_url || "",
      source_url: source.source_url || source.url
    }))
    .filter((source) => isAllowedSocialSourceUrl(source.url));
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

export function queryDashboardWithLanguage(lang: Language): SeedData {
  const seed = getSeedData();
  const meta = getMetaWithLanguage(lang);

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
    regional_impacts: localizeRegionalImpacts(seed.regional_impacts, lang),
    media: localizeMedia(seed.media, lang),
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
