import { pick, type Language } from "@/lib/i18n";

interface UpdateBannerProps {
  title: string;
  summary: string;
  updatedAtUtc: string;
  updatedAtLocal: string;
  coverage: string;
  language?: Language;
}

export function UpdateBanner({
  title,
  summary,
  updatedAtUtc,
  updatedAtLocal,
  coverage,
  language = "en"
}: UpdateBannerProps) {
  return (
    <section className="card sticky top-3 z-30 p-4 shadow-sm backdrop-blur">
      <p className="text-sm font-semibold tracking-wide text-teal-700">
        {pick(language, "顶部摘要条", "Top Summary")}
      </p>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm leading-6">{summary}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <span className="rounded bg-slate-100 px-2 py-1">
          {pick(language, "数据更新时间", "Data Updated")}: {updatedAtUtc} / {updatedAtLocal}
        </span>
        <span className="rounded bg-slate-100 px-2 py-1">
          {pick(language, "覆盖范围", "Coverage")}: {coverage}
        </span>
        <span className="rounded bg-slate-100 px-2 py-1">
          {pick(language, "方法：仅收录可核验公开来源", "Method: only verifiable public sources are included")}
        </span>
      </div>
    </section>
  );
}
