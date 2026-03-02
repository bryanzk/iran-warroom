import { NextRequest, NextResponse } from "next/server";
import { getMetaWithLanguage, queryInfrastructureWithLanguage } from "@/lib/query";
import { parseLanguage } from "@/lib/i18n";
import { startSeedAutoRefresh } from "@/lib/data";

export async function GET(request: NextRequest) {
  startSeedAutoRefresh();
  const lang = parseLanguage(request.nextUrl.searchParams.get("lang"));
  const region = request.nextUrl.searchParams.get("region") || undefined;
  const data = queryInfrastructureWithLanguage(region, lang);
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
