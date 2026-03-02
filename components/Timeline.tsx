import { MagnifyingGlass } from "@phosphor-icons/react";
import type { Event } from "@/lib/types";
import { UnverifiedBadge } from "@/components/UnverifiedBadge";
import { localizeContent, pick, type Language } from "@/lib/i18n";

interface TimelineProps {
  events: Event[];
  selectedEventId?: string;
  onSelect: (eventId: string) => void;
  onClearFilters?: () => void;
  lastUpdatedAt?: string;
  language?: Language;
}

function formatSyncTime(value: string | undefined): string {
  if (!value) {
    return "N/A";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.toISOString().slice(0, 19)}Z`;
}

export function Timeline({ events, selectedEventId, onSelect, onClearFilters, lastUpdatedAt, language = "en" }: TimelineProps) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{pick(language, "时间线（按小时）", "Timeline (Hourly)")}</h2>
        <div className="text-right">
          <span className="block small-muted">
            {pick(language, "关键节点均附来源发布时间", "Each key node includes source publication time")}
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            {pick(language, "最后同步", "Last Sync")}: {formatSyncTime(lastUpdatedAt)}
          </span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
          <MagnifyingGlass size={28} weight="thin" />
          <p className="text-sm">{pick(language, "暂无匹配事件", "No events match your filters")}</p>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs text-teal-600 underline underline-offset-2 transition hover:text-teal-800"
            >
              {pick(language, "清除筛选条件", "Clear filters")}
            </button>
          )}
        </div>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => {
            const active = selectedEventId === event.id;
            return (
              <li
                key={event.id}
                className={`rounded border p-3 transition ${
                  active ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white"
                }`}
              >
                <button className="w-full text-left" onClick={() => onSelect(event.id)}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <strong className="text-sm">{event.location.admin_level_2}</strong>
                    <UnverifiedBadge status={event.verification_status} language={language} />
                  </div>
                  <p className="text-sm leading-6">{localizeContent(event.description, language)}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {pick(language, "事件时间", "Event Time")}: {event.timestamp} | {pick(language, "来源发布时间", "Source Time")}: {event.source_time} |
                    {" "}
                    {pick(language, "可信度", "Confidence")}: {event.confidence}
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
