import type { FactCheckItem } from "@/lib/types";
import { localizeContent, pick, type Language } from "@/lib/i18n";

export function ConflictNumbersPanel({ item, language = "en" }: { item?: FactCheckItem; language?: Language }) {
  if (!item) return null;

  return (
    <section className="card p-4">
      <h2 className="text-lg font-semibold">{pick(language, "冲突数值并列展示", "Conflicting Numbers (Side-by-side)")}</h2>
      <p className="small-muted mt-1">
        {pick(
          language,
          "同一指标存在差异时并列呈现，不做单值裁决。",
          "When figures conflict for the same metric, values are shown side by side without selecting a single number."
        )}
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {item.sources.map((source) => (
          <div key={`${source.label}-${source.source_time}`} className="rounded border border-slate-200 p-3">
            <p className="font-medium">{source.label}</p>
            <p className="mt-1 text-lg">{localizeContent(source.value, language)}</p>
            <p className="small-muted">
              {pick(language, "发布时间", "Published")}: {source.source_time}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
