const supportedProtocols = new Set(["http:", "https:"]);
const hostnamePattern = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function normalizeDomain(hostname: string): string {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^www\./, "");
}

export function domainFromOrigin(origin: string): string | null {
  if (!URL.canParse(origin)) return null;

  const url = new URL(origin);
  if (!supportedProtocols.has(url.protocol) || url.hostname === "") return null;

  return normalizeDomain(url.hostname);
}

export function domainFromInput(input: string): string | null {
  const trimmed = input.trim();
  const withProtocol = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const domain = domainFromOrigin(withProtocol);
  return domain !== null && hostnamePattern.test(domain) ? domain : null;
}
