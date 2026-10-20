import type { GithubIdentity, GithubProfile } from "@devlytics/core";

const tokenUrl = "https://github.com/login/oauth/access_token";
const apiUrl = "https://api.github.com";
const userAgent = "devlytics";

export interface GithubOAuthApp {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export class GithubSignInError extends Error {
  override readonly name = "GithubSignInError";
}

export class GithubOAuthIdentity implements GithubIdentity {
  constructor(
    private readonly app: GithubOAuthApp,
    private readonly send: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  authorizeUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.app.clientId,
      redirect_uri: this.app.redirectUri,
      scope: "read:user user:email",
      state,
      allow_signup: "true",
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  async profileFor(code: string): Promise<GithubProfile> {
    const accessToken = await this.exchange(code);
    const user = await this.get<GithubUser>("/user", accessToken);
    const email = user.email ?? (await this.primaryEmail(accessToken));

    return {
      githubId: String(user.id),
      login: user.login,
      email,
      name: user.name,
      avatarUrl: user.avatar_url,
    };
  }

  private async exchange(code: string): Promise<string> {
    const response = await this.send(tokenUrl, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json", "user-agent": userAgent },
      body: JSON.stringify({
        client_id: this.app.clientId,
        client_secret: this.app.clientSecret,
        code,
        redirect_uri: this.app.redirectUri,
      }),
    });
    const result = (await response.json()) as { access_token?: string; error?: string };
    if (!response.ok || !result.access_token)
      throw new GithubSignInError(result.error ?? `status ${response.status}`);

    return result.access_token;
  }

  private async primaryEmail(accessToken: string): Promise<string> {
    const emails = await this.get<GithubEmail[]>("/user/emails", accessToken);
    const email =
      emails.find((entry) => entry.primary && entry.verified) ?? emails.find((entry) => entry.verified);
    if (email === undefined) throw new GithubSignInError("no verified email");

    return email.email;
  }

  private async get<Body>(path: string, accessToken: string): Promise<Body> {
    const response = await this.send(`${apiUrl}${path}`, {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${accessToken}`,
        "user-agent": userAgent,
      },
    });
    if (!response.ok) throw new GithubSignInError(`GitHub ${path} answered ${response.status}`);

    return (await response.json()) as Body;
  }
}
