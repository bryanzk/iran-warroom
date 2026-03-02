import { NextRequest, NextResponse } from "next/server";
import { parseLanguage } from "@/lib/i18n";
import { getLiveFeedService } from "@/lib/live-feed";
import { startSeedAutoRefresh } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  startSeedAutoRefresh();
  const search = request.nextUrl.searchParams;
  const lang = parseLanguage(search.get("lang"));
  const limitRaw = search.get("limit");
  const limit = limitRaw ? Math.max(1, Math.min(100, Number(limitRaw))) : 30;

  const service = getLiveFeedService();
  service.start();

  const messages = service.getMessages(lang, Number.isFinite(limit) ? limit : 30);

  return NextResponse.json(
    {
      data: messages,
      meta: {
        lang,
        total: messages.length,
        version: service.getVersion()
      }
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
