import type { Event } from "@/lib/types";

function buildKey(event: Event): string {
  const hourBucket = event.timestamp.slice(0, 13);
  return [hourBucket, event.category, event.location.admin_level_2].join("|");
}

/**
 * Merge duplicated event records from different feeds for timeline display.
 */
export function mergeSimilarEvents(events: Event[]): Event[] {
  const map = new Map<string, Event>();

  for (const event of events) {
    const key = buildKey(event);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, event);
      continue;
    }

    if (event.confidence > existing.confidence) {
      map.set(key, event);
    }
  }

  return [...map.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
