import { describe, expect, it } from "vitest";
import type { TrackedElement } from "../../src/detection/tracked-element";
import { createAttentionMeter } from "../../src/observers/attention-meter";

const store: TrackedElement = {
  element: document.createElement("article"),
  kind: "project",
  target: "Store",
};
const about: TrackedElement = {
  element: document.createElement("section"),
  kind: "section",
  target: "about",
};

describe("createAttentionMeter", () => {
  it("measures how long a target stayed in view", () => {
    const meter = createAttentionMeter();
    meter.show(store, 0);
    meter.hide(store, 4200);

    expect(meter.drain(5000)).toEqual([{ type: "attention", kind: "project", target: "Store", ms: 4200 }]);
  });

  it("does not count time while the tab is hidden", () => {
    const meter = createAttentionMeter();
    meter.show(store, 0);
    meter.pause(2000);
    meter.resume(60_000);
    meter.hide(store, 61_000);

    expect(meter.drain(61_000)).toEqual([{ type: "attention", kind: "project", target: "Store", ms: 3000 }]);
  });

  it("reports targets still in view and keeps measuring them", () => {
    const meter = createAttentionMeter();
    meter.show(about, 0);

    expect(meter.drain(10_000)).toEqual([
      { type: "attention", kind: "section", target: "about", ms: 10_000 },
    ]);
    expect(meter.drain(12_000)).toEqual([{ type: "attention", kind: "section", target: "about", ms: 2000 }]);
  });

  it("holds glances shorter than a second until they add up", () => {
    const meter = createAttentionMeter();
    meter.show(store, 0);
    meter.hide(store, 600);

    expect(meter.drain(600)).toEqual([]);

    meter.show(store, 1000);
    meter.hide(store, 1500);

    expect(meter.drain(1500)).toEqual([{ type: "attention", kind: "project", target: "Store", ms: 1100 }]);
  });

  it("never reports the same time twice", () => {
    const meter = createAttentionMeter();
    meter.show(store, 0);
    meter.hide(store, 2000);
    meter.drain(2000);

    expect(meter.drain(9000)).toEqual([]);
  });
});
