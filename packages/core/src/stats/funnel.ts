export const funnelStages = ["arrived", "stayed", "viewedProjects", "openedProject", "contacted"] as const;
export type FunnelStage = (typeof funnelStages)[number];

export const stayedAfterMs = 10_000;
export const projectActions: readonly string[] = ["repo", "demo"];
export const contactActions: readonly string[] = ["email", "whatsapp", "linkedin", "cv"];

export interface SessionJourney {
  attentionMs: number;
  viewedProjects: boolean;
  actions: readonly string[];
}

export interface FunnelStep {
  stage: FunnelStage;
  sessions: number;
}

export function furthestStage(journey: SessionJourney): FunnelStage {
  if (journey.actions.some((action) => contactActions.includes(action))) return "contacted";
  if (journey.actions.some((action) => projectActions.includes(action))) return "openedProject";
  if (journey.viewedProjects) return "viewedProjects";
  if (journey.attentionMs >= stayedAfterMs) return "stayed";
  return "arrived";
}

export function funnelOf(journeys: readonly SessionJourney[]): FunnelStep[] {
  const reached = journeys.map((journey) => funnelStages.indexOf(furthestStage(journey)));
  return funnelStages.map((stage, index) => ({
    stage,
    sessions: reached.filter((furthest) => furthest >= index).length,
  }));
}
