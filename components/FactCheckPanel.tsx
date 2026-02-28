import type { FactCheckItem } from "@/lib/types";
import { localizeContent, pick, type Language } from "@/lib/i18n";

const STRENGTH_CLASS = {
  strong: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  weak: "bg-rose-100 text-rose-700"
};

export function FactCheckPanel({ items, language = "zh" }: { items: FactCheckItem[]; language?: Language }) {
  return (
    <section className="card p-4">
      <h2 className="text-lg font-semibold">{pick(language, "事实核查区", "Fact-check Section")}</h2>
      <div className="mt-3 space-y-4">
        {items.map((item) => (
          <article key={item.claim} className="rounded border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{localizeContent(item.claim, language)}</h3>
              <span className={`rounded px-2 py-0.5 text-xs ${STRENGTH_CLASS[item.evidence_strength]}`}>
                {pick(language, "证据强度", "Evidence Strength")}: {item.evidence_strength.toUpperCase()}
              </span>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {item.sources.map((source) => (
                <div key={`${source.label}-${source.source_time}`} className="rounded border border-slate-100 bg-slate-50 p-2">
                  <p className="text-sm font-semibold">{source.label}</p>
                  <p className="text-sm">{localizeContent(source.value, language)}</p>
                  <p className="small-muted">{source.source_time}</p>
                  <a className="text-teal-700 underline" href={source.source_url} target="_blank" rel="noreferrer">
                    {pick(language, "查看来源", "View Source")}
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-3 text-sm">
              <p className="font-semibold">{pick(language, "核验缺口", "Verification Gaps")}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {item.gaps.map((gap) => (
                  <li key={gap}>{localizeContent(gap, language)}</li>
                ))}
              </ul>
            </div>

            <div className="mt-3 text-sm">
              <p className="font-semibold">{pick(language, "建议继续验证", "Suggested Next Verification")}</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                {item.next_verification_steps.map((step) => (
                  <li key={step}>{localizeContent(step, language)}</li>
                ))}
              </ol>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
