export interface CaktoCredentials {
  clientId: string;
  clientSecret: string;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

const tokenUrl = "https://api.cakto.com.br/public_api/token/";
const renewBeforeExpiryMs = 5 * 60 * 1000;
const tokensByClient = new Map<string, CachedToken>();

export class CaktoAccessTokens {
  constructor(
    private readonly credentials: CaktoCredentials,
    private readonly send: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  async current(): Promise<string> {
    const cached = tokensByClient.get(this.credentials.clientId);
    if (cached !== undefined && cached.expiresAt - renewBeforeExpiryMs > this.now()) return cached.value;

    const token = await this.issue();
    tokensByClient.set(this.credentials.clientId, token);
    return token.value;
  }

  forget(): void {
    tokensByClient.delete(this.credentials.clientId);
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
    if (!response.ok) throw new Error(`Cakto token request failed with status ${response.status}`);

    const { access_token, expires_in } = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    return { value: access_token, expiresAt: this.now() + expires_in * 1000 };
  }
}
