import type { TrackedElement } from "../detection/tracked-element";
import type { AttentionMeter } from "./attention-meter";

const thresholds = Array.from({ length: 21 }, (_, step) => step / 20);

export function isAttended(entry: IntersectionObserverEntry, viewportHeight: number): boolean {
  return entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= viewportHeight / 2;
}

export function watchAttention(meter: AttentionMeter, now: () => number) {
  const targetsByElement = new Map<Element, TrackedElement[]>();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const attended = isAttended(entry, entry.rootBounds?.height ?? window.innerHeight);
        targetsByElement.get(entry.target)?.forEach((target) => {
          if (attended) meter.show(target, now());
          else meter.hide(target, now());
        });
      });
    },
    { threshold: thresholds },
  );

  return (targets: TrackedElement[]) => {
    targets.forEach((target) => {
      const existing = targetsByElement.get(target.element) ?? [];
      targetsByElement.set(target.element, [...existing, target]);
      observer.observe(target.element);
    });
  };
}
