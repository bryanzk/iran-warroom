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

function averageConfidence(events: Event[]): string {
  if (events.length === 0) return "0.00";
  const avg = events.reduce((acc, item) => acc + item.confidence, 0) / events.length;
  return avg.toFixed(2);
}

export function IncidentDashboard({ data }: IncidentDashboardProps) {
  const [language, setLanguage] = useState<Language>("en");
  const [darkMode, setDarkMode] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(data.events[0]?.id);
  const [drawer, setDrawer] = useState<{ open: boolean; title: string; sources: InfrastructureStatus["evidence"] }>({
    open: false,
    title: "",
    sources: []
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

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
    return data.events.filter((event) => {
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
  }, [data.events, filters]);

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
                  <span className="font-mono">2026-02-28 14:32 UTC</span>
                </div>

                <h1 className="text-4xl font-extrabold leading-none tracking-tighter md:text-5xl">
                  {pick(language, "伊朗空袭后态势总览", "Post-Strike Situation Overview: Iran")}
                </h1>

                <p className="mt-2 max-w-[70ch] text-sm leading-6 text-slate-600">
                  {localizeContent(data.meta.headline, language)}
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
            <motion.section variants={itemVariants} className="grid gap-4 xl:grid-cols-[1.62fr_1fr]">
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
                    regionalImpacts={data.regional_impacts}
                    selectedEventId={selectedEvent?.id}
                    onSelect={setSelectedEventId}
                    language={language}
                  />
                  <LocationList events={events} language={language} />
                </section>

                <section className="grid gap-4 2xl:grid-cols-[1.25fr_1fr]">
                  <Timeline events={events} selectedEventId={selectedEvent?.id} onSelect={setSelectedEventId} onClearFilters={clearFilters} language={language} />
                  <StatusCards
                    items={data.infrastructure}
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

                <section className="dense-block overflow-hidden">
                  <header className="signal-line flex items-center gap-2 px-3 py-2 text-sm font-semibold">
                    <WarningCircle size={16} weight="duotone" className="text-teal-700" />
                    {pick(language, "区域外溢", "Regional Spillover")}
                  </header>
                  <ul className="divide-y text-xs">
                    {data.regional_impacts.map((impact) => (
                      <li key={`${impact.country}-${impact.source_time}`} className="space-y-1 px-3 py-2">
                        <p className="font-semibold text-slate-700">{impact.country}</p>
                        <p className="leading-5 text-slate-600">{localizeContent(impact.summary, language)}</p>
                        <a className="text-teal-700 underline" href={impact.source_url} target="_blank" rel="noreferrer">
                          {pick(language, "来源", "Source")} · {impact.source_time}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="dense-block overflow-hidden">
                  <header className="signal-line flex items-center gap-2 px-3 py-2 text-sm font-semibold">
                    <ShieldCheck size={16} weight="duotone" className="text-teal-700" />
                    {pick(language, "可信来源监控", "Trusted Source Monitor")}
                  </header>
                  <ul className="max-h-[20rem] divide-y overflow-y-auto text-xs">
                    {data.sources.map((source) => (
                      <li key={source.id} className="space-y-1 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-700">{source.id}</span>
                          <span className="font-mono text-[10px] text-slate-500">{source.published_at.slice(0, 16)}Z</span>
                        </div>
                        <p className="text-slate-600">{source.title}</p>
                        <a className="text-teal-700 underline" href={source.url} target="_blank" rel="noreferrer">
                          {pick(language, "打开来源", "Open Source")}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>

                <SocialMediaPanel items={data.social_media} language={language} />
              </aside>
            </motion.section>

            <motion.section variants={itemVariants} className="grid gap-4 2xl:grid-cols-[1.2fr_1fr]">
              <div className="space-y-4">
                <ConflictNumbersPanel item={data.factchecks[0]} language={language} />
                <StatementCompare statements={data.statements} language={language} />
                <FactCheckPanel items={data.factchecks} language={language} />
              </div>
              <div className="space-y-4">
                <MediaGallery items={data.media} language={language} />
                <FAQ items={data.faq} language={language} />
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
