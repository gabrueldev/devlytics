import type { CachedToken, TokenCache } from "../cakto/cakto-access-tokens";

const keyOrigin = "https://tokens.devlytics.internal/";

export class EdgeTokenCache implements TokenCache {
  constructor(
    private readonly cache: Cache,
    private readonly now: () => number = Date.now,
  ) {}

  async read(key: string): Promise<CachedToken | null> {
    const response = await this.cache.match(this.urlOf(key));
    if (response === undefined) return null;
    const token = (await response.json()) as CachedToken;
    return token.expiresAt > this.now() ? token : null;
  }

  async write(key: string, token: CachedToken): Promise<void> {
    const seconds = Math.max(1, Math.floor((token.expiresAt - this.now()) / 1000));
    await this.cache.put(
      this.urlOf(key),
      Response.json(token, { headers: { "cache-control": `max-age=${seconds}` } }),
    );
  }

  async remove(key: string): Promise<void> {
    await this.cache.delete(this.urlOf(key));
  }

  private urlOf(key: string): string {
    return `${keyOrigin}${encodeURIComponent(key)}`;
  }
}
