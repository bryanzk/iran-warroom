import type { InfrastructureSector, InfrastructureState } from "@/lib/types";

export type Language = "zh" | "en";

export function pick(lang: Language, zh: string, en: string): string {
  return lang === "zh" ? zh : en;
}

export function parseLanguage(raw: string | null | undefined): Language {
  return raw === "zh" ? "zh" : "en";
}

const CONTENT_TRANSLATIONS: Record<string, string> = {
  "截至 2026-02-28 14:32 UTC，多家可信来源报告伊朗境内发生多点空袭与后续响应，航班与通信出现受限迹象，部分信息仍在核验中。":
    "As of 2026-02-28 14:32 UTC, multiple credible sources report multi-point airstrikes and follow-on responses within Iran. Flight and communication constraints are observed, and part of the information remains under verification.",
  "可信媒体报道德黑兰出现爆炸与烟柱，地点与影响范围仍在持续核验。":
    "Credible media reported explosions and smoke plumes in Tehran. Exact locations and impact scope are still being verified.",
  "区域空域与航线出现临时受限，对伊朗进出港航班造成影响。":
    "Regional airspace and routes were temporarily restricted, affecting flights into and out of Iran.",
  "报道显示互联网访问速率下降，影响持续时间与覆盖范围仍在更新。":
    "Reports indicate reduced internet access speed; duration and coverage are still being updated.",
  "不同来源对同一时段伤亡数字存在差异，当前仅可并列呈现。":
    "Different sources report conflicting casualty figures for the same time window; values are shown side by side.",
  "社交平台出现关于城市局部断电的说法，尚无独立来源交叉验证。":
    "Claims of localized city power outages appeared on social platforms, without independent cross-verification.",
  "多家航司航线调整，影响伊朗相关空域。":
    "Multiple airlines adjusted routes, affecting Iran-related airspace.",
  "公开来源缺少可核验港口运行状态。":
    "Public sources do not yet provide verifiable port operation status.",
  "伊朗境内电力影响尚缺稳定交叉来源。":
    "Reliable cross-source confirmation on domestic power impact in Iran is still lacking.",
  "访问速度下降与服务波动。": "Access speed decreased with service instability.",
  "交通网络以空中运输受限为主。": "Transport disruption is primarily in air traffic.",
  "观察到市场波动，但伊朗本地金融服务运行状态证据不足。":
    "Market volatility is observed, but evidence on domestic financial service operations in Iran remains insufficient.",
  "暂无可核验全国性教育系统运行结论。":
    "No verifiable nationwide conclusion is available on education system operations.",
  "医疗承载与可达性仍需后续公开数据支持。":
    "Healthcare capacity and accessibility require further public data for confirmation.",
  "伊朗方面强调其自卫权并表示倾向通过政治方式解决冲突。":
    "Iranian officials stressed the right to self-defense and signaled preference for a political resolution.",
  "英法德呼吁恢复谈判并避免地区冲突扩大。":
    "The UK, France, and Germany called for resumed negotiations and avoidance of broader regional escalation.",
  "联合国人权高专呼吁各方克制并重返外交轨道。":
    "The UN human rights chief called for restraint and a return to diplomacy.",
  "英国首相办公室表态不希望冲突升级并强调谈判路径。":
    "The UK Prime Minister's Office said it does not want wider escalation and emphasized negotiations.",
  "同一时段伤亡数字是否一致": "Are casualty figures consistent for the same time window?",
  "至少50": "At least 50",
  "至少78【未验证】": "At least 78 [Unverified]",
  "统计口径是否包含后续救援阶段不清晰":
    "It is unclear whether the counting method includes later rescue phases.",
  "部分数字来自单一渠道，缺少独立二次确认":
    "Some figures come from a single channel and lack independent secondary confirmation.",
  "等待官方或国际组织发布统一时间窗统计":
    "Wait for official or international-organization statistics for a unified time window.",
  "对比同一地点同一时间戳的多源记录":
    "Compare multi-source records for the same location and timestamp.",
  "德黑兰天际线烟柱画面": "Tehran skyline smoke-plume footage",
  "含爆炸后烟柱与紧急场景": "Contains post-explosion smoke-plume and emergency scenes",
  "社交平台流传的城市停电影像": "Social-media clip claiming city power outage",
  "来源待独立核验": "Source pending independent verification",
  "哪些地区受影响？": "Which areas are affected?",
  "当前公开信息集中于德黑兰及部分省份的事件报告，范围仍在更新。":
    "Current public reporting is concentrated in Tehran and some provinces; scope is still being updated.",
  "航班与空域目前如何？": "What is the current status of flights and airspace?",
  "多家来源报告地区空域曾受限并出现航班调整，状态可能快速变化。":
    "Multiple sources report temporary regional airspace restrictions and flight adjustments; status may change quickly.",
  "通信是否中断？": "Are communications disrupted?",
  "已有来源提及互联网限速或波动，持续时间与覆盖范围尚待更多核验。":
    "Sources mention internet throttling or instability; duration and coverage require further verification.",
  "为什么不同来源数据不一致？": "Why do sources report different numbers?",
  "发布时间、统计口径和覆盖地理范围不同，会导致数值差异。":
    "Differences in publication time, counting methodology, and geographic scope can produce diverging figures.",
  "页面如何判定未验证？": "How does this page mark content as unverified?",
  "当信息缺少独立来源交叉确认或仅有单一渠道时，标记为【未验证】。":
    "Information is marked [Unverified] when it lacks independent cross-source confirmation or comes from a single channel.",
  "如何查看原始来源？": "How can I view original sources?",
  "点击每条卡片或时间线节点的“查看来源”即可访问原文链接和发布时间。":
    "Click 'View Source' on each card or timeline item to access the original link and publication time.",
  "有报道提及拦截导弹与坠落物通报。": "Reports mention missile interceptions and falling debris notifications.",
  "有报道提及导弹与无人机拦截及电力影响。":
    "Reports mention missile/drone interceptions and power-related impacts.",
  "可信社媒来源监控": "Trusted Social Feed",
  "平台": "Platform",
  "发布时间": "Published",
  "来自": "From",
  "社交平台来源": "Social-media source",
  "官方社媒账号": "Official social accounts",
  "暂无可信社媒来源": "No trusted social sources available",
  "社交媒体监控（仅显示白名单内可信账号）":
    "Social feed (trusted accounts within whitelist only)",
  "暂无有效社交来源": "No valid social sources",
  "X 账号": "X account",
  "Bluesky 账号": "Bluesky account",
  "官方频道": "Official channel",
  "伊朗外交部在社媒发布了针对事件的官方说明。":
    "The Iranian Ministry of Foreign Affairs posted an official statement on social media regarding the incident.",
  "伊朗外事部发布地区交通与安全提示。":
    "The Iranian Foreign Ministry posted regional transport and safety advisories.",
  "伊朗官方在其社媒发布受影响区域与民航提醒。":
    "Iranian authorities posted affected region updates and civil aviation notices."
};

export function localizeContent(text: string, lang: Language): string {
  if (lang === "zh") {
    return text;
  }
  return CONTENT_TRANSLATIONS[text] ?? text;
}

const SECTOR_LABELS: Record<InfrastructureSector, { zh: string; en: string }> = {
  airport: { zh: "机场", en: "Airport" },
  port: { zh: "港口", en: "Port" },
  power: { zh: "电力", en: "Power" },
  communications: { zh: "通信", en: "Communications" },
  transport: { zh: "交通", en: "Transport" },
  financial: { zh: "金融", en: "Financial" },
  education: { zh: "教育", en: "Education" },
  healthcare: { zh: "医疗", en: "Healthcare" }
};

const STATUS_LABELS: Record<InfrastructureState, { zh: string; en: string }> = {
  normal: { zh: "正常", en: "Normal" },
  restricted: { zh: "受限", en: "Restricted" },
  disrupted: { zh: "中断", en: "Disrupted" },
  unknown: { zh: "未知", en: "Unknown" }
};

export function localizeSector(sector: InfrastructureSector, lang: Language): string {
  return SECTOR_LABELS[sector][lang];
}

export function localizeStatus(status: InfrastructureState, lang: Language): string {
  return STATUS_LABELS[status][lang];
}
