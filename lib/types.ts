export type VerificationStatus = "verified" | "unverified" | "contested";

export type EventCategory =
  | "explosion"
  | "power_outage"
  | "infrastructure_disruption"
  | "transport_disruption"
  | "communication_disruption"
  | "financial_disruption"
  | "official_statement"
  | "other";

export interface Event {
  id: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    country: "Iran";
    admin_level_1: string;
    admin_level_2: string;
  };
  category: EventCategory;
  description: string;
  source_url: string;
  source_time: string;
  confidence: number;
  verification_status: VerificationStatus;
}

export type InfrastructureSector =
  | "airport"
  | "port"
  | "power"
  | "communications"
  | "transport"
  | "financial"
  | "education"
  | "healthcare";

export type InfrastructureState = "normal" | "restricted" | "disrupted" | "unknown";

export interface EvidenceItem {
  source_url: string;
  source_time: string;
  title: string;
  note?: string;
  verification_status: VerificationStatus;
}

export interface SocialMediaSource {
  id: string;
  platform: string;
  handle: string;
  title: string;
  url: string;
  published_at: string;
  verification_status: VerificationStatus;
}

export interface InfrastructureStatus {
  sector: InfrastructureSector;
  status: InfrastructureState;
  evidence: EvidenceItem[];
  last_updated: string;
}

export interface Statement {
  party: string;
  timestamp: string;
  quote: string;
  summary: string;
  source_url: string;
}

export interface FactCheckItem {
  claim: string;
  evidence_strength: "strong" | "medium" | "weak";
  sources: Array<{
    label: string;
    value: string;
    source_url: string;
    source_time: string;
  }>;
  gaps: string[];
  next_verification_steps: string[];
}

export interface MediaItem {
  id: string;
  title: string;
  type: "image" | "video";
  thumbnail_url: string;
  content_url: string;
  source_url: string;
  source_time: string;
  verification_status: VerificationStatus;
  content_warning: string;
}

export interface SeedData {
  meta: {
    updated_at: string;
    last_successful_snapshot: string;
    coverage_start: string;
    coverage_end: string;
    headline: string;
  };
  events: Event[];
  infrastructure: InfrastructureStatus[];
  statements: Statement[];
  factchecks: FactCheckItem[];
  media: MediaItem[];
  faq: Array<{ question: string; answer: string }>;
  regional_impacts: Array<{ country: string; summary: string; source_url: string; source_time: string }>;
  sources: Array<{ id: string; publisher: string; title: string; url: string; published_at: string }>;
  social_media: SocialMediaSource[];
}

export interface EventQuery {
  from?: string;
  to?: string;
  region?: string;
  category?: EventCategory;
  min_confidence?: string;
  verification_status?: VerificationStatus;
  q?: string;
}

export interface LiveMessage {
  id: string;
  timestamp: string;
  source_id?: string;
  source_url?: string;
  type: "system" | "source_update";
  verification_status: VerificationStatus;
  text: string;
}
