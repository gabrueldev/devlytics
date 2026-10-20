import { hostnameOf, isRepositoryHost, repositoryOf, safeUrl } from "./repository";

export function classifyLink(
  link: HTMLAnchorElement,
  insideProject: boolean,
  pageOrigin: string,
): string | null {
  if (link.protocol === "mailto:") return "email";

  const url = safeUrl(link.href);
  if (url === null) return null;

  const hostname = hostnameOf(url);
  if (repositoryOf(link.href) !== null) return "repo";
  if (isRepositoryHost(url)) return "github";
  if (hostname === "linkedin.com" || hostname.endsWith(".linkedin.com")) return "linkedin";
  if (hostname === "wa.me" || hostname.endsWith("whatsapp.com")) return "whatsapp";
  if (/\.pdf$/i.test(url.pathname)) return "cv";
  if (insideProject && url.origin !== pageOrigin) return "demo";

  return null;
}
