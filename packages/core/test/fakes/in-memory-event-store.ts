import type { EventStore, Visit } from "../../src";

export class InMemoryEventStore implements EventStore {
  readonly visits: Visit[] = [];

  async append(visit: Visit): Promise<void> {
    this.visits.push(visit);
  }
}
