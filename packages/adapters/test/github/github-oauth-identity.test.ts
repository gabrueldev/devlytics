import { describe, expect, it } from "vitest";
import { GithubOAuthIdentity, GithubSignInError } from "../../src";

const app = {
  clientId: "client",
  clientSecret: "secret",
  redirectUri: "https://devlytics.test/api/auth/github/callback",
};

function fakeGithub(routes: Record<string, Response>) {
  const send: typeof fetch = async (input) =>
    routes[String(input)]?.clone() ?? new Response(null, { status: 404 });
  return new GithubOAuthIdentity(app, send);
}

const tokenRoute = {
  "https://github.com/login/oauth/access_token": Response.json({ access_token: "gho_1" }),
};
const user = { id: 42, login: "fulano", name: "Fulano", email: null, avatar_url: "https://avatars/42" };

describe("GithubOAuthIdentity", () => {
  it("asks only for the profile and the e-mail", () => {
    const url = new URL(fakeGithub({}).authorizeUrl("state_1"));

    expect(url.searchParams.get("scope")).toBe("read:user user:email");
    expect(url.searchParams.get("state")).toBe("state_1");
  });

  it("falls back to the primary verified e-mail when the profile hides it", async () => {
    const identity = fakeGithub({
      ...tokenRoute,
      "https://api.github.com/user": Response.json(user),
      "https://api.github.com/user/emails": Response.json([
        { email: "old@dev.com", primary: false, verified: true },
        { email: "fulano@dev.com", primary: true, verified: true },
      ]),
    });

    await expect(identity.profileFor("code")).resolves.toEqual({
      githubId: "42",
      login: "fulano",
      email: "fulano@dev.com",
      name: "Fulano",
      avatarUrl: "https://avatars/42",
    });
  });

  it("refuses a code GitHub did not accept", async () => {
    const identity = fakeGithub({
      "https://github.com/login/oauth/access_token": Response.json({ error: "bad_verification_code" }),
    });

    await expect(identity.profileFor("code")).rejects.toBeInstanceOf(GithubSignInError);
  });
});
