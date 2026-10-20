import { describe, expect, it } from "vitest";
import { collectEndpoint, readPageContext } from "../../src/environment/page-context";

const locationOf = (href: string) => new URL(href) as unknown as Location;

describe("readPageContext", () => {
  it("keeps the page without its query, the tracked ref and where the visitor came from", () => {
    const context = readPageContext(
      locationOf("https://fulano.dev/projects?ref=nubank&utm=x"),
      "https://www.linkedin.com/feed",
    );

    expect(context).toEqual({ url: "https://fulano.dev/projects", ref: "nubank", referrer: "linkedin.com" });
  });

  it("leaves out internal navigation as a referrer", () => {
    expect(readPageContext(locationOf("https://fulano.dev/"), "https://www.fulano.dev/about")).toEqual({
      url: "https://fulano.dev/",
    });
  });
});

describe("collectEndpoint", () => {
  it("sends events to the server that served the script", () => {
    expect(collectEndpoint("https://devlytics.gabrueldev.com/t.js")).toBe(
      "https://devlytics.gabrueldev.com/e",
    );
  });
});
