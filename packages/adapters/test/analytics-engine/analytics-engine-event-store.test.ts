import type { Visit } from "@devlytics/core";
import { describe, expect, it } from "vitest";
import { AnalyticsEngineEventStore, eventBlobColumns, eventDoubleColumns } from "../../src";

class RecordingDataset implements AnalyticsEngineDataset {
  readonly points: AnalyticsEngineDataPoint[] = [];

  writeDataPoint(point?: AnalyticsEngineDataPoint): void {
    if (point !== undefined) this.points.push(point);
  }
}

const visit: Visit = {
  siteId: "site_1",
  sessionId: "a".repeat(32),
  path: "/projects",
  ref: "nubank",
  referrer: "linkedin.com",
  country: "BR",
  device: "mobile",
  browser: "safari",
  receivedAt: new Date("2026-10-20T12:00:00Z"),
  events: [
    { type: "pageview" },
    { type: "attention", kind: "project", target: "Store", ms: 8400 },
    { type: "scroll", depth: 75 },
    { type: "click", action: "repo", project: "Store" },
  ],
};

const columnsOf = (point: AnalyticsEngineDataPoint | undefined) => ({
  index: point?.indexes?.[0],
  ...Object.fromEntries(eventBlobColumns.map((column, position) => [column, point?.blobs?.[position]])),
  ...Object.fromEntries(eventDoubleColumns.map((column, position) => [column, point?.doubles?.[position]])),
});

const visitColumns = {
  index: "site_1",
  path: "/projects",
  ref: "nubank",
  referrer: "linkedin.com",
  country: "BR",
  device: "mobile",
  browser: "safari",
  session: "a".repeat(32),
  receivedAt: Date.parse("2026-10-20T12:00:00Z"),
};

describe("AnalyticsEngineEventStore", () => {
  it("writes one data point per event, indexed by site", async () => {
    const dataset = new RecordingDataset();
    await new AnalyticsEngineEventStore(dataset).append(visit);

    expect(dataset.points.map(columnsOf)).toEqual([
      { ...visitColumns, type: "pageview", target: "", kind: "", action: "", project: "", value: 0 },
      {
        ...visitColumns,
        type: "attention",
        target: "Store",
        kind: "project",
        action: "",
        project: "",
        value: 8400,
      },
      { ...visitColumns, type: "scroll", target: "", kind: "", action: "", project: "", value: 75 },
      { ...visitColumns, type: "click", target: "", kind: "", action: "repo", project: "Store", value: 0 },
    ]);
  });
});
