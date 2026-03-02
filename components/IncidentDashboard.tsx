"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
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

function formatUpdatedAt(
  value: string | undefined,
  language: Language
): string {
  if (!value) {
    return "N/A";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const utcText = `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
  const locale = language === "zh" ? "zh-CN" : "en-US";
  const localText = date.toLocaleString(locale, {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  return `${utcText} / ${localText}`;
}

export function IncidentDashboard({ data }: IncidentDashboardProps) {
  const [dashboardData, setDashboardData] = useState<SeedData>(data);
  const [language, setLanguage] = useState<Language>("en");
  const [darkMode, setDarkMode] = useState(false);
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

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
  };

  return (
    <main>
      <div className="mx-auto max-w-[1400px] px-4 py-4 md:py-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mb-3 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
        >
          <span className="font-semibold tracking-wide">
            {pick(language, "开源情报追踪 · 伊朗冲突态势", "Open-Source Intelligence · Iran Conflict Watch")}
          </span>
          <span className="opacity-40">|</span>
          <span className="opacity-75">
            {pick(language, "实时聚合公开来源数据，不代表任何官方立场", "Aggregates public sources in real time. Does not represent any official position.")}
          </span>
        </motion.div>

        <div className="cockpit-shell overflow-hidden p-3 md:p-4">
          <header className="signal-line pb-4">
            <div className="grid gap-4 md:grid-cols-[1.45fr_1fr]">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                  <span className="live-dot" />
                  <span className="font-semibold tracking-[0.08em] uppercase">
                    {pick(language, "实时监测窗口", "Live Monitoring Window")}
                  </span>
                  <span className="font-mono">{formatUpdatedAt(dashboardData.meta.updated_at, language)}</span>
                  <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                    {syncState === "live"
                      ? pick(language, "自动刷新", "Auto Refresh")
                      : syncState === "syncing"
                        ? pick(language, "同步中", "Syncing")
                        : pick(language, "降级模式", "Degraded")}
                  </span>
                </div>

                <h1 className="text-4xl font-extrabold leading-none tracking-tighter md:text-5xl">
                  {pick(language, "伊朗空袭后态势总览", "Post-Strike Situation Overview: Iran")}
                </h1>

                <p className="mt-2 max-w-[70ch] text-sm leading-6 text-slate-600">
                  {localizeContent(dashboardData.meta.headline, language)}
                </p>
              </div>

              <section className="dense-block p-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                  <Pulse size={14} weight="duotone" className="text-teal-700" />
                  <span className="font-semibold tracking-[0.08em] uppercase">
                    {pick(language, "关键指标", "Core Metrics")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div className="signal-line pb-1">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">{pick(language, "已核验", "Verified")}</p>
                    <p className="font-mono text-lg text-emerald-700">{metrics.verified}</p>
                  </div>
                  <div className="signal-line pb-1">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">{pick(language, "争议", "Contested")}</p>
                    <p className="font-mono text-lg text-amber-700">{metrics.contested}</p>
                  </div>
                  <div className="pt-1">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">{pick(language, "未验证", "Unverified")}</p>
                    <p className="font-mono text-lg text-rose-700">{metrics.unverified}</p>
                  </div>
                  <div className="pt-1">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">{pick(language, "平均可信度", "Avg. Confidence")}</p>
                    <p className="font-mono text-lg text-slate-700">{metrics.avgConfidence}</p>
                  </div>
                </div>
              </section>
            </div>
          </header>

          <RealtimeTicker events={events} language={language} />

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
            initial="hidden"
            animate="show"
          >
            <motion.section variants={itemVariants} className="grid gap-4 xl:grid-cols-[1.34fr_1.18fr] 2xl:grid-cols-[1.22fr_1.28fr]">
              <section className="space-y-4 xl:pr-1">
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
                  <Timeline events={events} selectedEventId={selectedEvent?.id} onSelect={setSelectedEventId} onClearFilters={clearFilters} language={language} />
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
                      <li key={`${impact.country}-${impact.source_time}`} className="space-y-1 px-3 py-2">
                        <p className="font-semibold text-slate-700">{impact.country}</p>
                        <p className="leading-5 text-slate-600">{localizeContent(impact.summary, language)}</p>
                        <a
                          className="inline-flex items-center gap-1 text-teal-700 underline transition-transform duration-150 active:translate-y-px"
                          href={impact.source_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {pick(language, "来源", "Source")} · {impact.source_time}
                        </a>
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
