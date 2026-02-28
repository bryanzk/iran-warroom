import { FunnelSimple, GlobeHemisphereWest, MoonStars, SunDim } from "@phosphor-icons/react";
import type { EventCategory, VerificationStatus } from "@/lib/types";
import { pick, type Language } from "@/lib/i18n";

interface FilterState {
  region: string;
  category: "all" | EventCategory;
  verificationStatus: "all" | VerificationStatus;
  minConfidence: number;
  keyword: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

const CATEGORY_VALUES: FilterState["category"][] = [
  "all",
  "explosion",
  "transport_disruption",
  "communication_disruption",
  "infrastructure_disruption",
  "other"
];

const STATUS_VALUES: FilterState["verificationStatus"][] = ["all", "verified", "unverified", "contested"];

function categoryLabel(language: Language, value: FilterState["category"]): string {
  const labels: Partial<Record<FilterState["category"], { zh: string; en: string }>> = {
    all: { zh: "全部类别", en: "All Categories" },
    explosion: { zh: "爆炸", en: "Explosion" },
    transport_disruption: { zh: "交通中断", en: "Transport" },
    communication_disruption: { zh: "通信受限", en: "Communication" },
    infrastructure_disruption: { zh: "基础设施", en: "Infrastructure" },
    other: { zh: "其他", en: "Other" }
  };
  return labels[value]?.[language] ?? value;
}

function statusLabel(language: Language, value: FilterState["verificationStatus"]): string {
  const labels: Record<FilterState["verificationStatus"], { zh: string; en: string }> = {
    all: { zh: "全部核验", en: "All Verification" },
    verified: { zh: "已核验", en: "Verified" },
    unverified: { zh: "未验证", en: "Unverified" },
    contested: { zh: "争议", en: "Contested" }
  };
  return labels[value][language];
}

export function FilterBar({
  filters,
  onChange,
  language,
  onLanguageChange,
  darkMode,
  onDarkModeToggle
}: FilterBarProps) {
  return (
    <section className="dense-block p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
        <FunnelSimple size={14} weight="duotone" className="text-teal-700" />
        <span className="font-semibold tracking-[0.08em] uppercase">{pick(language, "筛选控制台", "Filter Console")}</span>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-7">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">{pick(language, "地区", "Region")}</span>
          <input
            aria-label={pick(language, "地区", "Region")}
            className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
            placeholder={pick(language, "如 Tehran", "e.g. Tehran")}
            value={filters.region}
            onChange={(e) => onChange({ ...filters, region: e.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">{pick(language, "类别", "Category")}</span>
          <select
            className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value as FilterState["category"] })}
          >
            {CATEGORY_VALUES.map((option) => (
              <option key={option} value={option}>
                {categoryLabel(language, option)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">{pick(language, "核验", "Verification")}</span>
          <select
            className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
            value={filters.verificationStatus}
            onChange={(e) =>
              onChange({ ...filters, verificationStatus: e.target.value as FilterState["verificationStatus"] })
            }
          >
            {STATUS_VALUES.map((option) => (
              <option key={option} value={option}>
                {statusLabel(language, option)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 xl:col-span-2">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">{pick(language, "可信度阈值", "Confidence Threshold")}</span>
          <div className="flex h-9 items-center gap-2 rounded border border-slate-300 bg-white px-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              className="w-full"
              value={filters.minConfidence}
              onChange={(e) => onChange({ ...filters, minConfidence: Number(e.target.value) })}
            />
            <span className="w-9 text-right font-mono text-xs text-slate-600">{filters.minConfidence.toFixed(2)}</span>
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">{pick(language, "关键词", "Keyword")}</span>
          <input
            aria-label={pick(language, "关键词", "Keyword")}
            className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
            placeholder={pick(language, "搜索事件", "Search")}
            value={filters.keyword}
            onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">{pick(language, "界面", "Interface")}</span>
          <div className="grid h-9 grid-cols-2 gap-1">
            <button
              type="button"
              className="flex items-center justify-center gap-1 rounded border border-slate-300 bg-white text-xs transition hover:bg-slate-50 active:scale-[0.98]"
              onClick={() => onLanguageChange(language === "zh" ? "en" : "zh")}
            >
              <GlobeHemisphereWest size={14} />
              {language === "zh" ? "中" : "EN"}
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1 rounded border border-slate-300 bg-white text-xs transition hover:bg-slate-50 active:scale-[0.98]"
              onClick={onDarkModeToggle}
            >
              {darkMode ? <MoonStars size={14} /> : <SunDim size={14} />}
              {darkMode ? pick(language, "暗", "Dark") : pick(language, "亮", "Light")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
