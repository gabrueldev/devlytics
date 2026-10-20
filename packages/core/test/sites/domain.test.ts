import { describe, expect, it } from "vitest";
import { domainFromOrigin, normalizeDomain } from "../../src";

describe("normalizeDomain", () => {
  it("treats www and casing as the same site", () => {
    expect(normalizeDomain("WWW.Fulano.Dev")).toBe("fulano.dev");
  });

  it("drops the trailing dot of fully qualified names", () => {
    expect(normalizeDomain("fulano.dev.")).toBe("fulano.dev");
  });

  it("keeps subdomains other than www", () => {
    expect(normalizeDomain("blog.fulano.dev")).toBe("blog.fulano.dev");
  });
});

describe("domainFromOrigin", () => {
  it("reads the domain from an https origin", () => {
    expect(domainFromOrigin("https://www.fulano.dev")).toBe("fulano.dev");
  });

  it("ignores the port", () => {
    expect(domainFromOrigin("http://fulano.dev:8080")).toBe("fulano.dev");
  });

  it.each(["", "null", "not a url", "file:///index.html", "chrome-extension://abc"])(
    "rejects %j",
    (origin) => {
      expect(domainFromOrigin(origin)).toBeNull();
    },
  );
});
