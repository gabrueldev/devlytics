import { GithubSignInError } from "@devlytics/adapters";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { AppEnv } from "../app-env";
import { buildContainer } from "../container";
import { endSession, requireSession, startSession } from "../middleware/session";

const stateCookie = "dl_oauth";
const stateMaxAgeSeconds = 10 * 60;
const defaultLanding = "/painel";

export const authRoutes = new Hono<AppEnv>()
  .get("/auth/github", (c) => {
    if (!c.env.GITHUB_CLIENT_SECRET) return c.body(null, 503);

    const state = crypto.randomUUID();
    const landing = safeLanding(c.req.query("next"));
    setCookie(c, stateCookie, `${state} ${landing}`, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/api/auth",
      maxAge: stateMaxAgeSeconds,
    });
    return c.redirect(buildContainer(c.env).githubAuthorizeUrl(state));
  })
  .get("/auth/github/callback", async (c) => {
    const [expectedState = "", landing = defaultLanding] = (getCookie(c, stateCookie) ?? "").split(" ");
    deleteCookie(c, stateCookie, { path: "/api/auth", secure: true });

    const code = c.req.query("code");
    if (!code || !expectedState || c.req.query("state") !== expectedState) {
      return c.redirect(`${safeLanding(landing)}?login=failed`);
    }

    try {
      const user = await buildContainer(c.env).signInWithGithub(code);
      await startSession(c, user.id);
      return c.redirect(safeLanding(landing));
    } catch (error) {
      if (!(error instanceof GithubSignInError)) throw error;
      console.warn("GitHub sign-in failed", { reason: error.message });
      return c.redirect(`${safeLanding(landing)}?login=failed`);
    }
  })
  .post("/auth/logout", (c) => {
    endSession(c);
    return c.body(null, 204);
  })
  .get("/me", requireSession, async (c) => {
    const container = buildContainer(c.env);
    const user = await container.findUser(c.get("userId"));
    if (user === null) {
      endSession(c);
      return c.json({ error: "signed_out" }, 401);
    }

    const sites = await container.listSites(user.id);
    return c.json({
      user: { login: user.login, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      sites: sites.map(({ id, name, domain }) => ({ id, name, domain })),
    });
  });

function safeLanding(path: string | undefined): string {
  return path !== undefined && /^\/(?!\/)[\w\-/]*$/.test(path) ? path : defaultLanding;
}
