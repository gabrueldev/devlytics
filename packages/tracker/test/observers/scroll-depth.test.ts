import { describe, expect, it } from "vitest";
import { depthsReached, scrollPercentage } from "../../src/observers/scroll-depth";

describe("scrollPercentage", () => {
  it("measures the bottom of the viewport against the page height", () => {
    expect(scrollPercentage(0, 1000, 4000)).toBe(25);
    expect(scrollPercentage(2000, 1000, 4000)).toBe(75);
  });

  it("treats pages shorter than the screen as fully seen", () => {
    expect(scrollPercentage(0, 1000, 800)).toBe(100);
  });
});

describe("depthsReached", () => {
  it("reports every bucket passed at once, skipping those already reported", () => {
    expect(depthsReached(80, new Set([25]))).toEqual([50, 75]);
  });
});
