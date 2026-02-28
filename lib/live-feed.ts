import { querySources } from "@/lib/query";
import { pick, type Language } from "@/lib/i18n";
import type { LiveMessage, VerificationStatus } from "@/lib/types";

interface SourceProbeResult {
  version?: string;
  checkedAt: string;
}

interface InternalMessage {
  id: string;
  timestamp: string;
  source_id?: string;
  source_url?: string;
  type: "system" | "source_update";
  verification_status: VerificationStatus;
  text_zh: string;
  text_en: string;
}

const MAX_MESSAGES = 120;
const POLL_INTERVAL_MS = 60_000;

function stableId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

async function probeSource(url: string): Promise<SourceProbeResult> {
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

class LiveFeedService {
  private initialized = false;
  private timer: NodeJS.Timeout | null = null;
  private messages: InternalMessage[] = [];
  private sourceVersions = new Map<string, string>();
  private version = 0;

  start(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.pushMessage({
      type: "system",
      verification_status: "verified",
      text_zh: "实时消息服务已启动，正在轮询可信来源更新。",
      text_en: "Live update service started. Polling trusted sources for changes."
    });

    void this.refresh();
    this.timer = setInterval(() => {
      void this.refresh();
    }, POLL_INTERVAL_MS);
  }

  async refresh(): Promise<void> {
    const sources = querySources();

    await Promise.all(
      sources.map(async (source) => {
        const probe = await probeSource(source.url);
        if (!probe.version) {
          return;
        }

        const previousVersion = this.sourceVersions.get(source.url);
        if (!previousVersion) {
          this.sourceVersions.set(source.url, probe.version);
          return;
        }

        if (previousVersion === probe.version) {
          return;
        }

        this.sourceVersions.set(source.url, probe.version);
        this.pushMessage({
          source_id: source.id,
          source_url: source.url,
          type: "source_update",
          verification_status: "verified",
          text_zh: `来源 ${source.id} 检测到更新（版本：${probe.version}）。`,
          text_en: `Source ${source.id} reported an update (version: ${probe.version}).`
        });
      })
    );
  }

  getVersion(): number {
    return this.version;
  }

  getMessages(lang: Language, limit = 30): LiveMessage[] {
    return this.messages.slice(0, limit).map((item) => ({
      id: item.id,
      timestamp: item.timestamp,
      source_id: item.source_id,
      source_url: item.source_url,
      type: item.type,
      verification_status: item.verification_status,
      text: pick(lang, item.text_zh, item.text_en)
    }));
  }

  private pushMessage(input: {
    source_id?: string;
    source_url?: string;
    type: "system" | "source_update";
    verification_status: VerificationStatus;
    text_zh: string;
    text_en: string;
  }): void {
    this.messages.unshift({
      id: stableId(input.type),
      timestamp: new Date().toISOString(),
      source_id: input.source_id,
      source_url: input.source_url,
      type: input.type,
      verification_status: input.verification_status,
      text_zh: input.text_zh,
      text_en: input.text_en
    });

    if (this.messages.length > MAX_MESSAGES) {
      this.messages.length = MAX_MESSAGES;
    }

    this.version += 1;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __warroomLiveFeedService__: LiveFeedService | undefined;
}

export function getLiveFeedService(): LiveFeedService {
  if (!globalThis.__warroomLiveFeedService__) {
    globalThis.__warroomLiveFeedService__ = new LiveFeedService();
  }
  return globalThis.__warroomLiveFeedService__;
}
