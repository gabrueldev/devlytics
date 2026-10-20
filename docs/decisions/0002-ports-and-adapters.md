# 0002 — Ports and adapters

## Context

The project must accept new features without breaking existing ones and stay easy to read.

## Decision

- `packages/core` holds business rules grouped by feature. It declares what it needs as interfaces in each feature's `ports.ts` and imports no runtime or vendor code.
- `packages/adapters` implements those ports for each vendor, named `<Vendor><Port>`, such as `D1SiteRepository`.
- `apps/*` parse requests, call the core, map results to responses and wire adapters into the core. They hold no rules and no queries.
- Dependencies point inwards only: apps → adapters → core.

## Consequences

- Core rules are tested in milliseconds with in-memory fakes.
- A new feature is a new folder in the core, a new adapter and a new route; existing modules stay untouched.
- The tracker is the exception: its 3 KB budget calls for small pure functions instead of layers.
