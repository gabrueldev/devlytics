import { AnalyticsEngineSqlClient, AnalyticsEngineStatsReader, D1SiteRepository } from "@devlytics/adapters";
import { getDemoOverview } from "@devlytics/core";
import { createDatabase } from "@devlytics/db";

export function buildContainer(env: Env) {
  const db = createDatabase(env.DB);
  const sql = new AnalyticsEngineSqlClient(env.CF_ACCOUNT_ID, env.CF_ANALYTICS_TOKEN);

  return {
    getDemoOverview: getDemoOverview({
      sites: new D1SiteRepository(db),
      stats: new AnalyticsEngineStatsReader(sql, env.EVENTS_DATASET),
      demoDomain: env.DEMO_DOMAIN,
      now: () => new Date(),
    }),
  };
}
