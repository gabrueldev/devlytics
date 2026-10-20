import { describe, expect, it } from "vitest";
import { anonymousSessionId } from "../../src";

const visitor = { domain: "fulano.dev", ip: "203.0.113.7", userAgent: "Mozilla/5.0 Chrome/130" };
const morning = new Date("2026-10-20T09:00:00Z");
const evening = new Date("2026-10-20T21:00:00Z");
const nextDay = new Date("2026-10-21T09:00:00Z");

describe("anonymousSessionId", () => {
  it("recognizes the same visitor during the same day", async () => {
    expect(await anonymousSessionId("seed", morning, visitor)).toBe(
      await anonymousSessionId("seed", evening, visitor),
    );
  });

  it("forgets the visitor when the day changes", async () => {
    expect(await anonymousSessionId("seed", morning, visitor)).not.toBe(
      await anonymousSessionId("seed", nextDay, visitor),
    );
  });

  it("cannot link the same visitor across different portfolios", async () => {
    expect(await anonymousSessionId("seed", morning, visitor)).not.toBe(
      await anonymousSessionId("seed", morning, { ...visitor, domain: "beltrano.dev" }),
    );
  });

  it("never contains the visitor IP", async () => {
    const sessionId = await anonymousSessionId("seed", morning, visitor);

    expect(sessionId).toMatch(/^[0-9a-f]{32}$/);
    expect(sessionId).not.toContain("203");
  });
});
