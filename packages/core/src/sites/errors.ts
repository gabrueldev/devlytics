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

export class InvalidDomainError extends Error {
  override readonly name = "InvalidDomainError";

  constructor(readonly input: string) {
    super(`"${input}" is not a domain`);
  }
}

export class DomainTakenError extends Error {
  override readonly name = "DomainTakenError";

  constructor(readonly domain: string) {
    super(`"${domain}" is already registered`);
  }
}

export class SiteNotFoundError extends Error {
  override readonly name = "SiteNotFoundError";

  constructor(readonly siteId: string) {
    super(`Site "${siteId}" does not exist for this user`);
  }
}
