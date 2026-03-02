import { NextRequest, NextResponse } from "next/server";
import { getMetaWithLanguage, queryStatementsWithLanguage } from "@/lib/query";
import { parseLanguage } from "@/lib/i18n";
import { startSeedAutoRefresh } from "@/lib/data";

export async function GET(request: NextRequest) {
  startSeedAutoRefresh();
  const search = request.nextUrl.searchParams;
  const lang = parseLanguage(search.get("lang"));

  const data = queryStatementsWithLanguage(
    {
    party: search.get("party") || undefined,
    from: search.get("from") || undefined,
    to: search.get("to") || undefined
    },
    lang
  );

  const meta = getMetaWithLanguage(lang);

  return NextResponse.json(
    {
      data,
      meta: {
        updated_at: meta.updated_at,
        total: data.length,
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
