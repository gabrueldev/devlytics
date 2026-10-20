import type { EventStore, Visit } from "@devlytics/core";
import { toDataPoint } from "./event-data-point";

export class AnalyticsEngineEventStore implements EventStore {
  constructor(private readonly dataset: AnalyticsEngineDataset) {}

  async append(visit: Visit): Promise<void> {
    visit.events.forEach((event) => this.dataset.writeDataPoint(toDataPoint(visit, event)));
  }
}
