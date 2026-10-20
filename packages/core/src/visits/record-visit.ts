import type { CollectPayload } from "@devlytics/shared";
import { anonymousSessionId } from "../privacy";
import type { SiteRepository } from "../sites";
import { resolveSiteByOrigin } from "../sites";
import type { EventStore } from "./ports";
import { browserOf, deviceOf, isBot } from "./user-agent";

export interface IncomingVisit {
  origin: string | null;
  ip: string;
  userAgent: string;
  country: string | null;
  payload: CollectPayload;
}

export type VisitOutcome =
  { status: "recorded"; siteId: string; receivedAt: Date } | { status: "ignored-bot" };

export function recordVisit(deps: {
  sites: SiteRepository;
  events: EventStore;
  sessionSeed: string;
  now: () => Date;
}) {
  const resolveSite = resolveSiteByOrigin({ sites: deps.sites });

  return async (incoming: IncomingVisit): Promise<VisitOutcome> => {
    if (isBot(incoming.userAgent)) return { status: "ignored-bot" };

    const site = await resolveSite(browserOrigin(incoming.origin) ?? incoming.payload.url);
    const receivedAt = deps.now();
    const { payload } = incoming;

    await deps.events.append({
      siteId: site.id,
      sessionId: await anonymousSessionId(deps.sessionSeed, receivedAt, {
        domain: site.domain,
        ip: incoming.ip,
        userAgent: incoming.userAgent,
      }),
      path: new URL(payload.url).pathname,
      ref: payload.ref ?? null,
      referrer: payload.referrer ?? null,
      country: incoming.country,
      device: deviceOf(incoming.userAgent),
      browser: browserOf(incoming.userAgent),
      receivedAt,
      events: payload.events,
    });

    return { status: "recorded", siteId: site.id, receivedAt };
  };
}

function browserOrigin(origin: string | null): string | null {
  return origin === null || origin === "null" ? null : origin;
}
