import { NextRequest } from "next/server";
import { parseLanguage } from "@/lib/i18n";
import { getLiveFeedService } from "@/lib/live-feed";
import { refreshSeedSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await refreshSeedSnapshot();
  const lang = parseLanguage(request.nextUrl.searchParams.get("lang"));
  const service = getLiveFeedService();
  service.start();
  await service.refresh();

  const encoder = new TextEncoder();
  let cursorVersion = service.getVersion();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      send("init", {
        messages: service.getMessages(lang, 30),
        version: cursorVersion
      });

      const timer = setInterval(() => {
        void service.refresh().finally(() => {
          const nextVersion = service.getVersion();
          if (nextVersion !== cursorVersion) {
            cursorVersion = nextVersion;
            send("update", {
              messages: service.getMessages(lang, 30),
              version: cursorVersion
            });
          } else {
            send("ping", { timestamp: new Date().toISOString() });
          }
        });
      }, 3000);

      request.signal.addEventListener("abort", () => {
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          // Ignore close race on aborted streams.
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
