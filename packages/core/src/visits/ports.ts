import type { Visit } from "./visit";

export interface EventStore {
  append(visit: Visit): Promise<void>;
}
