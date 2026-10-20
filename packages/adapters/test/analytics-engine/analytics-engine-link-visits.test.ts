import { describe, expect, it } from "vitest";
import { AnalyticsEngineLinkVisits, type SqlRow } from "../../src";

const period = { since: new Date("2026-10-13T00:00:00Z"), until: new Date("2026-10-20T00:00:00Z") };
const session = "7fd66f4a6fbe8135f8941a9fd89fedfb";

const answers = (sql: string): SqlRow[] => {
  if (sql.includes("lower(blob7) = 'nubank'")) return [{ session, first: 1_000 }];
  if (sql.includes("GROUP BY session, country"))
    return [
      {
        session,
        country: "BR",
        device: "desktop",
        browser: "chrome",
        first: 1_000,
        last: 241_000,
        attention: 90_000,
      },
    ];
  if (sql.includes("GROUP BY session, name")) return [{ session, name: "MagazineAPI", attention: 60_000 }];
  if (sql.includes("GROUP BY session, action"))
    return [{ session, action: "repo", project: "MagazineAPI", at: 5_000 }];
  return [];
};

describe("AnalyticsEngineLinkVisits", () => {
  it("follows the whole visit of whoever opened the link", async () => {
    const queries: string[] = [];
    const reader = new AnalyticsEngineLinkVisits(
      { query: async (sql) => (queries.push(sql), answers(sql)) },
      "devlytics_events",
    );

    await expect(reader.visitsOf("site_1", "nubank", period)).resolves.toEqual([
      {
        openedAt: new Date(1_000),
        lastSeenAt: new Date(241_000),
        country: "BR",
        device: "desktop",
        browser: "chrome",
        attentionMs: 90_000,
        projects: [{ name: "MagazineAPI", attentionMs: 60_000 }],
        clicks: [{ action: "repo", project: "MagazineAPI" }],
      },
    ]);
    expect(queries.slice(1).every((sql) => sql.includes(`blob12 IN ('${session}')`))).toBe(true);
  });

  it("asks nothing more when nobody opened the link yet", async () => {
    const queries: string[] = [];
    const reader = new AnalyticsEngineLinkVisits(
      { query: async (sql) => (queries.push(sql), []) },
      "devlytics_events",
    );

    await expect(reader.visitsOf("site_1", "nubank", period)).resolves.toEqual([]);
    expect(queries).toHaveLength(1);
  });

  it("refuses a ref that could break out of the query", async () => {
    const reader = new AnalyticsEngineLinkVisits({ query: async () => [] }, "devlytics_events");

    await expect(reader.visitsOf("site_1", "x' OR '1'='1", period)).rejects.toThrow();
  });
});
