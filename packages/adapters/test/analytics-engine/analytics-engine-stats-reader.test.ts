import { describe, expect, it } from "vitest";
import { AnalyticsEngineStatsReader, type SqlRow, type SqlRunner } from "../../src";

class ScriptedSqlRunner implements SqlRunner {
  readonly queries: string[] = [];

  constructor(private readonly answer: (sql: string) => SqlRow[]) {}

  async query(sql: string): Promise<SqlRow[]> {
    this.queries.push(sql);
    return this.answer(sql);
  }
}

const period = { since: new Date("2026-10-20T00:00:00Z"), until: new Date("2026-10-27T00:00:00Z") };

const answers = (sql: string): SqlRow[] => {
  if (sql.includes("COUNT(DISTINCT blob12)")) return [{ total: "40" }];
  if (sql.includes("blob3 = 'section'")) return [{ total: 3_000_000.4 }];
  if (sql.includes("blob4 = 'repo'")) return [{ total: "12" }];
  if (sql.includes("GROUP BY project")) return [{ project: "MagazineAPI", total: 90_000 }];
  return [];
};

describe("AnalyticsEngineStatsReader", () => {
  it("turns the SQL answers into site totals", async () => {
    const reader = new AnalyticsEngineStatsReader(new ScriptedSqlRunner(answers), "devlytics_events");

    await expect(reader.totals("site_demo", period)).resolves.toEqual({
      visits: 40,
      sectionAttentionMs: 3_000_000,
      repoClicks: 12,
      topProject: "MagazineAPI",
    });
  });

  it("scopes every query to the site and the period", async () => {
    const runner = new ScriptedSqlRunner(answers);
    await new AnalyticsEngineStatsReader(runner, "devlytics_events").totals("site_demo", period);

    expect(runner.queries).toHaveLength(4);
    runner.queries.forEach((sql) => {
      expect(sql).toContain("FROM devlytics_events WHERE index1 = 'site_demo'");
      expect(sql).toContain("timestamp >= toDateTime(1792454400) AND timestamp < toDateTime(1793059200)");
    });
  });

  it("weights counts by the sample interval", async () => {
    const runner = new ScriptedSqlRunner(answers);
    await new AnalyticsEngineStatsReader(runner, "devlytics_events").totals("site_demo", period);

    expect(runner.queries.filter((sql) => sql.includes("_sample_interval"))).toHaveLength(3);
  });

  it("reports no top project when nobody looked at one", async () => {
    const reader = new AnalyticsEngineStatsReader(new ScriptedSqlRunner(() => []), "devlytics_events");

    await expect(reader.totals("site_demo", period)).resolves.toEqual({
      visits: 0,
      sectionAttentionMs: 0,
      repoClicks: 0,
      topProject: null,
    });
  });

  it("refuses identifiers that could break out of the query", async () => {
    const reader = new AnalyticsEngineStatsReader(new ScriptedSqlRunner(answers), "devlytics_events");

    await expect(reader.totals("x' OR '1'='1", period)).rejects.toThrow("unsafe");
  });
});
