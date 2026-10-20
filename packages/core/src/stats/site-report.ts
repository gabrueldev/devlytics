import type { FunnelStep, SessionJourney } from "./funnel";

export interface DailyVisits {
  day: string;
  visits: number;
}

export interface ProjectStats {
  name: string;
  visitors: number;
  attentionMs: number;
  repoClicks: number;
  demoClicks: number;
}

export interface Ranked {
  name: string;
  value: number;
}

export interface SiteReportData {
  visits: number;
  sectionAttentionMs: number;
  daily: DailyVisits[];
  projects: ProjectStats[];
  sections: Ranked[];
  conversions: Ranked[];
  sources: Ranked[];
  countries: Ranked[];
  journeys: SessionJourney[];
}

export interface SiteReport extends Omit<SiteReportData, "journeys"> {
  site: { id: string; name: string; domain: string };
  period: { days: number; since: string; until: string };
  averageAttentionMs: number;
  funnel: FunnelStep[];
}
