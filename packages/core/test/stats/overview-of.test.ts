import { describe, expect, it } from "vitest";
import { overviewOf } from "../../src";

describe("overviewOf", () => {
  it("reports zero attention instead of dividing by zero visits", () => {
    expect(overviewOf({ visits: 0, sectionAttentionMs: 0, repoClicks: 0, topProject: null })).toEqual({
      visits: 0,
      averageAttentionMs: 0,
      repoClicks: 0,
      topProject: null,
    });
  });
});
