import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../app-env";
import { buildContainer } from "../container";

export const sessionCookie = "dl_session";
const sessionDays = 30;
const dayMs = 24 * 60 * 60 * 1000;

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, sessionCookie);
  const claims = token ? await buildContainer(c.env).sessions.verify(token, new Date()) : null;
  if (claims === null) return c.json({ error: "signed_out" }, 401);

  c.set("userId", claims.userId);
  c.header("cache-control", "no-store");
  return next();
});

export async function startSession(c: Context<AppEnv>, userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + sessionDays * dayMs);
  const token = await buildContainer(c.env).sessions.issue({ userId, expiresAt });
  setCookie(c, sessionCookie, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    expires: expiresAt,
  });
}

export function endSession(c: Context<AppEnv>): void {
  deleteCookie(c, sessionCookie, { path: "/", secure: true });
}
