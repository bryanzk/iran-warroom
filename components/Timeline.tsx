import type { Event } from "@/lib/types";
import { UnverifiedBadge } from "@/components/UnverifiedBadge";
import { localizeContent, pick, type Language } from "@/lib/i18n";

interface TimelineProps {
  events: Event[];
  selectedEventId?: string;
  onSelect: (eventId: string) => void;
  language?: Language;
}

export function Timeline({ events, selectedEventId, onSelect, language = "zh" }: TimelineProps) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{pick(language, "时间线（按小时）", "Timeline (Hourly)")}</h2>
        <span className="small-muted">
          {pick(language, "关键节点均附来源发布时间", "Each key node includes source publication time")}
        </span>
      </div>
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
    </section>
  );
}
