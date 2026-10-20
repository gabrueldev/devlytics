import type { SiteStatsReader, SiteTotals, StatsPeriod } from "@devlytics/core";
import { eventBlobColumns, eventDoubleColumns } from "./event-data-point";
import type { SqlRow, SqlRunner } from "./sql-runner";

type BlobName = (typeof eventBlobColumns)[number];
type DoubleName = (typeof eventDoubleColumns)[number];

const safeIdentifier = /^[\w-]+$/;

const blob = (name: BlobName) => `blob${eventBlobColumns.indexOf(name) + 1}`;
const double = (name: DoubleName) => `double${eventDoubleColumns.indexOf(name) + 1}`;

export class AnalyticsEngineStatsReader implements SiteStatsReader {
  constructor(
    private readonly sql: SqlRunner,
    private readonly dataset: string,
  ) {}

  async totals(siteId: string, period: StatsPeriod): Promise<SiteTotals> {
    const scope = this.scopeOf(siteId, period);
    const attentionMs = `SUM(${double("value")} * _sample_interval)`;

    const [visits, sectionAttention, repoClicks, topProject] = await Promise.all([
      this.sql.query(`SELECT COUNT(DISTINCT ${blob("session")}) AS total ${scope}`),
      this.sql.query(
        `SELECT ${attentionMs} AS total ${scope} AND ${blob("type")} = 'attention' AND ${blob("kind")} = 'section'`,
      ),
      this.sql.query(
        `SELECT SUM(_sample_interval) AS total ${scope} AND ${blob("type")} = 'click' AND ${blob("action")} = 'repo'`,
      ),
      this.sql.query(
        `SELECT ${blob("target")} AS project, ${attentionMs} AS total ${scope} AND ${blob("type")} = 'attention' AND ${blob("kind")} = 'project' GROUP BY project ORDER BY total DESC LIMIT 1`,
      ),
    ]);

    return {
      visits: totalOf(visits),
      sectionAttentionMs: totalOf(sectionAttention),
      repoClicks: totalOf(repoClicks),
      topProject: projectOf(topProject),
    };
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

function totalOf(rows: SqlRow[]): number {
  const total = Number(rows[0]?.["total"] ?? 0);
  return Number.isFinite(total) ? Math.round(total) : 0;
}

function projectOf(rows: SqlRow[]): string | null {
  const project = rows[0]?.["project"];
  return typeof project === "string" && project !== "" ? project : null;
}
