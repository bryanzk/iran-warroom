"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Broadcast, ClockCountdown, WarningCircle } from "@phosphor-icons/react";
import { localizeContent, pick, type Language } from "@/lib/i18n";
import type { Event } from "@/lib/types";

interface RealtimeTickerProps {
  events: Event[];
  language: Language;
}

export function RealtimeTicker({ events, language }: RealtimeTickerProps) {
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const tickerPaused = paused || prefersReducedMotion;
  const tickerItems = useMemo(() => {
    const sorted = [...events]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 8);

    return [...sorted, ...sorted];
  }, [events]);

  if (tickerItems.length === 0) {
    return (
      <div className="signal-line py-2 text-sm text-slate-500">
        {pick(language, "暂无实时事件条目", "No real-time event entries")}
      </div>
    );
  }

  return (
    <section className="signal-line py-2">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Broadcast size={16} weight="duotone" className="text-teal-700" />
          <span className="font-semibold tracking-[0.08em] uppercase">
            {pick(language, "实时信号带", "Live Signal Strip")}
          </span>
        </div>
        <button
          type="button"
          className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 transition hover:bg-slate-50"
          onClick={() => setPaused((prev) => !prev)}
        >
          {tickerPaused ? pick(language, "继续", "Resume") : pick(language, "暂停", "Pause")}
        </button>
      </div>

      <div className="realtime-ticker-mask overflow-hidden" aria-live="off">
        <motion.div
          className="flex w-max gap-3"
          animate={tickerPaused ? { x: 0 } : { x: [0, -1200] }}
          transition={tickerPaused ? { duration: 0 } : { duration: 36, ease: "linear", repeat: Infinity }}
        >
          {tickerItems.map((item, idx) => {
            const isContested = item.verification_status !== "verified";
            return (
              <article
                key={`${item.id}-${idx}`}
                className="flex min-w-[300px] items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5"
              >
                {isContested ? (
                  <WarningCircle size={14} weight="fill" className="text-amber-600" />
                ) : (
                  <ClockCountdown size={14} weight="duotone" className="text-teal-700" />
                )}
                <p className="truncate text-xs text-slate-700">
                  <span className="mr-1 font-semibold">{item.location.admin_level_2}</span>
                  {" "}
                  {localizeContent(item.description, language)}
                </p>
                <time className="ml-auto shrink-0 font-mono text-[10px] text-slate-500">{item.timestamp.slice(11, 16)}Z</time>
              </article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
