import { NextRequest, NextResponse } from "next/server";
import { getMetaWithLanguage, queryEventsWithLanguage } from "@/lib/query";
import type { EventQuery } from "@/lib/types";
import { parseLanguage } from "@/lib/i18n";
import { startSeedAutoRefresh } from "@/lib/data";

export async function GET(request: NextRequest) {
  startSeedAutoRefresh();
  const search = request.nextUrl.searchParams;
  const lang = parseLanguage(search.get("lang"));

  const query: EventQuery = {
    from: search.get("from") || undefined,
    to: search.get("to") || undefined,
    region: search.get("region") || undefined,
    category: (search.get("category") as EventQuery["category"]) || undefined,
    min_confidence: search.get("min_confidence") || undefined,
    verification_status: (search.get("verification_status") as EventQuery["verification_status"]) || undefined,
    q: search.get("q") || undefined
  };

  const events = queryEventsWithLanguage(query, lang);
  const meta = getMetaWithLanguage(lang);

  return NextResponse.json(
    {
      data: events,
      meta: {
        updated_at: meta.updated_at,
        total: events.length,
        last_successful_snapshot: meta.last_successful_snapshot,
        lang
      }
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300"
      }
    }
  );
}
