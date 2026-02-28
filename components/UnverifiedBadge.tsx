import classNames from "classnames";
import type { VerificationStatus } from "@/lib/types";
import type { Language } from "@/lib/i18n";

const LABELS: Record<Language, Record<VerificationStatus, string>> = {
  zh: {
    verified: "已核验",
    unverified: "未验证",
    contested: "争议"
  },
  en: {
    verified: "Verified",
    unverified: "Unverified",
    contested: "Contested"
  }
};

export function UnverifiedBadge({ status, language = "zh" }: { status: VerificationStatus; language?: Language }) {
  const classes = classNames(
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
    {
      "border-emerald-300 bg-emerald-50 text-emerald-700": status === "verified",
      "border-amber-300 bg-amber-50 text-amber-700": status === "unverified",
      "border-rose-300 bg-rose-50 text-rose-700": status === "contested"
    }
  );

  return <span className={classes}>【{LABELS[language][status]}】</span>;
}
