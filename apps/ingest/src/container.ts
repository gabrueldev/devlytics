import { AnalyticsEngineEventStore, D1SiteRepository } from "@devlytics/adapters";
import { recordVisit } from "@devlytics/core";
import { createDatabase } from "@devlytics/db";

export function buildContainer(env: Env) {
  const db = createDatabase(env.DB);

  return {
    recordVisit: recordVisit({
      sites: new D1SiteRepository(db),
      events: new AnalyticsEngineEventStore(env.EVENTS),
      sessionSeed: env.DAILY_SALT_SEED,
      now: () => new Date(),
    }),
  };
}
