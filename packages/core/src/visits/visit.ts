import type { TrackedEvent } from "@devlytics/shared";
import type { Browser, Device } from "./user-agent";

export interface Visit {
  siteId: string;
  sessionId: string;
  path: string;
  ref: string | null;
  referrer: string | null;
  country: string | null;
  device: Device;
  browser: Browser;
  receivedAt: Date;
  events: TrackedEvent[];
}
