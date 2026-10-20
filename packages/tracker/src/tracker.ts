import { createTargetRegistry } from "./detection/target-registry";
import { collectEndpoint, pageUrlOf, readPageContext, type PageContext } from "./environment/page-context";
import { shouldTrack } from "./environment/should-track";
import { createEventBuffer } from "./event-buffer";
import { createAttentionMeter } from "./observers/attention-meter";
import { watchAttention } from "./observers/watch-attention";
import { watchClicks } from "./observers/watch-clicks";
import { watchScrollDepth } from "./observers/scroll-depth";
import { sendPayload } from "./transport";
import { watchDomChanges } from "./watch-dom-changes";
import { watchNavigation } from "./watch-navigation";

const flushIntervalMs = 10_000;

export function startTracker(scriptSource: string | undefined): void {
  const endpoint = collectEndpoint(scriptSource);
  if (endpoint === null || !shouldTrack(navigator, location)) return;

  const now = () => performance.now();
  const buffer = createEventBuffer();
  const meter = createAttentionMeter();
  const registry = createTargetRegistry(document);
  const observeTargets = watchAttention(meter, now);
  let context: PageContext = readPageContext(location, document.referrer);

  const flush = () => {
    const events = [...buffer.drain(), ...meter.drain(now())];
    if (events.length > 0) sendPayload(endpoint, { ...context, events });
  };

  const discoverTargets = () => observeTargets(registry.refresh());

  buffer.push({ type: "pageview" });
  flush();
  discoverTargets();

  const resetScrollDepth = watchScrollDepth((depth) => buffer.push({ type: "scroll", depth }));
  watchClicks(registry, (click) => buffer.push(click));
  watchDomChanges(discoverTargets);

  watchNavigation(() => {
    const url = pageUrlOf(location);
    if (url === context.url) return;

    flush();
    context = { ...context, url };
    buffer.push({ type: "pageview" });
    resetScrollDepth();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      meter.pause(now());
      flush();
    } else {
      meter.resume(now());
    }
  });

  window.addEventListener("pagehide", flush);
  setInterval(flush, flushIntervalMs);
}
