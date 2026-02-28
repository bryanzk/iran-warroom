import { Link, ShareNetwork } from "@phosphor-icons/react";
import { UnverifiedBadge } from "@/components/UnverifiedBadge";
import { localizeContent, pick, type Language } from "@/lib/i18n";
import type { SocialMediaSource } from "@/lib/types";

interface SocialMediaPanelProps {
  items: SocialMediaSource[];
  language: Language;
}

export function SocialMediaPanel({ items, language }: SocialMediaPanelProps) {
  const toSourceUrl = (source: SocialMediaSource): string | undefined => source.source_url || source.url;

  return (
    <section className="dense-block overflow-hidden">
      <header className="signal-line flex items-center gap-2 px-3 py-2 text-sm font-semibold">
        <ShareNetwork size={16} className="text-teal-700" weight="duotone" />
        {pick(language, "可信社媒来源监控", "Trusted Social Feed")}
      </header>

      <p className="px-3 pt-2 text-xs text-slate-500">
        {pick(language, "社交媒体监控（仅显示白名单内可信账号）", "Social feed (trusted accounts within whitelist only)")}
      </p>

      <ul className="max-h-[20rem] divide-y overflow-y-auto text-xs">
        {items.length === 0 ? (
          <li className="px-3 py-3 text-slate-500">{pick(language, "暂无有效社交来源", "No valid social sources")}</li>
        ) : (
          items.map((source) => (
            <li key={source.id} className="space-y-1 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                  {localizeContent(source.platform, language)}
                </span>
                <span className="text-slate-600">{pick(language, "来自", "From")} {source.handle}</span>
                <UnverifiedBadge status={source.verification_status} language={language} />
              </div>
              <p className="leading-6 text-slate-700">{localizeContent(source.title, language)}</p>
              {toSourceUrl(source) ? (
                <a
                  className="inline-flex items-center gap-1 text-teal-700 underline"
                  href={toSourceUrl(source)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={pick(language, `打开原帖：${source.title}`, `Open original post: ${source.title}`)}
                >
                  <Link size={12} />
                  {pick(language, "来源", "Source")} · {source.published_at.slice(0, 16)}Z
                </a>
              ) : (
                <p className="text-xs text-amber-700">{pick(language, "暂未获取到原始链接", "Original link unavailable")}</p>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
