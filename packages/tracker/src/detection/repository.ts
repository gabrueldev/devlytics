const repositoryHosts = new Set(["github.com", "gitlab.com", "bitbucket.org"]);

export function hostnameOf(url: URL): string {
  return url.hostname.replace(/^www\./, "");
}

export function isRepositoryHost(url: URL): boolean {
  return repositoryHosts.has(hostnameOf(url));
}

export function repositoryOf(href: string): string | null {
  const url = safeUrl(href);
  if (url === null || !isRepositoryHost(url)) return null;

  const [owner, name] = url.pathname.split("/").filter(Boolean);
  return owner && name ? `${hostnameOf(url)}/${owner}/${name}`.toLowerCase() : null;
}

export function safeUrl(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}
