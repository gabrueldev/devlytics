export interface CaktoCredentials {
  clientId: string;
  clientSecret: string;
}

export interface CachedToken {
  value: string;
  expiresAt: number;
}

export interface TokenCache {
  read(key: string): Promise<CachedToken | null>;
  write(key: string, token: CachedToken): Promise<void>;
  remove(key: string): Promise<void>;
}

const tokenUrl = "https://api.cakto.com.br/public_api/token/";
const renewBeforeExpiryMs = 5 * 60 * 1000;
const tokensByClient = new Map<string, CachedToken>();

export class CaktoAccessTokens {
  constructor(
    private readonly credentials: CaktoCredentials,
    private readonly send: typeof fetch = (input, init) => fetch(input, init),
    private readonly now: () => number = Date.now,
    private readonly shared: TokenCache | null = null,
  ) {}

  async current(): Promise<string> {
    const key = this.credentials.clientId;
    const local = tokensByClient.get(key);
    if (this.isFresh(local)) return local.value;

    const shared = await this.shared?.read(key);
    if (this.isFresh(shared)) {
      tokensByClient.set(key, shared);
      return shared.value;
    }

    const token = await this.issue();
    tokensByClient.set(key, token);
    await this.shared?.write(key, token);
    return token.value;
  }

  async forget(): Promise<void> {
    tokensByClient.delete(this.credentials.clientId);
    await this.shared?.remove(this.credentials.clientId);
  }

  private isFresh(token: CachedToken | null | undefined): token is CachedToken {
    return token != null && token.expiresAt - renewBeforeExpiryMs > this.now();
  }

  private async issue(): Promise<CachedToken> {
    const response = await this.send(tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
      }),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      const retryAfter = response.headers.get("retry-after") ?? "none";
      throw new Error(
        `Cakto token request failed with status ${response.status} (retry-after ${retryAfter}): ${detail}`,
      );
    }

    const { access_token, expires_in } = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    return { value: access_token, expiresAt: this.now() + expires_in * 1000 };
  }
}
