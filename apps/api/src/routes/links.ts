import { AnalyticsEngineQueryError } from "@devlytics/adapters";
import {
  InvalidLinkError,
  LinkNotFoundError,
  LinkTakenError,
  SiteNotFoundError,
  type TrackedLink,
} from "@devlytics/core";
import { Hono, type Context } from "hono";
import { z } from "zod";
import type { AppEnv } from "../app-env";
import { buildContainer } from "../container";
import { requireSession } from "../middleware/session";

const newLinkSchema = z.object({
  label: z.string().max(200),
  slug: z.string().max(100).optional(),
});

export const linkRoutes = new Hono<AppEnv>()
  .use("/sites/:siteId/links", requireSession)
  .use("/sites/:siteId/links/*", requireSession)
  .get("/sites/:siteId/links", (c) =>
    handled(c, async () => {
      const links = await buildContainer(c.env).listTrackedLinks(c.get("userId"), c.req.param("siteId"));
      return c.json(links.map(linkJson));
    }),
  )
  .post("/sites/:siteId/links", async (c) => {
    const parsed = newLinkSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_link" }, 400);

    return handled(c, async () => {
      const link = await buildContainer(c.env).createTrackedLink(
        c.get("userId"),
        c.req.param("siteId"),
        parsed.data,
      );
      return c.json(linkJson(link), 201);
    });
  })
  .delete("/sites/:siteId/links/:linkId", (c) =>
    handled(c, async () => {
      await buildContainer(c.env).removeTrackedLink(
        c.get("userId"),
        c.req.param("siteId"),
        c.req.param("linkId"),
      );
      return c.body(null, 204);
    }),
  )
  .get("/sites/:siteId/links/:linkId/timeline", (c) =>
    handled(c, async () => {
      const { link, visits, funnel } = await buildContainer(c.env).getLinkTimeline(
        c.get("userId"),
        c.req.param("siteId"),
        c.req.param("linkId"),
      );
      return c.json({ link: linkJson(link), visits, funnel });
    }),
  );

function linkJson(link: TrackedLink) {
  return {
    id: link.id,
    slug: link.slug,
    label: link.label,
    firstOpenedAt: link.firstOpenedAt?.toISOString() ?? null,
    createdAt: link.createdAt.toISOString(),
  };
}

async function handled(c: Context<AppEnv>, run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof SiteNotFoundError) return c.json({ error: "site_not_found" }, 404);
    if (error instanceof LinkNotFoundError) return c.json({ error: "link_not_found" }, 404);
    if (error instanceof InvalidLinkError) return c.json({ error: "invalid_link" }, 400);
    if (error instanceof LinkTakenError) return c.json({ error: "link_taken" }, 409);
    if (error instanceof AnalyticsEngineQueryError) return c.json({ error: "stats_unavailable" }, 502);
    throw error;
  }
}
