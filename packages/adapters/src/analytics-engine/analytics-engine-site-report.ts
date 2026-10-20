import type { Ranked, SiteReportData, SiteReportReader, StatsPeriod } from "@devlytics/core";
import { eventBlobColumns, eventDoubleColumns } from "./event-data-point";
import type { SqlRow, SqlRunner } from "./sql-runner";

type BlobName = (typeof eventBlobColumns)[number];
type DoubleName = (typeof eventDoubleColumns)[number];

const safeIdentifier = /^[\w-]+$/;
const rankedLimit = 10;
const projectLimit = 20;

const blob = (name: BlobName) => `blob${eventBlobColumns.indexOf(name) + 1}`;
const double = (name: DoubleName) => `double${eventDoubleColumns.indexOf(name) + 1}`;
const attentionMs = `SUM(${double("value")} * _sample_interval)`;
const sampledCount = "SUM(_sample_interval)";

export class AnalyticsEngineSiteReport implements SiteReportReader {
  constructor(
    private readonly sql: SqlRunner,
    private readonly dataset: string,
  ) {}

  async report(siteId: string, period: StatsPeriod): Promise<SiteReportData> {
    const scope = this.scopeOf(siteId, period);
    const type = (value: string) => `${blob("type")} = '${value}'`;

    const [visits, sectionTotal, daily, projects, projectClicks, sections, conversions, sources, countries] =
      await Promise.all([
        this.sql.query(`SELECT COUNT(DISTINCT ${blob("session")}) AS total ${scope}`),
        this.sql.query(
          `SELECT ${attentionMs} AS total ${scope} AND ${type("attention")} AND ${blob("kind")} = 'section'`,
        ),
        this.sql.query(
          `SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day, COUNT(DISTINCT ${blob("session")}) AS total ${scope} GROUP BY day ORDER BY day`,
        ),
        this.sql.query(
          `SELECT ${blob("target")} AS name, ${attentionMs} AS attention, COUNT(DISTINCT ${blob("session")}) AS visitors ${scope} AND ${type("attention")} AND ${blob("kind")} = 'project' GROUP BY name ORDER BY attention DESC LIMIT ${projectLimit}`,
        ),
        this.sql.query(
          `SELECT ${blob("project")} AS name, ${blob("action")} AS action, ${sampledCount} AS total ${scope} AND ${type("click")} AND ${blob("project")} != '' GROUP BY name, action`,
        ),
        this.ranked(
          `${blob("target")}`,
          attentionMs,
          `${scope} AND ${type("attention")} AND ${blob("kind")} = 'section'`,
        ),
        this.ranked(`${blob("action")}`, sampledCount, `${scope} AND ${type("click")}`),
        this.ranked(
          `${blob("referrer")}`,
          `COUNT(DISTINCT ${blob("session")})`,
          `${scope} AND ${type("pageview")}`,
        ),
        this.ranked(
          `${blob("country")}`,
          `COUNT(DISTINCT ${blob("session")})`,
          `${scope} AND ${type("pageview")}`,
        ),
      ]);

    const clicks = clicksByProject(projectClicks);

    return {
      visits: totalOf(visits),
      sectionAttentionMs: totalOf(sectionTotal),
      daily: daily.map((row) => ({ day: String(row["day"]).slice(0, 10), visits: numberOf(row["total"]) })),
      projects: projects.map((row) => {
        const name = String(row["name"]);
        return {
          name,
          visitors: numberOf(row["visitors"]),
          attentionMs: numberOf(row["attention"]),
          repoClicks: clicks.get(name)?.get("repo") ?? 0,
          demoClicks: clicks.get(name)?.get("demo") ?? 0,
        };
      }),
      sections,
      conversions,
      sources,
      countries,
    };
  }

  private async ranked(column: string, measure: string, from: string): Promise<Ranked[]> {
    const rows = await this.sql.query(
      `SELECT ${column} AS name, ${measure} AS value ${from} GROUP BY name ORDER BY value DESC LIMIT ${rankedLimit}`,
    );
    return rows.map((row) => ({ name: String(row["name"] ?? ""), value: numberOf(row["value"]) }));
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

function clicksByProject(rows: SqlRow[]): Map<string, Map<string, number>> {
  const clicks = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const project = String(row["name"]);
    const byAction = clicks.get(project) ?? new Map<string, number>();
    byAction.set(String(row["action"]), numberOf(row["total"]));
    clicks.set(project, byAction);
  }
  return clicks;
}

function totalOf(rows: SqlRow[]): number {
  return numberOf(rows[0]?.["total"]);
}

function numberOf(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.round(number) : 0;
}
