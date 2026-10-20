import { InvalidOriginError, UnknownSiteError } from "@devlytics/core";
import { parseCollectPayload } from "@devlytics/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "../app-env";
import { buildContainer } from "../container";

const maxBodyBytes = 64 * 1024;

export const collectRoutes = new Hono<AppEnv>().use("/e", cors({ origin: "*" })).post("/e", async (c) => {
  const body = await c.req.text();
  if (body.length > maxBodyBytes) return c.body(null, 413);

  const payload = parseCollectPayload(body);
  if (payload === null) return c.body(null, 400);

  try {
    await buildContainer(c.env).recordVisit({
      origin: c.req.header("origin") ?? null,
      ip: c.req.header("cf-connecting-ip") ?? "",
      userAgent: c.req.header("user-agent") ?? "",
      country: typeof c.req.raw.cf?.country === "string" ? c.req.raw.cf.country : null,
      payload,
    });
  } catch (error) {
    if (error instanceof UnknownSiteError || error instanceof InvalidOriginError) return c.body(null, 403);
    throw error;
  }

  return c.body(null, 204);
});
