import { useMemo, useState } from "react";
import type { MediaItem } from "@/lib/types";
import { UnverifiedBadge } from "@/components/UnverifiedBadge";
import { ContentWarningModal } from "@/components/ContentWarningModal";
import { enforceSafeMediaTitle } from "@/lib/safety";
import { localizeContent, pick, type Language } from "@/lib/i18n";

export function MediaGallery({ items, language = "en" }: { items: MediaItem[]; language?: Language }) {
  const [warningAccepted, setWarningAccepted] = useState(false);

  const safeItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        title: enforceSafeMediaTitle(localizeContent(item.title, language), language)
      })),
    [items, language]
  );

  return (
    <section className="card p-4">
      <h2 className="text-lg font-semibold">{pick(language, "媒体与影像区", "Media & Visuals")}</h2>
      <p className="small-muted mt-1">
        {pick(language, "默认不自动播放，未核验素材将明确标注。", "Autoplay is disabled by default, and unverified material is clearly labeled.")}
      </p>

      <ContentWarningModal open={!warningAccepted} onConfirm={() => setWarningAccepted(true)} language={language} />

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {safeItems.map((item) => (
          <article key={item.id} className="rounded border border-slate-200 bg-white p-3">
            <img src={item.thumbnail_url} alt={item.title} loading="lazy" className="h-40 w-full rounded object-cover" />
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              <UnverifiedBadge status={item.verification_status} language={language} />
            </div>
            <p className="small-muted mt-1">{localizeContent(item.content_warning, language)}</p>
            {warningAccepted ? (
              <a className="mt-2 inline-block text-sm text-teal-700 underline" href={item.content_url} target="_blank" rel="noreferrer">
                {pick(language, "手动播放 / 打开原视频", "Play Manually / Open Original")}
              </a>
            ) : (
              <p className="mt-2 text-sm text-slate-500">{pick(language, "请先阅读内容警示", "Please read the content warning first")}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
