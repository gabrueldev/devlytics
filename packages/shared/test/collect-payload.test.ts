import { describe, expect, it } from "vitest";
import { parseCollectPayload } from "../src";

const validPayload = {
  url: "https://fulano.dev/",
  referrer: "linkedin.com",
  ref: "nubank",
  events: [
    { type: "pageview" },
    { type: "attention", kind: "project", target: "Online store", ms: 8400 },
    { type: "scroll", depth: 75 },
    { type: "click", action: "repo", project: "Online store" },
  ],
};

const parse = (payload: unknown) => parseCollectPayload(JSON.stringify(payload));

describe("parseCollectPayload", () => {
  it("accepts every kind of event the tracker sends", () => {
    expect(parse(validPayload)).toEqual(validPayload);
  });

  it("rejects bodies that are not JSON", () => {
    expect(parseCollectPayload("{not json")).toBeNull();
  });

  it("rejects batches without events", () => {
    expect(parse({ ...validPayload, events: [] })).toBeNull();
  });

  it("rejects batches larger than a page could produce", () => {
    expect(
      parse({ ...validPayload, events: Array.from({ length: 101 }, () => ({ type: "pageview" })) }),
    ).toBeNull();
  });

  it("rejects pages that are not websites", () => {
    expect(parse({ ...validPayload, url: "file:///index.html" })).toBeNull();
  });

  it("rejects scroll depths outside the fixed buckets", () => {
    expect(parse({ ...validPayload, events: [{ type: "scroll", depth: 60 }] })).toBeNull();
  });

  it("rejects attention longer than half an hour in one batch", () => {
    const tooLong = { type: "attention", kind: "section", target: "about", ms: 31 * 60 * 1000 };
    expect(parse({ ...validPayload, events: [tooLong] })).toBeNull();
  });

  it("rejects unknown event types", () => {
    expect(parse({ ...validPayload, events: [{ type: "keystroke" }] })).toBeNull();
  });
});
