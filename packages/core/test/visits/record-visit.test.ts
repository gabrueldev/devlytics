import { describe, expect, it } from "vitest";
import { recordVisit, UnknownSiteError, type IncomingVisit, type Site } from "../../src";
import { InMemoryEventStore } from "../fakes/in-memory-event-store";
import { InMemorySiteRepository } from "../fakes/in-memory-site-repository";

const portfolio: Site = {
  id: "site_1",
  userId: "user_1",
  name: "Fulano",
  domain: "fulano.dev",
  createdAt: new Date("2026-10-01T00:00:00Z"),
};

const receivedAt = new Date("2026-10-20T12:00:00Z");
const chrome =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const incoming = (overrides: Partial<IncomingVisit> = {}): IncomingVisit => ({
  origin: "https://fulano.dev",
  ip: "203.0.113.7",
  userAgent: chrome,
  country: "BR",
  payload: {
    url: "https://fulano.dev/projects",
    ref: "nubank",
    referrer: "linkedin.com",
    events: [{ type: "pageview" }],
  },
  ...overrides,
});

const setUp = () => {
  const events = new InMemoryEventStore();
  const record = recordVisit({
    sites: new InMemorySiteRepository([portfolio]),
    events,
    sessionSeed: "seed",
    now: () => receivedAt,
  });
  return { events, record };
};

describe("recordVisit", () => {
  it("stores the batch with everything the dashboard needs and nothing personal", async () => {
    const { events, record } = setUp();

    await expect(record(incoming())).resolves.toBe("recorded");

    expect(events.visits).toEqual([
      {
        siteId: "site_1",
        sessionId: expect.stringMatching(/^[0-9a-f]{32}$/),
        path: "/projects",
        ref: "nubank",
        referrer: "linkedin.com",
        country: "BR",
        device: "desktop",
        browser: "chrome",
        receivedAt,
        events: [{ type: "pageview" }],
      },
    ]);
    expect(JSON.stringify(events.visits)).not.toContain("203.0.113.7");
  });

  it("falls back to the page address when the browser hides the origin", async () => {
    const { events, record } = setUp();

    await record(incoming({ origin: "null" }));

    expect(events.visits).toHaveLength(1);
  });

  it("trusts the browser origin over the page address in the body", async () => {
    const { record } = setUp();

    await expect(record(incoming({ origin: "https://stranger.dev" }))).rejects.toBeInstanceOf(
      UnknownSiteError,
    );
  });

  it("drops bots without storing anything", async () => {
    const { events, record } = setUp();

    await expect(record(incoming({ userAgent: "Googlebot/2.1" }))).resolves.toBe("ignored-bot");
    expect(events.visits).toEqual([]);
  });
});
