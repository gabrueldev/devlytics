import type { AttentionEvent } from "@devlytics/shared";
import type { TrackedElement } from "../detection/tracked-element";

export const minimumAttentionMs = 1000;

export interface AttentionMeter {
  show(target: TrackedElement, at: number): void;
  hide(target: TrackedElement, at: number): void;
  pause(at: number): void;
  resume(at: number): void;
  drain(at: number): AttentionEvent[];
}

export function createAttentionMeter(): AttentionMeter {
  const inView = new Set<TrackedElement>();
  const countingSince = new Map<TrackedElement, number>();
  const accumulated = new Map<TrackedElement, number>();
  let paused = false;

  const stopCounting = (target: TrackedElement, at: number) => {
    const since = countingSince.get(target);
    if (since === undefined) return;

    accumulated.set(target, (accumulated.get(target) ?? 0) + Math.max(0, at - since));
    countingSince.delete(target);
  };

  const startCounting = (target: TrackedElement, at: number) => {
    if (!paused && !countingSince.has(target)) countingSince.set(target, at);
  };

  return {
    show(target, at) {
      inView.add(target);
      startCounting(target, at);
    },

    hide(target, at) {
      inView.delete(target);
      stopCounting(target, at);
    },

    pause(at) {
      inView.forEach((target) => stopCounting(target, at));
      paused = true;
    },

    resume(at) {
      paused = false;
      inView.forEach((target) => startCounting(target, at));
    },

    drain(at) {
      [...countingSince.keys()].forEach((target) => {
        stopCounting(target, at);
        startCounting(target, at);
      });

      const ready = [...accumulated].filter(([, ms]) => ms >= minimumAttentionMs);
      ready.forEach(([target]) => accumulated.delete(target));

      return ready.map(([target, ms]) => ({
        type: "attention",
        kind: target.kind,
        target: target.target,
        ms: Math.round(ms),
      }));
    },
  };
}
