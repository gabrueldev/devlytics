export interface TrackedLink {
  id: string;
  siteId: string;
  slug: string;
  label: string;
  firstOpenedAt: Date | null;
  createdAt: Date;
}

export interface LinkVisit {
  openedAt: Date;
  lastSeenAt: Date;
  country: string | null;
  device: string;
  browser: string;
  attentionMs: number;
  projects: { name: string; attentionMs: number }[];
  clicks: { action: string; project: string | null }[];
}
