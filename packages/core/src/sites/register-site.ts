import { domainFromInput } from "./domain";
import { DomainTakenError, InvalidDomainError } from "./errors";
import type { SiteCatalog } from "./ports";
import type { Site } from "./site";

const maxNameLength = 80;

export function registerSite(deps: { sites: SiteCatalog; newId: () => string; now: () => Date }) {
  return async (userId: string, input: { name: string; domain: string }): Promise<Site> => {
    const domain = domainFromInput(input.domain);
    if (domain === null) throw new InvalidDomainError(input.domain);
    if ((await deps.sites.findByDomain(domain)) !== null) throw new DomainTakenError(domain);

    const name = input.name.trim().slice(0, maxNameLength) || domain;
    const site: Site = { id: deps.newId(), userId, name, domain, createdAt: deps.now() };
    await deps.sites.add(site);
    return site;
  };
}
