import { describe, expect, it } from "vitest";
import { funnelOf, furthestStage } from "../../src";

const journey = (attentionMs: number, viewedProjects = false, actions: string[] = []) => ({
  attentionMs,
  viewedProjects,
  actions,
});

describe("furthestStage", () => {
  it("needs ten seconds of attention before a visit counts as staying", () => {
    expect(furthestStage(journey(9_999))).toBe("arrived");
    expect(furthestStage(journey(10_000))).toBe("stayed");
  });

  it("ranks contact above opening a project and opening above just looking", () => {
    expect(furthestStage(journey(0, true))).toBe("viewedProjects");
    expect(furthestStage(journey(0, false, ["demo"]))).toBe("openedProject");
    expect(furthestStage(journey(0, false, ["repo", "cv"]))).toBe("contacted");
  });

  it("ignores clicks that are neither a project nor a contact", () => {
    expect(furthestStage(journey(0, false, ["github"]))).toBe("arrived");
  });
});

describe("funnelOf", () => {
  it("counts every visit in each stage it reached, so the funnel never widens", () => {
    const funnel = funnelOf([
      journey(1_000),
      journey(20_000),
      journey(20_000, true),
      journey(3_000, false, ["email"]),
    ]);

    expect(funnel).toEqual([
      { stage: "arrived", sessions: 4 },
      { stage: "stayed", sessions: 3 },
      { stage: "viewedProjects", sessions: 2 },
      { stage: "openedProject", sessions: 1 },
      { stage: "contacted", sessions: 1 },
    ]);
  });

  it("returns empty stages when nobody visited", () => {
    expect(funnelOf([]).every((step) => step.sessions === 0)).toBe(true);
  });
});
