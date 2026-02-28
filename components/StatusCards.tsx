import type { InfrastructureStatus } from "@/lib/types";
import { localizeSector, localizeStatus, pick, type Language } from "@/lib/i18n";

const STATUS_STYLE: Record<InfrastructureStatus["status"], string> = {
  normal: "border-emerald-200 bg-emerald-50",
  restricted: "border-amber-200 bg-amber-50",
  disrupted: "border-rose-200 bg-rose-50",
  unknown: "border-slate-200 bg-slate-50"
};

export function StatusCards({
  items,
  onOpenSources,
  language = "zh"
}: {
  items: InfrastructureStatus[];
  onOpenSources: (item: InfrastructureStatus) => void;
  language?: Language;
}) {
  return (
    <section className="card p-4">
      <h2 className="text-lg font-semibold">{pick(language, "影响概览卡片", "Infrastructure Status Cards")}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.sector}
            onClick={() => onOpenSources(item)}
            className={`rounded border p-3 text-left ${STATUS_STYLE[item.status]}`}
          >
            <p className="text-sm uppercase tracking-wide text-slate-700">{localizeSector(item.sector, language)}</p>
            <p className="mt-1 text-xl font-semibold">{localizeStatus(item.status, language)}</p>
            <p className="small-muted mt-2">
              {pick(language, "更新于", "Updated")}: {item.last_updated}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
