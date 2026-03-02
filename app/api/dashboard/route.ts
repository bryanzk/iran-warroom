import { NextRequest, NextResponse } from "next/server";
import { parseLanguage } from "@/lib/i18n";
import { queryDashboardWithLanguage } from "@/lib/query";
import { startSeedAutoRefresh } from "@/lib/data";

export async function GET(request: NextRequest) {
  startSeedAutoRefresh();
  const lang = parseLanguage(request.nextUrl.searchParams.get("lang"));
  const data = queryDashboardWithLanguage(lang);

  return NextResponse.json(
    {
      data,
      meta: {
        updated_at: data.meta.updated_at,
        last_successful_snapshot: data.meta.last_successful_snapshot,
        lang
      }
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
