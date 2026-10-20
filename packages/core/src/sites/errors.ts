export class InvalidOriginError extends Error {
  override readonly name = "InvalidOriginError";

  constructor(readonly origin: string | null) {
    super(`Cannot identify a site from origin "${origin ?? ""}"`);
  }
}

export class UnknownSiteError extends Error {
  override readonly name = "UnknownSiteError";

  constructor(readonly domain: string) {
    super(`No site is registered for "${domain}"`);
  }
}
