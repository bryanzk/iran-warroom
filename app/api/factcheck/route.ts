import { NextResponse } from "next/server";
import { getMetaWithLanguage, queryFactChecksWithLanguage } from "@/lib/query";
import { parseLanguage } from "@/lib/i18n";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = parseLanguage(url.searchParams.get("lang"));
  const data = queryFactChecksWithLanguage(lang);
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
