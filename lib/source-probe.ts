export interface SourceProbeResult {
  version?: string;
  checkedAt: string;
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

export async function probeSourceVersion(url: string): Promise<SourceProbeResult> {
  const checkedAt = new Date().toISOString();

  try {
    const headResponse = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store"
    });

    const etag = headResponse.headers.get("etag") || undefined;
    const lastModified = headResponse.headers.get("last-modified") || undefined;

    if (etag || lastModified) {
      return { version: etag || lastModified, checkedAt };
    }
  } catch {
    // Fallback to GET parsing.
  }

  try {
    const getResponse = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });

    const text = await getResponse.text();
    return { version: extractVersionFromHtml(text), checkedAt };
  } catch {
    return { checkedAt };
  }
}
