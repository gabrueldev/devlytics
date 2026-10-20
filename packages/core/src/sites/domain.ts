const supportedProtocols = new Set(["http:", "https:"]);

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
