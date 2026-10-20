import type { TrackedEvent } from "@devlytics/shared";

export interface EventBuffer {
  push(event: TrackedEvent): void;
  drain(): TrackedEvent[];
}

export function createEventBuffer(): EventBuffer {
  let events: TrackedEvent[] = [];

  return {
    push(event) {
      events.push(event);
    },

    drain() {
      const drained = events;
      events = [];
      return drained;
    },
  };
}
