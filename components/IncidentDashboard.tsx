"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Broadcast, ClockCountdown, MapPin, Pulse, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { FilterBar } from "@/components/FilterBar";
import { RealtimeTicker } from "@/components/RealtimeTicker";
import { Timeline } from "@/components/Timeline";
import { MapPins } from "@/components/MapPins";
import { LocationList } from "@/components/LocationList";
import { StatusCards } from "@/components/StatusCards";
import { SourceDrawer } from "@/components/SourceDrawer";
import { StatementCompare } from "@/components/StatementCompare";
import { SocialMediaPanel } from "@/components/SocialMediaPanel";
import { FactCheckPanel } from "@/components/FactCheckPanel";
import { MediaGallery } from "@/components/MediaGallery";
import { FAQ } from "@/components/FAQ";
import { ConflictNumbersPanel } from "@/components/ConflictNumbersPanel";
import { LiveUpdatePanel } from "@/components/LiveUpdatePanel";
import { localizeContent, localizeSector, pick, type Language } from "@/lib/i18n";
import type { Event, InfrastructureStatus, SeedData } from "@/lib/types";

interface IncidentDashboardProps {
  data: SeedData;
}

const AUTO_REFRESH_MS = 15000;

function averageConfidence(events: Event[]): string {
  if (events.length === 0) return "0.00";
  const avg = events.reduce((acc, item) => acc + item.confidence, 0) / events.length;
  return avg.toFixed(2);
}

function formatUtcStamp(value: string | undefined): string {
  if (!value) {
    return "N/A";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.toISOString().slice(0, 19)} UTC`;
}

function formatCoverageWindow(start: string | undefined, end: string | undefined): string {
  if (!start || !end) {
    return "N/A";
  }

  return `${formatUtcStamp(start)} → ${formatUtcStamp(end)}`;
}

function formatFreshnessAge(ageHours: number): string {
  if (ageHours < 1) {
    return `${Math.max(1, Math.round(ageHours * 60))}m`;
  }
  if (ageHours < 24) {
    return `${Math.round(ageHours)}h`;
  }
  const days = ageHours / 24;
  return `${days >= 10 ? days.toFixed(0) : days.toFixed(1)}d`;
}

function toSafeHttpUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function IncidentDashboard({ data }: IncidentDashboardProps) {
  const [dashboardData, setDashboardData] = useState<SeedData>(data);
  const [language, setLanguage] = useState<Language>("en");
  const [darkMode, setDarkMode] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(data.events[0]?.id);
  const [syncState, setSyncState] = useState<"syncing" | "live" | "error">("syncing");
  const [drawer, setDrawer] = useState<{ open: boolean; title: string; sources: InfrastructureStatus["evidence"] }>({
    open: false,
    title: "",
    sources: []
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let activeController: AbortController | undefined;

    async function pullDashboard() {
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;

      try {
        const response = await fetch(`/api/dashboard?lang=${language}`, {
          cache: "no-store",
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json = (await response.json()) as { data: SeedData };
        if (cancelled) {
          return;
        }
        setDashboardData(json.data);
        setSyncState("live");
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setSyncState("error");
      }
    }

    void pullDashboard();
    timer = setInterval(() => {
      void pullDashboard();
    }, AUTO_REFRESH_MS);

    return () => {
      cancelled = true;
      activeController?.abort();
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [language]);

  useEffect(() => {
    if (selectedEventId && dashboardData.events.some((item) => item.id === selectedEventId)) {
      return;
    }
    setSelectedEventId(dashboardData.events[0]?.id);
  }, [dashboardData.events, selectedEventId]);

  const defaultFilters = {
    region: "",
    category: "all" as "all" | Event["category"],
    verificationStatus: "all" as "all" | Event["verification_status"],
    minConfidence: 0,
    keyword: ""
  };
  const [filters, setFilters] = useState(defaultFilters);
  const clearFilters = () => setFilters(defaultFilters);

  const events = useMemo(() => {
    return dashboardData.events.filter((event) => {
      if (filters.category !== "all" && event.category !== filters.category) return false;
      if (filters.verificationStatus !== "all" && event.verification_status !== filters.verificationStatus) return false;
      if (event.confidence < filters.minConfidence) return false;

      if (filters.region.trim()) {
        const haystack = `${event.location.admin_level_1} ${event.location.admin_level_2}`.toLowerCase();
        if (!haystack.includes(filters.region.toLowerCase().trim())) return false;
      }

      if (filters.keyword.trim()) {
        const searchable = `${event.description} ${localizeContent(event.description, "en")} ${event.location.admin_level_2}`.toLowerCase();
        if (!searchable.includes(filters.keyword.toLowerCase().trim())) return false;
      }

      return true;
    });
  }, [dashboardData.events, filters]);

  const selectedEvent = events.find((event) => event.id === selectedEventId) || events[0];
  const timelineEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const sourceDelta = b.source_time.localeCompare(a.source_time);
        if (sourceDelta !== 0) {
          return sourceDelta;
        }
        return b.timestamp.localeCompare(a.timestamp);
      }),
    [events]
  );

  const metrics = useMemo(() => {
    const verified = events.filter((item) => item.verification_status === "verified").length;
    const contested = events.filter((item) => item.verification_status === "contested").length;
    const unverified = events.filter((item) => item.verification_status === "unverified").length;

    return {
      verified,
      contested,
      unverified,
      avgConfidence: averageConfidence(events),
      latestSourceTime: events
        .map((item) => item.source_time)
        .sort((a, b) => b.localeCompare(a))[0]
    };
  }, [events]);

  const freshness = useMemo(() => {
    const updatedAt = Date.parse(dashboardData.meta.updated_at);
    if (Number.isNaN(updatedAt)) {
      return {
        tone: "neutral" as const,
        label: pick(language, "新鲜度未知", "Freshness unavailable"),
        detail: pick(language, "无法解析更新时间", "Updated timestamp could not be parsed")
      };
    }

    const ageHours = Math.max(0, (nowMs - updatedAt) / 3_600_000);
    const isStale = ageHours > 72;
    const ageLabel = formatFreshnessAge(ageHours);

    return {
      tone: isStale ? ("stale" as const) : ("fresh" as const),
      label: isStale ? pick(language, "已过期", "Stale") : pick(language, "新鲜", "Fresh"),
      detail: isStale
        ? pick(language, `${ageLabel}，超出 72 小时新鲜度窗口`, `${ageLabel} old, beyond the 72h freshness window`)
        : pick(language, `${ageLabel}，仍在 72 小时新鲜度窗口内`, `${ageLabel} old, still within the 72h freshness window`)
    };
  }, [dashboardData.meta.updated_at, language, nowMs]);

  const shellStats = [
    {
      label: pick(language, "更新于", "Updated"),
      value: formatUtcStamp(dashboardData.meta.updated_at),
      tone: "accent"
    },
    {
      label: pick(language, "最近成功快照", "Last successful snapshot"),
      value: formatUtcStamp(dashboardData.meta.last_successful_snapshot),
      tone: "calm"
    },
    {
      label: pick(language, "覆盖起点", "Coverage start"),
      value: formatUtcStamp(dashboardData.meta.coverage_start),
      tone: "neutral"
    },
    {
      label: pick(language, "覆盖终点", "Coverage end"),
      value: formatUtcStamp(dashboardData.meta.coverage_end),
      tone: "neutral"
    }
  ] as const;

  const quickOverview = [
    {
      label: pick(language, "来源", "Sources"),
      value: dashboardData.sources.length,
      detail: pick(language, "已对齐可信来源", "Trusted sources aligned")
    },
    {
      label: pick(language, "事件", "Events"),
      value: events.length,
      detail: pick(language, "按筛选结果统计", "Count after filters")
    },
    {
      label: pick(language, "基础设施", "Infrastructure"),
      value: dashboardData.infrastructure.length,
      detail: pick(language, "受影响部门视图", "Sector-level view")
    },
    {
      label: pick(language, "核验分布", "Verification mix"),
      value: `${metrics.verified}/${metrics.contested}/${metrics.unverified}`,
      detail: pick(language, "已核验 / 争议 / 未验证", "Verified / contested / unverified")
    }
  ] as const;

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.07 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 100, damping: 20 }
    }
  };

  return (
    <main className="dashboard-scene">
      <div className="mx-auto max-w-[1480px] px-4 py-4 md:py-6">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
          animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="tone-strip mb-3 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs"
        >
          <span className="font-semibold tracking-[0.12em] uppercase">
            {pick(language, "开源情报追踪 · 伊朗冲突态势", "Open-Source Intelligence · Iran Conflict Watch")}
          </span>
          <span className="hidden h-4 w-px bg-current/20 md:block" />
          <span className="max-w-[72ch] text-[11px] opacity-80">
            {pick(language, "实时聚合公开来源数据，不代表任何官方立场", "Aggregates public sources in real time. Does not represent any official position.")}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-current/10 bg-white/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] dark:bg-black/10">
            <span className="live-dot" />
            {syncState === "live"
              ? pick(language, "同步活跃", "Live")
              : syncState === "syncing"
                ? pick(language, "同步中", "Syncing")
                : pick(language, "降级模式", "Degraded")}
          </span>
          <span className={`freshness-banner freshness-banner-${freshness.tone}`}>
            <span className="freshness-banner-label">{pick(language, "新鲜度状态", "Freshness state")}</span>
            <strong className="freshness-banner-value">{freshness.label}</strong>
            <span className="freshness-banner-detail">{freshness.detail}</span>
          </span>
        </motion.div>

        <div className="board-shell overflow-hidden p-3 md:p-4">
          <header className="board-hero signal-line pb-4">
            <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
              <div className="space-y-4">
                <div className="hero-eyebrow">
                  <span className="hero-eyebrow-tag">{pick(language, "情报简报", "Situation Brief")}</span>
                  <span className="hero-eyebrow-separator" />
                  <span>{pick(language, "Coverage-led review surface", "Coverage-led review surface")}</span>
                </div>

                <h1 className="display-font max-w-[14ch] text-[clamp(2.4rem,5vw,4.95rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-balance">
                  {pick(language, "伊朗空袭后态势总览", "Post-Strike Situation Overview: Iran")}
                </h1>

                <p className="max-w-[72ch] text-[0.98rem] leading-7 text-[color:var(--muted)] md:text-[1.03rem]">
                  {localizeContent(dashboardData.meta.headline, language)}
                </p>

                <div className={`freshness-banner freshness-banner-${freshness.tone}`}>
                  <span className="freshness-banner-label">{pick(language, "刷新健康", "Freshness health")}</span>
                  <strong className="freshness-banner-value">{freshness.label}</strong>
                  <span className="freshness-banner-detail">{freshness.detail}</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {shellStats.map((stat) => (
                    <article key={stat.label} className={`hero-stat hero-stat-${stat.tone}`}>
                      <span className="hero-stat-label">{stat.label}</span>
                      <span className="hero-stat-value">{stat.value}</span>
                    </article>
                  ))}
                </div>
              </div>

              <section className="hero-rail">
                <div className="section-kicker">
                  <Pulse size={14} weight="duotone" className="text-[color:var(--accent)]" />
                  {pick(language, "运行状态", "Run State")}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <article className="status-card status-card-highlight">
                    <span className="status-card-label">{pick(language, "自动刷新", "Auto refresh")}</span>
                    <span className="status-card-value">{syncState === "live" ? "15s" : "—"}</span>
                    <span className="status-card-note">
                      {pick(language, "客户端轮询已启用", "Client polling enabled")}
                    </span>
                  </article>
                  <article className="status-card">
                    <span className="status-card-label">{pick(language, "平均可信度", "Avg. confidence")}</span>
                    <span className="status-card-value">{metrics.avgConfidence}</span>
                    <span className="status-card-note">{pick(language, "当前筛选结果", "Current filtered set")}</span>
                  </article>
                </div>

                <div className="coverage-band">
                  <div className="section-kicker">
                    <ClockCountdown size={14} weight="duotone" className="text-[color:var(--accent)]" />
                    {pick(language, "覆盖窗口", "Coverage Window")}
                  </div>
                  <div className="coverage-band-row">
                    <div>
                      <span className="coverage-label">{pick(language, "起点", "Start")}</span>
                      <strong className="coverage-value">{formatUtcStamp(dashboardData.meta.coverage_start)}</strong>
                    </div>
                    <div>
                      <span className="coverage-label">{pick(language, "终点", "End")}</span>
                      <strong className="coverage-value">{formatUtcStamp(dashboardData.meta.coverage_end)}</strong>
                    </div>
                  </div>
                  <p className="coverage-footnote">{formatCoverageWindow(dashboardData.meta.coverage_start, dashboardData.meta.coverage_end)}</p>
                </div>
              </section>
            </div>

            <div className="overview-band mt-4">
              {quickOverview.map((item) => (
                <article key={item.label} className="overview-card">
                  <span className="overview-card-label">{item.label}</span>
                  <span className="overview-card-value">{item.value}</span>
                  <span className="overview-card-detail">{item.detail}</span>
                </article>
              ))}
            </div>
          </header>

          <div className="pt-3">
            <FilterBar
              filters={filters}
              onChange={setFilters}
              language={language}
              onLanguageChange={setLanguage}
              darkMode={darkMode}
              onDarkModeToggle={() => setDarkMode((prev) => !prev)}
            />
          </div>

          <motion.div
            className="mt-4 space-y-4"
            variants={containerVariants}
            initial={prefersReducedMotion ? false : "hidden"}
            animate={prefersReducedMotion ? false : "show"}
          >
            <motion.section variants={itemVariants} className="grid gap-4 xl:grid-cols-[1.34fr_1.18fr] 2xl:grid-cols-[1.22fr_1.28fr]">
              <section className="space-y-4 xl:pr-1">
                <div className="section-kicker">
                  <span className="section-kicker-line" />
                  {pick(language, "主工作区", "Primary Workbench")}
                </div>
                <section className="dense-block p-3">
                  <div className="mb-2 grid gap-2 md:grid-cols-3">
                    <article className="signal-line pb-2 md:pb-0 md:pr-2">
                      <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
                        <Broadcast size={13} /> {pick(language, "最新来源时间", "Latest Source Time")}
                      </p>
                      <p className="font-mono text-xs text-slate-700">{metrics.latestSourceTime || "N/A"}</p>
                    </article>
                    <article className="signal-line pb-2 md:pb-0 md:pr-2">
                      <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
                        <MapPin size={13} /> {pick(language, "覆盖地点", "Covered Locations")}
                      </p>
                      <p className="font-mono text-xs text-slate-700">{new Set(events.map((item) => item.location.admin_level_2)).size}</p>
                    </article>
                    <article>
                      <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
                        <ClockCountdown size={13} /> {pick(language, "选中事件", "Selected Event")}
                      </p>
                      <p className="truncate text-xs text-slate-700">{selectedEvent ? localizeContent(selectedEvent.description, language) : "N/A"}</p>
                    </article>
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <MapPins
                    events={events}
                    regionalImpacts={dashboardData.regional_impacts}
                    selectedEventId={selectedEvent?.id}
                    onSelect={setSelectedEventId}
                    language={language}
                  />
                  <LocationList events={events} language={language} />
                </section>

                <section className="grid gap-4 2xl:grid-cols-[1.25fr_1fr]">
                  <div className="space-y-4">
                    <div className="section-kicker">
                      <span className="section-kicker-line" />
                      {pick(language, "时间序列", "Chronology")}
                    </div>
                  <Timeline
                    events={timelineEvents}
                    selectedEventId={selectedEvent?.id}
                    onSelect={setSelectedEventId}
                    onClearFilters={clearFilters}
                    lastUpdatedAt={dashboardData.meta.updated_at}
                    language={language}
                  />
                  </div>
                  <StatusCards
                    items={dashboardData.infrastructure}
                    language={language}
                    onOpenSources={(item) =>
                      setDrawer({
                        open: true,
                        title: localizeSector(item.sector, language),
                        sources: item.evidence
                      })
                    }
                  />
                </section>
              </section>

              <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
                <div className="section-kicker">
                  <span className="section-kicker-line" />
                  {pick(language, "信号侧栏", "Signal Stack")}
                </div>
                <LiveUpdatePanel language={language} />

                <section className="grid gap-4 2xl:grid-cols-2">
                  <section className="dense-block overflow-hidden">
                    <header className="signal-line flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <ShieldCheck size={16} weight="duotone" className="text-teal-700" />
                        {pick(language, "可信来源监控", "Trusted Source Monitor")}
                      </span>
                      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-slate-500">
                        <span className="live-dot" />
                        {dashboardData.sources.length}
                      </span>
                    </header>
                    <p className="px-3 pt-2 text-xs text-slate-500">
                      {pick(language, "聚合官方通报与主流媒体，按时间倒序展示。", "Official statements and major media updates sorted by recency.")}
                    </p>
                    <ul className="mt-2 max-h-[28rem] divide-y overflow-y-auto text-xs">
                      {dashboardData.sources.length === 0 ? (
                        <li className="px-3 py-3 text-slate-500">
                          {pick(language, "暂无可展示来源", "No source updates available")}
                        </li>
                      ) : (
                        dashboardData.sources.map((source) => (
                          <li key={source.id} className="space-y-1.5 px-3 py-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                                  {source.id}
                                </span>
                                <span className="truncate text-[10px] uppercase tracking-wide text-slate-500">{source.publisher}</span>
                              </div>
                              <span className="shrink-0 font-mono text-[10px] text-slate-500">{source.published_at.slice(0, 16)}Z</span>
                            </div>
                            <p className="leading-5 text-slate-700">{source.title}</p>
                            <a
                              className="inline-flex items-center gap-1 text-teal-700 underline transition-transform duration-150 active:translate-y-px"
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {pick(language, "打开来源", "Open Source")}
                            </a>
                          </li>
                        ))
                      )}
                    </ul>
                  </section>

                  <SocialMediaPanel
                    items={dashboardData.social_media}
                    language={language}
                    listMaxHeightClass="max-h-[28rem]"
                    className="2xl:h-full"
                  />
                </section>

                <section className="dense-block overflow-hidden">
                  <header className="signal-line flex items-center gap-2 px-3 py-2 text-sm font-semibold">
                    <WarningCircle size={16} weight="duotone" className="text-teal-700" />
                    {pick(language, "区域外溢", "Regional Spillover")}
                  </header>
                  <ul className="max-h-[14rem] divide-y overflow-y-auto text-xs">
                    {dashboardData.regional_impacts.map((impact) => (
                      <li key={`${impact.country}-${impact.source_time}`} className="space-y-1.5 px-3 py-2">
                        <p className="font-semibold text-slate-700">{impact.country}</p>
                        <p className="leading-5 text-slate-600">{localizeContent(impact.summary, language)}</p>
                        {(() => {
                          const safeUrl = toSafeHttpUrl(impact.source_url);
                          const hostLabel = safeUrl ? new URL(safeUrl).host : pick(language, "无效链接", "Invalid URL");
                          return safeUrl ? (
                            <a
                              className="inline-flex items-center gap-1 text-teal-700 underline transition-transform duration-150 active:translate-y-px"
                              href={safeUrl}
                              target="_blank"
                              rel="noreferrer"
                              title={safeUrl}
                            >
                              {pick(language, "来源", "Source")} · {hostLabel} · {impact.source_time}
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              {pick(language, "来源", "Source")} · {hostLabel} · {impact.source_time}
                            </span>
                          );
                        })()}
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            </motion.section>

            <motion.section variants={itemVariants} className="grid gap-4 2xl:grid-cols-[1.2fr_1fr]">
              <div className="space-y-4">
                <ConflictNumbersPanel item={dashboardData.factchecks[0]} language={language} />
                <StatementCompare statements={dashboardData.statements} language={language} />
                <FactCheckPanel items={dashboardData.factchecks} language={language} />
              </div>
              <div className="space-y-4">
                <MediaGallery items={dashboardData.media} language={language} />
                <FAQ items={dashboardData.faq} language={language} />
              </div>
            </motion.section>
          </motion.div>
        </div>
      </div>

      <SourceDrawer
        open={drawer.open}
        title={drawer.title}
        sources={drawer.sources}
        language={language}
        onClose={() => setDrawer((prev) => ({ ...prev, open: false }))}
      />
    </main>
  );
}
