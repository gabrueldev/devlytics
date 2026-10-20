import {
  AnalyticsEngineSqlClient,
  AnalyticsEngineStatsReader,
  CaktoAccessTokens,
  CaktoPaymentGateway,
  D1CoffeeLedger,
  D1SiteRepository,
} from "@devlytics/adapters";
import {
  chargeCardCoffee,
  chargePixCoffee,
  countCoffees,
  getDemoOverview,
  isCoffeePaid,
  recordCoffeePayments,
} from "@devlytics/core";
import { createDatabase } from "@devlytics/db";

export function buildContainer(env: Env) {
  const db = createDatabase(env.DB);
  const sql = new AnalyticsEngineSqlClient(env.CF_ACCOUNT_ID, env.CF_ANALYTICS_TOKEN);
  const ledger = new D1CoffeeLedger(db);
  const gateway = new CaktoPaymentGateway(
    new CaktoAccessTokens({ clientId: env.CAKTO_CLIENT_ID, clientSecret: env.CAKTO_CLIENT_SECRET }),
    env.COFFEE_OFFER_ID,
  );

  return {
    getDemoOverview: getDemoOverview({
      sites: new D1SiteRepository(db),
      stats: new AnalyticsEngineStatsReader(sql, env.EVENTS_DATASET),
      demoDomain: env.DEMO_DOMAIN,
      now: () => new Date(),
    }),
    countCoffees: countCoffees({ ledger }),
    recordCoffeePayments: recordCoffeePayments({ ledger }),
    chargePixCoffee: chargePixCoffee({ gateway }),
    chargeCardCoffee: chargeCardCoffee({ gateway, ledger, now: () => new Date() }),
    isCoffeePaid: isCoffeePaid({ ledger }),
  };
}
