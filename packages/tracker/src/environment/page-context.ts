import type { CollectPayload } from "@devlytics/shared";

export type PageContext = Omit<CollectPayload, "events">;

export function collectEndpoint(scriptSource: string | undefined): string | null {
  return scriptSource ? new URL("/e", scriptSource).href : null;
}

export function pageUrlOf(location: Pick<Location, "origin" | "pathname">): string {
  return location.origin + location.pathname;
}

export function readPageContext(location: Location, documentReferrer: string): PageContext {
  const ref = new URLSearchParams(location.search).get("ref")?.trim().slice(0, 64);
  const referrer = externalReferrer(documentReferrer, location.hostname);

  return {
    url: pageUrlOf(location),
    ...(ref ? { ref } : {}),
    ...(referrer ? { referrer } : {}),
  };
}

function externalReferrer(documentReferrer: string, currentHostname: string): string | null {
  try {
    const hostname = new URL(documentReferrer).hostname.replace(/^www\./, "");
    return hostname === currentHostname.replace(/^www\./, "") ? null : hostname;
  } catch {
    return null;
  }
}
