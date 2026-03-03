import seed from "@/data/seed.json";
import { hasVersionChanged, probeSourceVersion, resolveApLiveUpdatesUrl } from "@/lib/source-probe";
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

export function switchSourceUrlInSnapshot(
  snapshot: SeedData,
  fromUrl: string,
  toUrl: string,
  observedAt: string
): number {
  if (!fromUrl || !toUrl || fromUrl === toUrl) {
    return 0;
  }
  let touched = 0;

  snapshot.sources.forEach((item) => {
    if (item.url === fromUrl) {
      item.url = toUrl;
      item.published_at = observedAt;
      touched += 1;
    }
  });

  snapshot.social_media.forEach((item) => {
    if (item.url === fromUrl) {
      item.url = toUrl;
      item.published_at = observedAt;
      touched += 1;
    }
    if (item.source_url === fromUrl) {
      item.source_url = toUrl;
      item.published_at = observedAt;
      touched += 1;
    }
  });

  snapshot.events.forEach((item) => {
    if (item.source_url === fromUrl) {
      item.source_url = toUrl;
      item.source_time = observedAt;
      touched += 1;
    }
  });

  snapshot.infrastructure.forEach((item) => {
    let evidenceTouched = false;
    item.evidence.forEach((evidence) => {
      if (evidence.source_url === fromUrl) {
        evidence.source_url = toUrl;
        evidence.source_time = observedAt;
        evidenceTouched = true;
        touched += 1;
      }
    });
    if (evidenceTouched) {
      item.last_updated = observedAt;
      touched += 1;
    }
  });

  snapshot.statements.forEach((item) => {
    if (item.source_url === fromUrl) {
      item.source_url = toUrl;
      item.timestamp = observedAt;
      touched += 1;
    }
  });

  snapshot.factchecks.forEach((item) => {
    item.sources.forEach((source) => {
      if (source.source_url === fromUrl) {
        source.source_url = toUrl;
        source.source_time = observedAt;
        touched += 1;
      }
    });
  });

  snapshot.regional_impacts.forEach((item) => {
    if (item.source_url === fromUrl) {
      item.source_url = toUrl;
      item.source_time = observedAt;
      touched += 1;
    }
  });

  snapshot.media.forEach((item) => {
    if (item.source_url === fromUrl) {
      item.source_url = toUrl;
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

interface TrackedSource {
  url: string;
  baselineVersion?: string;
}

function toMillis(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const millis = Date.parse(value);
  return Number.isNaN(millis) ? undefined : millis;
}

function keepNewer(existing: string | undefined, candidate: string | undefined): string | undefined {
  if (!candidate) {
    return existing;
  }
  if (!existing) {
    return candidate;
  }
  const existingMillis = toMillis(existing);
  const candidateMillis = toMillis(candidate);
  if (typeof existingMillis === "number" && typeof candidateMillis === "number") {
    return candidateMillis > existingMillis ? candidate : existing;
  }
  return candidate;
}

function collectTrackedSourceUrls(snapshot: SeedData): TrackedSource[] {
  const tracked = new Map<string, string | undefined>();
  const touch = (url?: string, observedAt?: string) => {
    if (!url) {
      return;
    }
    const existing = tracked.get(url);
    tracked.set(url, keepNewer(existing, observedAt));
  };

  snapshot.sources.forEach((item) => touch(item.url, item.published_at));
  snapshot.social_media.forEach((item) => {
    touch(item.url, item.published_at);
    touch(item.source_url, item.published_at);
  });
  snapshot.events.forEach((item) => touch(item.source_url, item.source_time));
  snapshot.infrastructure.forEach((item) => item.evidence.forEach((evidence) => touch(evidence.source_url, evidence.source_time)));
  snapshot.statements.forEach((item) => touch(item.source_url, item.timestamp));
  snapshot.factchecks.forEach((item) => item.sources.forEach((source) => touch(source.source_url, source.source_time)));
  snapshot.regional_impacts.forEach((item) => touch(item.source_url, item.source_time));
  snapshot.media.forEach((item) => touch(item.source_url, item.source_time));

  return Array.from(tracked.entries()).map(([url, baselineVersion]) => ({
    url,
    baselineVersion
  }));
}

function findAnyApLiveUrl(snapshot: SeedData): string | undefined {
  const isApLive = (value?: string): value is string =>
    typeof value === "string" && value.includes("apnews.com/live/");

  for (const item of snapshot.sources) {
    if (isApLive(item.url)) return item.url;
  }
  for (const item of snapshot.events) {
    if (isApLive(item.source_url)) return item.source_url;
  }
  for (const item of snapshot.infrastructure) {
    for (const evidence of item.evidence) {
      if (isApLive(evidence.source_url)) return evidence.source_url;
    }
  }
  for (const item of snapshot.statements) {
    if (isApLive(item.source_url)) return item.source_url;
  }
  for (const item of snapshot.factchecks) {
    for (const source of item.sources) {
      if (isApLive(source.source_url)) return source.source_url;
    }
  }
  for (const item of snapshot.regional_impacts) {
    if (isApLive(item.source_url)) return item.source_url;
  }
  for (const item of snapshot.media) {
    if (isApLive(item.source_url)) return item.source_url;
  }
  return undefined;
}

class DashboardRefreshService {
  private snapshot = cloneSeedData(seed as SeedData);
  private sourceVersions = new Map<string, string>();
  private started = false;
  private running = false;
  private lastRefreshAt = 0;

  start(): void {
    const isTestEnv =
      typeof process !== "undefined" &&
      typeof process.env !== "undefined" &&
      process.env.NODE_ENV === "test";

    if (this.started || isTestEnv) {
      return;
    }
    this.started = true;
  }

  getSnapshot(): SeedData {
    return cloneSeedData(this.snapshot);
  }

  async refreshOnce(force = false): Promise<number> {
    const now = Date.now();
    if (!force && now - this.lastRefreshAt < DASHBOARD_REFRESH_INTERVAL_MS) {
      return 0;
    }
    if (this.running) {
      return 0;
    }
    this.running = true;
    this.lastRefreshAt = now;
    let touched = 0;
    try {
      const apLiveUrl = findAnyApLiveUrl(this.snapshot);
      if (apLiveUrl) {
        const resolution = await resolveApLiveUpdatesUrl(apLiveUrl);
        if (resolution.url && resolution.url !== apLiveUrl) {
          touched += switchSourceUrlInSnapshot(this.snapshot, apLiveUrl, resolution.url, resolution.checkedAt);
          const oldVersion = this.sourceVersions.get(apLiveUrl);
          if (oldVersion) {
            this.sourceVersions.set(resolution.url, oldVersion);
          }
          this.sourceVersions.delete(apLiveUrl);
        }
      }

      const trackedSources = collectTrackedSourceUrls(this.snapshot);
      const probes = await Promise.all(
        trackedSources.map(async (source) => ({
          source,
          probe: await probeSourceVersion(source.url)
        }))
      );
      for (const { source, probe } of probes) {
        if (!probe.version) {
          continue;
        }
        const previousVersion = this.sourceVersions.get(source.url);
        if (!previousVersion) {
          this.sourceVersions.set(source.url, probe.version);
          if (!hasVersionChanged(probe.version, source.baselineVersion)) {
            continue;
          }
          touched += applySourceUpdateToSnapshot(this.snapshot, source.url, probe.checkedAt);
          continue;
        }
        if (!hasVersionChanged(probe.version, previousVersion)) {
          continue;
        }
        this.sourceVersions.set(source.url, probe.version);
        touched += applySourceUpdateToSnapshot(this.snapshot, source.url, probe.checkedAt);
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
