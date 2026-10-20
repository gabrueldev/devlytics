# 0001 — Run everything on Cloudflare

## Context

Portfolio analytics is a write-heavy workload: every visit produces several events, and traffic arrives in spikes when a portfolio gets shared.

## Decision

Workers for ingestion and the API, Workers Analytics Engine for raw events, D1 for relational data and daily rollups, Durable Objects for live updates, Cron Triggers for scheduled jobs.

## Consequences

- No servers, queues or Redis to operate; the edge absorbs spikes.
- Raw events live about three months in Analytics Engine, so a daily rollup into D1 keeps history.
- Analytics Engine samples at very high volume, so anything that must be exact (first opening of a tracked link, donations) is stored in D1.
- Business rules depend on ports, never on Cloudflare APIs, so leaving Cloudflare means writing new adapters only.
