import { localizeContent, pick, type Language } from "@/lib/i18n";

export function FAQ({
  items,
  language = "zh"
}: {
  items: Array<{ question: string; answer: string }>;
  language?: Language;
}) {
  return (
    <section className="card p-4">
      <h2 className="text-lg font-semibold">{pick(language, "常见问题", "FAQ")}</h2>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <details key={item.question} className="rounded border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer font-medium">{localizeContent(item.question, language)}</summary>
            <p className="mt-2 text-sm leading-6">{localizeContent(item.answer, language)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
