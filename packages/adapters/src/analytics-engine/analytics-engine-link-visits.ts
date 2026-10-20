import type { LinkVisit, LinkVisitsReader, StatsPeriod } from "@devlytics/core";
import { eventBlobColumns, eventDoubleColumns } from "./event-data-point";
import type { SqlRow, SqlRunner } from "./sql-runner";

type BlobName = (typeof eventBlobColumns)[number];
type DoubleName = (typeof eventDoubleColumns)[number];

const safeIdentifier = /^[\w-]+$/;
const safeSlug = /^[a-z0-9-]{1,64}$/;
const safeSession = /^[a-f0-9]{8,64}$/;
const maxVisits = 50;

const blob = (name: BlobName) => `blob${eventBlobColumns.indexOf(name) + 1}`;
const double = (name: DoubleName) => `double${eventDoubleColumns.indexOf(name) + 1}`;

export class AnalyticsEngineLinkVisits implements LinkVisitsReader {
  constructor(
    private readonly sql: SqlRunner,
    private readonly dataset: string,
  ) {}

  async visitsOf(siteId: string, slug: string, period: StatsPeriod): Promise<LinkVisit[]> {
    if (!safeSlug.test(slug)) throw new Error(`Refusing to query unsafe ref "${slug}"`);
    const scope = this.scopeOf(siteId, period);

    const opened = await this.sql.query(
      `SELECT ${blob("session")} AS session, MIN(${double("receivedAt")}) AS first ${scope} AND lower(${blob("ref")}) = '${slug}' GROUP BY session ORDER BY first DESC LIMIT ${maxVisits}`,
    );
    const sessions = opened
      .map((row) => String(row["session"]))
      .filter((session) => safeSession.test(session));
    if (sessions.length === 0) return [];

    const inSessions = `${scope} AND ${blob("session")} IN (${sessions.map((session) => `'${session}'`).join(", ")})`;
    const [summaries, projects, clicks] = await Promise.all([
      this.sql.query(
        `SELECT ${blob("session")} AS session, ${blob("country")} AS country, ${blob("device")} AS device, ${blob("browser")} AS browser, MIN(${double("receivedAt")}) AS first, MAX(${double("receivedAt")}) AS last, SUM(IF(${blob("type")} = 'attention' AND ${blob("kind")} = 'section', ${double("value")}, 0.0)) AS attention ${inSessions} GROUP BY session, country, device, browser`,
      ),
      this.sql.query(
        `SELECT ${blob("session")} AS session, ${blob("target")} AS name, SUM(${double("value")}) AS attention ${inSessions} AND ${blob("type")} = 'attention' AND ${blob("kind")} = 'project' GROUP BY session, name`,
      ),
      this.sql.query(
        `SELECT ${blob("session")} AS session, ${blob("action")} AS action, ${blob("project")} AS project, MIN(${double("receivedAt")}) AS at ${inSessions} AND ${blob("type")} = 'click' GROUP BY session, action, project`,
      ),
    ]);

    const openedAt = new Map(opened.map((row) => [String(row["session"]), numberOf(row["first"])]));
    return sessions
      .map((session) => visitOf(session, summaries, projects, clicks, openedAt.get(session) ?? 0))
      .filter((visit): visit is LinkVisit => visit !== null)
      .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime());
  }

  private scopeOf(siteId: string, period: StatsPeriod): string {
    if (!safeIdentifier.test(siteId) || !safeIdentifier.test(this.dataset)) {
      throw new Error(`Refusing to query unsafe identifiers "${siteId}" and "${this.dataset}"`);
    }
    const since = Math.floor(period.since.getTime() / 1000);
    const until = Math.floor(period.until.getTime() / 1000);
    return `FROM ${this.dataset} WHERE index1 = '${siteId}' AND timestamp >= toDateTime(${since}) AND timestamp < toDateTime(${until})`;
  }
}

function visitOf(
  session: string,
  summaries: SqlRow[],
  projects: SqlRow[],
  clicks: SqlRow[],
  openedAt: number,
): LinkVisit | null {
  const rows = summaries.filter((row) => row["session"] === session);
  if (rows.length === 0) return null;
  const main = rows.reduce((best, row) => (numberOf(row["last"]) > numberOf(best["last"]) ? row : best));

  return {
    openedAt: new Date(openedAt || Math.min(...rows.map((row) => numberOf(row["first"])))),
    lastSeenAt: new Date(Math.max(...rows.map((row) => numberOf(row["last"])))),
    country: String(main["country"] ?? "") || null,
    device: String(main["device"] ?? ""),
    browser: String(main["browser"] ?? ""),
    attentionMs: rows.reduce((total, row) => total + numberOf(row["attention"]), 0),
    projects: projects
      .filter((row) => row["session"] === session)
      .map((row) => ({ name: String(row["name"]), attentionMs: numberOf(row["attention"]) }))
      .sort((a, b) => b.attentionMs - a.attentionMs),
    clicks: clicks
      .filter((row) => row["session"] === session)
      .sort((a, b) => numberOf(a["at"]) - numberOf(b["at"]))
      .map((row) => ({ action: String(row["action"]), project: String(row["project"] ?? "") || null })),
  };
}

function numberOf(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.round(number) : 0;
}
