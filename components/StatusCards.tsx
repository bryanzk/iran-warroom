import type { InfrastructureStatus } from "@/lib/types";
import { localizeSector, localizeStatus, pick, type Language } from "@/lib/i18n";

const STATUS_STYLE: Record<InfrastructureStatus["status"], string> = {
  normal: "border-emerald-200 bg-emerald-50",
  restricted: "border-amber-200 bg-amber-50",
  disrupted: "border-rose-200 bg-rose-50",
  unknown: "border-slate-200 bg-slate-50"
};

function formatUtcCompact(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min} UTC`;
}

export function StatusCards({
  items,
  onOpenSources,
  language = "en"
}: {
  items: InfrastructureStatus[];
  onOpenSources: (item: InfrastructureStatus) => void;
  language?: Language;
}) {
  return (
    <section className="card p-3">
      <h2 className="text-base font-semibold">{pick(language, "影响概览卡片", "Infrastructure Status Cards")}</h2>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.sector}
            onClick={() => onOpenSources(item)}
            className={`min-w-0 rounded border p-2.5 text-left sm:p-3 ${STATUS_STYLE[item.status]}`}
          >
            <p className="break-words text-[11px] uppercase tracking-wide text-slate-700">
              {localizeSector(item.sector, language)}
            </p>
            <p className="mt-1 break-words text-xl font-semibold leading-tight sm:text-[1.75rem]">
              {localizeStatus(item.status, language)}
            </p>
            <p className="small-muted mt-1.5 break-words">
              {pick(language, "更新于", "Updated")}: {formatUtcCompact(item.last_updated)}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
