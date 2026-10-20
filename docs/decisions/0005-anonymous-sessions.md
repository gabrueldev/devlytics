# 0005 — Anonymous daily sessions

## Context

Portfolios should not need a cookie banner because of Devlytics, yet the dashboard must count unique visitors.

## Decision

- The tracker stores nothing in the browser.
- The server derives a daily salt as `HMAC-SHA256(DAILY_SALT_SEED, UTC day)` and a session id as `SHA-256(salt, domain, IP, User-Agent)`, truncated to 32 hex characters.
- The IP is used only to compute that hash and is never stored.

## Consequences

- The same visitor is one session for one UTC day on one portfolio, and cannot be followed to the next day or to another portfolio.
- The salt needs no storage: it is recomputed from the seed.
- Visitors on one shared network with identical browsers count as one, an accepted loss of precision.
