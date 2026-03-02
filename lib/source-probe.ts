export interface SourceProbeResult {
  version?: string;
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
