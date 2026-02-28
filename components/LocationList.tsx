import type { Event } from "@/lib/types";
import { pick, type Language } from "@/lib/i18n";

export function LocationList({ events, language = "en" }: { events: Event[]; language?: Language }) {
  const grouped = Array.from(
    events.reduce((map, event) => {
      const key = `${event.location.admin_level_1} / ${event.location.admin_level_2}`;
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map<string, number>())
  );

  return (
    <section className="card p-4">
      <h3 className="text-base font-semibold">{pick(language, "地点列表", "Location List")}</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {grouped.map(([name, count]) => (
          <li key={name} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
            <span>{name}</span>
            <span>
              {count} {pick(language, "条", "items")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
