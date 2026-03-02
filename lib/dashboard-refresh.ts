import seed from "@/data/seed.json";
import { probeSourceVersion } from "@/lib/source-probe";
import type { SeedData } from "@/lib/types";

const DASHBOARD_REFRESH_INTERVAL_MS = 60_000;

function cloneSeedData(input: SeedData): SeedData {
  return JSON.parse(JSON.stringify(input)) as SeedData;
}

export function applySourceUpdateToSnapshot(
  snapshot: SeedData,
  sourceUrl: string,
  observedAt: string
): number {
  let touched = 0;

  snapshot.sources.forEach((item) => {
    if (item.url === sourceUrl && item.published_at !== observedAt) {
      item.published_at = observedAt;
      touched += 1;
    }
  });

  snapshot.social_media.forEach((item) => {
    const candidateUrl = item.url || item.source_url;
    if (candidateUrl === sourceUrl && item.published_at !== observedAt) {
      item.published_at = observedAt;
      touched += 1;
    }
  });

  snapshot.events.forEach((item) => {
    if (item.source_url === sourceUrl && item.source_time !== observedAt) {
      item.source_time = observedAt;
      touched += 1;
    }
  });

  snapshot.infrastructure.forEach((item) => {
    let evidenceTouched = false;
    item.evidence.forEach((evidence) => {
      if (evidence.source_url === sourceUrl && evidence.source_time !== observedAt) {
        evidence.source_time = observedAt;
        evidenceTouched = true;
        touched += 1;
      }
    });
    if (evidenceTouched && item.last_updated !== observedAt) {
      item.last_updated = observedAt;
      touched += 1;
    }
  });

  snapshot.statements.forEach((item) => {
    if (item.source_url === sourceUrl && item.timestamp !== observedAt) {
      item.timestamp = observedAt;
      touched += 1;
    }
  });

  snapshot.factchecks.forEach((item) => {
    item.sources.forEach((source) => {
      if (source.source_url === sourceUrl && source.source_time !== observedAt) {
        source.source_time = observedAt;
        touched += 1;
      }
    });
  });

  snapshot.regional_impacts.forEach((item) => {
    if (item.source_url === sourceUrl && item.source_time !== observedAt) {
      item.source_time = observedAt;
      touched += 1;
    }
  });

  snapshot.media.forEach((item) => {
    if (item.source_url === sourceUrl && item.source_time !== observedAt) {
      item.source_time = observedAt;
      touched += 1;
    }
  });

  if (touched > 0) {
    snapshot.meta.updated_at = observedAt;
    snapshot.meta.last_successful_snapshot = observedAt;
    snapshot.meta.coverage_end = observedAt;
  }

  return touched;
}

function collectTrackedSourceUrls(snapshot: SeedData): string[] {
  const urls = new Set<string>();

  snapshot.sources.forEach((item) => urls.add(item.url));
  snapshot.social_media.forEach((item) => {
    if (item.url) urls.add(item.url);
    if (item.source_url) urls.add(item.source_url);
  });
  snapshot.events.forEach((item) => urls.add(item.source_url));
  snapshot.infrastructure.forEach((item) => item.evidence.forEach((evidence) => urls.add(evidence.source_url)));
  snapshot.statements.forEach((item) => urls.add(item.source_url));
  snapshot.factchecks.forEach((item) => item.sources.forEach((source) => urls.add(source.source_url)));
  snapshot.regional_impacts.forEach((item) => urls.add(item.source_url));
  snapshot.media.forEach((item) => urls.add(item.source_url));

  return Array.from(urls.values());
}

class DashboardRefreshService {
  private snapshot = cloneSeedData(seed as SeedData);
  private sourceVersions = new Map<string, string>();
  private started = false;
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  start(): void {
    if (this.started || process.env.NODE_ENV === "test") {
      return;
    }
    this.started = true;
    void this.refreshOnce();
    this.timer = setInterval(() => {
      void this.refreshOnce();
    }, DASHBOARD_REFRESH_INTERVAL_MS);
  }

  getSnapshot(): SeedData {
    return cloneSeedData(this.snapshot);
  }

  async refreshOnce(): Promise<number> {
    if (this.running) {
      return 0;
    }
    this.running = true;
    let touched = 0;
    try {
      const urls = collectTrackedSourceUrls(this.snapshot);
      for (const url of urls) {
        const probe = await probeSourceVersion(url);
        if (!probe.version) {
          continue;
        }
        const previousVersion = this.sourceVersions.get(url);
        if (!previousVersion) {
          this.sourceVersions.set(url, probe.version);
          continue;
        }
        if (previousVersion === probe.version) {
          continue;
        }
        this.sourceVersions.set(url, probe.version);
        touched += applySourceUpdateToSnapshot(this.snapshot, url, probe.checkedAt);
      }
      return touched;
    } finally {
      this.running = false;
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __warroomDashboardRefreshService__: DashboardRefreshService | undefined;
}

export function getDashboardRefreshService(): DashboardRefreshService {
  if (!globalThis.__warroomDashboardRefreshService__) {
    globalThis.__warroomDashboardRefreshService__ = new DashboardRefreshService();
  }
  return globalThis.__warroomDashboardRefreshService__;
}
