import {
  AnalyticsEngineLinkVisits,
  AnalyticsEngineSiteReport,
  AnalyticsEngineSqlClient,
  AnalyticsEngineStatsReader,
  CaktoAccessTokens,
  CaktoPaymentGateway,
  D1CoffeeLedger,
  D1SiteRepository,
  D1TrackedLinkRepository,
  D1UserRepository,
  EdgeTokenCache,
  GithubOAuthIdentity,
} from "@devlytics/adapters";
import {
  chargeCardCoffee,
  chargePixCoffee,
  countCoffees,
  createTrackedLink,
  getDemoOverview,
  getLinkTimeline,
  getSiteReport,
  isCoffeePaid,
  listSites,
  listTrackedLinks,
  recordCoffeePayments,
  registerSite,
  removeSite,
  removeTrackedLink,
  SessionTokens,
  signInWithGithub,
} from "@devlytics/core";
import { createDatabase } from "@devlytics/db";

export const githubCallbackPath = "/api/auth/github/callback";

export function buildContainer(env: Env) {
  const db = createDatabase(env.DB);
  const sql = new AnalyticsEngineSqlClient(env.CF_ACCOUNT_ID, env.CF_ANALYTICS_TOKEN);
  const ledger = new D1CoffeeLedger(db);
  const sites = new D1SiteRepository(db);
  const users = new D1UserRepository(db);
  const links = new D1TrackedLinkRepository(db);
  const now = () => new Date();
  const newId = () => crypto.randomUUID();
  const gateway = new CaktoPaymentGateway(
    new CaktoAccessTokens(
      { clientId: env.CAKTO_CLIENT_ID, clientSecret: env.CAKTO_CLIENT_SECRET },
      undefined,
      undefined,
      new EdgeTokenCache(caches.default),
    ),
    env.COFFEE_OFFER_ID,
  );
  const github = new GithubOAuthIdentity({
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    redirectUri: `${env.APP_ORIGIN}${githubCallbackPath}`,
  });

  return {
    getDemoOverview: getDemoOverview({
      sites,
      stats: new AnalyticsEngineStatsReader(sql, env.EVENTS_DATASET),
      demoDomain: env.DEMO_DOMAIN,
      now,
    }),
    countCoffees: countCoffees({ ledger }),
    recordCoffeePayments: recordCoffeePayments({ ledger }),
    chargePixCoffee: chargePixCoffee({ gateway }),
    chargeCardCoffee: chargeCardCoffee({ gateway, ledger, now }),
    isCoffeePaid: isCoffeePaid({ ledger }),
    githubAuthorizeUrl: (state: string) => github.authorizeUrl(state),
    signInWithGithub: signInWithGithub({ identity: github, users, newId, now }),
    sessions: new SessionTokens(env.SESSION_SECRET),
    findUser: (id: string) => users.findById(id),
    listSites: listSites({ sites }),
    registerSite: registerSite({ sites, newId, now }),
    removeSite: removeSite({ sites }),
    getSiteReport: getSiteReport({
      sites,
      reports: new AnalyticsEngineSiteReport(sql, env.EVENTS_DATASET),
      now,
    }),
    listTrackedLinks: listTrackedLinks({ sites, links }),
    createTrackedLink: createTrackedLink({ sites, links, newId, now }),
    removeTrackedLink: removeTrackedLink({ sites, links }),
    getLinkTimeline: getLinkTimeline({
      sites,
      links,
      visits: new AnalyticsEngineLinkVisits(sql, env.EVENTS_DATASET),
      now,
    }),
  };
}
