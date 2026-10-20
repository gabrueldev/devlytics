import type { Visit } from "@devlytics/core";
import type { TrackedEvent } from "@devlytics/shared";

export const eventBlobColumns = [
  "type",
  "target",
  "kind",
  "action",
  "project",
  "path",
  "ref",
  "referrer",
  "country",
  "device",
  "browser",
  "session",
] as const;

export const eventDoubleColumns = ["value", "receivedAt"] as const;

interface EventFields {
  target?: string;
  kind?: string;
  action?: string;
  project?: string;
  value?: number;
}

export function toDataPoint(visit: Visit, event: TrackedEvent): AnalyticsEngineDataPoint {
  const fields = fieldsOf(event);

  return {
    indexes: [visit.siteId],
    blobs: [
      event.type,
      fields.target ?? "",
      fields.kind ?? "",
      fields.action ?? "",
      fields.project ?? "",
      visit.path,
      visit.ref ?? "",
      visit.referrer ?? "",
      visit.country ?? "",
      visit.device,
      visit.browser,
      visit.sessionId,
    ],
    doubles: [fields.value ?? 0, visit.receivedAt.getTime()],
  };
}

function fieldsOf(event: TrackedEvent): EventFields {
  switch (event.type) {
    case "pageview":
      return {};
    case "attention":
      return { target: event.target, kind: event.kind, value: event.ms };
    case "scroll":
      return { value: event.depth };
    case "click":
      return event.project === undefined
        ? { action: event.action }
        : { action: event.action, project: event.project };
  }
}
