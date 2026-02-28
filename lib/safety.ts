import registry from "@/data/sources.registry.json";

const BANNED_VISUAL_KEYWORDS = ["corpse", "gore", "dismember", "blood pool"];

export function sanitizeQueryText(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 120);
}

export function isAllowedSourceUrl(rawUrl: string): boolean {
  try {
    const { hostname } = new URL(rawUrl);
    return (registry.allowed_domains as string[]).some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export function hasGraphicRisk(text: string): boolean {
  const normalized = text.toLowerCase();
  return BANNED_VISUAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function enforceSafeMediaTitle(title: string, language: "zh" | "en" = "zh"): string {
  if (hasGraphicRisk(title)) {
    return language === "zh"
      ? "内容已过滤：标题不符合公开展示规则"
      : "Content filtered: title does not meet public display policy";
  }
  return title;
}
