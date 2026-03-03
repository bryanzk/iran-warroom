import { querySources, querySocialMediaSources } from "@/lib/query";
import { localizeContent, pick, type Language } from "@/lib/i18n";
import type { LiveMessage, VerificationStatus } from "@/lib/types";
import { extractVersionFromHtml, hasVersionChanged, probeSourceVersion } from "@/lib/source-probe";

export { extractVersionFromHtml };

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

class LiveFeedService {
  private initialized = false;
  private messages: InternalMessage[] = [];
  private sourceVersions = new Map<string, string>();
  private refreshing: Promise<void> | null = null;
  private lastRefreshedAt = 0;
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
  }

  async refresh(force = false): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastRefreshedAt < POLL_INTERVAL_MS) {
      return;
    }

    if (this.refreshing) {
      await this.refreshing;
      return;
    }

    this.refreshing = this.runRefresh();
    try {
      await this.refreshing;
      this.lastRefreshedAt = Date.now();
    } finally {
      this.refreshing = null;
    }
  }

  private async runRefresh(): Promise<void> {
    const trustedSources = [
      ...querySources().map((source) => ({
        id: source.id,
        url: source.url,
        platform: source.publisher,
        label_zh: localizeContent(source.title, "zh"),
        label_en: localizeContent(source.title, "en"),
        baselineVersion: source.published_at
      })),
      ...querySocialMediaSources().map((source) => ({
        id: source.id,
        url: source.url,
        platform: source.platform,
        label_zh: localizeContent(source.title, "zh"),
        label_en: localizeContent(source.title, "en"),
        baselineVersion: source.published_at
      }))
    ];

    const uniqueSources = new Map(
      trustedSources.map((source) => [source.url, source])
    );

    await Promise.all(
      Array.from(uniqueSources.values()).map(async (source) => {
        const probe = await probeSourceVersion(source.url);
        if (!probe.version) {
          return;
        }

        const previousVersion = this.sourceVersions.get(source.url);
        if (!previousVersion) {
          this.sourceVersions.set(source.url, probe.version);
          if (!hasVersionChanged(probe.version, source.baselineVersion)) {
            return;
          }
        } else if (!hasVersionChanged(probe.version, previousVersion)) {
          return;
        }
        this.sourceVersions.set(source.url, probe.version);
        const platformLabel = source.platform ? ` [${source.platform}]` : "";
        const sourceLabelZh = source.label_zh ? ` — ${source.label_zh}` : "";
        const sourceLabelEn = source.label_en ? ` — ${source.label_en}` : "";
        this.pushMessage({
          source_id: `${source.id}${platformLabel}`,
          source_url: source.url,
          type: "source_update",
          verification_status: "verified",
          text_zh: `来源 ${source.id}${platformLabel}${sourceLabelZh} 检测到内容更新。`,
          text_en: `${source.id}${platformLabel}${sourceLabelEn} published new content.`
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
