import {
  AnalyticsEngineEventStore,
  D1SiteRepository,
  D1TrackedLinkRepository,
  D1UserRepository,
  DisabledMailer,
  ResendMailer,
} from "@devlytics/adapters";
import { noticeLinkOpened, recordVisit } from "@devlytics/core";
import { createDatabase } from "@devlytics/db";
import { linkOpenedMail } from "./link-opened-mail";

export function buildContainer(env: Env) {
  const db = createDatabase(env.DB);
  const sites = new D1SiteRepository(db);

  return {
    recordVisit: recordVisit({
      sites,
      events: new AnalyticsEngineEventStore(env.EVENTS),
      sessionSeed: env.DAILY_SALT_SEED,
      now: () => new Date(),
    }),
    noticeLinkOpened: noticeLinkOpened({
      links: new D1TrackedLinkRepository(db),
      sites,
      users: new D1UserRepository(db),
      mailer: env.RESEND_API_KEY ? new ResendMailer(env.RESEND_API_KEY, env.MAIL_FROM) : new DisabledMailer(),
      dashboardUrl: (siteId, linkId) => `${env.APP_ORIGIN}/painel?site=${siteId}&link=${linkId}`,
      text: linkOpenedMail,
    }),
  };
}
