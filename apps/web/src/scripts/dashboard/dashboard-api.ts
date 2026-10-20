export interface SiteSummary {
  id: string;
  name: string;
  domain: string;
}

export interface Account {
  user: { login: string | null; name: string | null; email: string; avatarUrl: string | null };
  sites: SiteSummary[];
}

export interface Ranked {
  name: string;
  value: number;
}

export interface ProjectStats {
  name: string;
  visitors: number;
  attentionMs: number;
  repoClicks: number;
  demoClicks: number;
}

export interface SiteReport {
  site: SiteSummary;
  period: { days: number; since: string; until: string };
  visits: number;
  averageAttentionMs: number;
  daily: { day: string; visits: number }[];
  projects: ProjectStats[];
  sections: Ranked[];
  conversions: Ranked[];
  sources: Ranked[];
  countries: Ranked[];
}

export class SignedOutError extends Error {
  override readonly name = "SignedOutError";
}

export class DashboardApiError extends Error {
  override readonly name = "DashboardApiError";

  constructor(readonly code: string) {
    super(code);
  }
}

export class DashboardApi {
  constructor(private readonly baseUrl = "/api") {}

  account(): Promise<Account> {
    return this.request<Account>("/me");
  }

  addSite(input: { name: string; domain: string }): Promise<SiteSummary> {
    return this.request<SiteSummary>("/sites", { method: "POST", body: JSON.stringify(input) });
  }

  async removeSite(siteId: string): Promise<void> {
    await this.request<null>(`/sites/${encodeURIComponent(siteId)}`, { method: "DELETE" });
  }

  report(siteId: string, days: number): Promise<SiteReport> {
    return this.request<SiteReport>(`/sites/${encodeURIComponent(siteId)}/report?days=${days}`);
  }

  async signOut(): Promise<void> {
    await this.request<null>("/auth/logout", { method: "POST" });
  }

  private async request<Body>(path: string, init: RequestInit = {}): Promise<Body> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: "same-origin",
      headers: init.body ? { "content-type": "application/json" } : {},
    });
    if (response.status === 401) throw new SignedOutError();
    if (response.status === 204) return null as Body;
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new DashboardApiError(body.error ?? `status_${response.status}`);
    }
    return (await response.json()) as Body;
  }
}
