import { describe, expect, it } from "vitest";
import { shouldTrack } from "../../src/environment/should-track";

const live = { protocol: "https:", hostname: "fulano.dev" };

describe("shouldTrack", () => {
  it("tracks real visitors on a published site", () => {
    expect(shouldTrack({ doNotTrack: null }, live)).toBe(true);
  });

  it.each(["localhost", "127.0.0.1", "portfolio.local", "site.test"])(
    "skips the developer's own machine at %s",
    (hostname) => {
      expect(shouldTrack({}, { protocol: "http:", hostname })).toBe(false);
    },
  );

  it("skips pages opened from disk", () => {
    expect(shouldTrack({}, { protocol: "file:", hostname: "" })).toBe(false);
  });

  it("respects Do Not Track and Global Privacy Control", () => {
    expect(shouldTrack({ doNotTrack: "1" }, live)).toBe(false);
    expect(shouldTrack({ globalPrivacyControl: true }, live)).toBe(false);
  });

  it("skips automated browsers", () => {
    expect(shouldTrack({ webdriver: true }, live)).toBe(false);
  });
});
