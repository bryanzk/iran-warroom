import { Link, ShareNetwork } from "@phosphor-icons/react";
import { UnverifiedBadge } from "@/components/UnverifiedBadge";
import { localizeContent, pick, type Language } from "@/lib/i18n";
import type { SocialMediaSource } from "@/lib/types";

interface SocialMediaPanelProps {
  items: SocialMediaSource[];
  language: Language;
  className?: string;
  listMaxHeightClass?: string;
}

export function SocialMediaPanel({
  items,
  language,
  className = "",
  listMaxHeightClass = "max-h-[24rem]"
}: SocialMediaPanelProps) {
  const toSourceUrl = (source: SocialMediaSource): string | undefined =>
    source.source_url || source.url;

  return (
    <section className={`dense-block overflow-hidden ${className}`}>
      <header className="signal-line flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold">
        <span className="inline-flex items-center gap-2">
          <ShareNetwork size={16} className="text-teal-700" weight="duotone" />
          {pick(language, "可信社媒来源监控", "Trusted Social Feed")}
        </span>
        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-slate-500">
          <span className="live-dot" />
          {items.length}
        </span>
      </header>

      <p className="px-3 pt-2 text-xs text-slate-500">
        {pick(language, "社交媒体监控（仅显示白名单内可信账号）。", "Social feed from whitelisted and traceable accounts only.")}
      </p>

      <ul className={`mt-2 divide-y overflow-y-auto text-xs ${listMaxHeightClass}`}>
        {items.length === 0 ? (
          <li className="px-3 py-3 text-slate-500">
            {pick(language, "暂无有效社交来源", "No valid social sources")}
          </li>
        ) : (
          items.map((source) => (
            <li key={source.id} className="space-y-1.5 px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
                    {source.handle}
                  </span>
                  <span className="truncate text-[10px] uppercase tracking-wide text-slate-500">
                    {pick(language, "平台", "Platform")}
                  </span>
                  <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                    {localizeContent(source.platform, language)}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-slate-500">
                  {source.published_at.slice(0, 16)}Z
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <UnverifiedBadge status={source.verification_status} language={language} />
                <span className="text-[11px] text-slate-600">
                  {pick(language, "账号", "Account")} · {source.handle}
                </span>
              </div>
              <p className="leading-5 text-slate-700">{localizeContent(source.title, language)}</p>
              {toSourceUrl(source) ? (
                <a
                  className="inline-flex items-center gap-1 text-teal-700 underline transition-transform duration-150 active:translate-y-px"
                  href={toSourceUrl(source)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={pick(language, `打开原帖：${source.title}`, `Open original post: ${source.title}`)}
                >
                  <Link size={12} />
                  {pick(language, "来源", "Source")} · {pick(language, "原帖链接", "Original Post")}
                </a>
              ) : (
                <p className="text-xs text-amber-700">
                  {pick(language, "暂未获取到原始链接", "Original link unavailable")}
                </p>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
