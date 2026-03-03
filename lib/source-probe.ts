export interface SourceProbeResult {
  version?: string;
  checkedAt: string;
  status?: number;
  error?: string;
}

export interface ApLiveResolutionResult {
  url?: string;
  checkedAt: string;
  status?: number;
  error?: string;
}

const PROBE_TIMEOUT_MS = 8_000;
const PROBE_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (compatible; WarRoomBot/1.0; +https://mewarroom.info)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
};

function parseIsoTime(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const millis = Date.parse(value);
  return Number.isNaN(millis) ? undefined : millis;
}

export function hasVersionChanged(currentVersion: string, referenceVersion?: string): boolean {
  if (!referenceVersion) {
    return false;
  }

  const currentTime = parseIsoTime(currentVersion);
  const referenceTime = parseIsoTime(referenceVersion);

  if (typeof currentTime === "number" && typeof referenceTime === "number") {
    return currentTime > referenceTime;
  }

  return currentVersion !== referenceVersion;
}

export function extractVersionFromHtml(html: string): string | undefined {
  const patterns = [
    /article:modified_time"\s+content="([^"]+)"/i,
    /dateModified"\s*:\s*"([^"]+)"/i,
    /dcterms\.date"\s+content="([^"]+)"/i,
    /meta\s+name="last-modified"\s+content="([^"]+)"/i
  ];

  for (const pattern of patterns) {
    const matched = html.match(pattern);
    if (matched?.[1]) {
      return matched[1];
    }
  }

  return undefined;
}

function stripTags(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeApLiveUrl(rawHref: string): string | undefined {
  try {
    const normalized = new URL(rawHref, "https://apnews.com").toString();
    const parsed = new URL(normalized);
    if (parsed.host !== "apnews.com") {
      return undefined;
    }
    if (!parsed.pathname.startsWith("/live/")) {
      return undefined;
    }
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function parseTrailingDateScore(url: string): number {
  const match = url.match(/-(\d{2})-(\d{2})-(\d{4})\/?$/);
  if (!match) {
    return 0;
  }
  const [, month, day, year] = match;
  const scoreDate = Date.parse(`${year}-${month}-${day}T00:00:00Z`);
  return Number.isNaN(scoreDate) ? 0 : scoreDate;
}

export function extractPreferredApLiveUrlFromHtml(html: string): string | undefined {
  const scored = new Map<string, number>();
  const push = (url: string, score: number) => {
    const current = scored.get(url) ?? -Infinity;
    if (score > current) {
      scored.set(url, score);
    }
  };

  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const canonical = canonicalMatch?.[1] ? normalizeApLiveUrl(canonicalMatch[1]) : undefined;
  if (canonical) {
    push(canonical, 150 + parseTrailingDateScore(canonical));
  }

  const anchorPattern = /<a[^>]+href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi;
  let matched: RegExpExecArray | null;
  while ((matched = anchorPattern.exec(html)) !== null) {
    const href = normalizeApLiveUrl(matched[1]);
    if (!href) {
      continue;
    }

    const text = stripTags(matched[2]).toLowerCase();
    let score = 100 + parseTrailingDateScore(href);
    if (text.includes("live")) {
      score += 20;
    }
    if (text.includes("update")) {
      score += 40;
    }
    if (text.includes("iran")) {
      score += 40;
    }
    if (href.includes("/iran-")) {
      score += 50;
    }
    push(href, score);
  }

  if (scored.size === 0) {
    return undefined;
  }

  return Array.from(scored.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

function fingerprint(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `body:${(hash >>> 0).toString(16)}`;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), PROBE_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      headers: {
        ...PROBE_HEADERS,
        ...(init.headers || {})
      },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveApLiveUpdatesUrl(entryUrl: string): Promise<ApLiveResolutionResult> {
  const checkedAt = new Date().toISOString();
  const normalizedEntryUrl = normalizeApLiveUrl(entryUrl);
  if (!normalizedEntryUrl) {
    return { checkedAt, error: "not_ap_live_url" };
  }

  try {
    const response = await fetchWithTimeout(normalizedEntryUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });
    const html = await response.text();
    return {
      url: extractPreferredApLiveUrlFromHtml(html),
      checkedAt,
      status: response.status
    };
  } catch {
    return { checkedAt, error: "fetch_failed" };
  }
}

export async function probeSourceVersion(url: string): Promise<SourceProbeResult> {
  const checkedAt = new Date().toISOString();

  try {
    const headResponse = await fetchWithTimeout(url, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store"
    });

    const etag = headResponse.headers.get("etag") || undefined;
    const lastModified = headResponse.headers.get("last-modified") || undefined;

    if (etag || lastModified) {
      return { version: etag || lastModified, checkedAt, status: headResponse.status };
    }
  } catch {
    // Fallback to GET parsing.
  }

  try {
    const getResponse = await fetchWithTimeout(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });

    const text = await getResponse.text();
    const marker = extractVersionFromHtml(text);
    if (marker) {
      return { version: marker, checkedAt, status: getResponse.status };
    }

    if (getResponse.ok) {
      return { version: fingerprint(text.slice(0, 20000)), checkedAt, status: getResponse.status };
    }

    return { checkedAt, status: getResponse.status };
  } catch {
    return { checkedAt, error: "fetch_failed" };
  }
}
