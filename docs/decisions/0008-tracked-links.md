# 0008 — Tracked links

## Context

Developers send their portfolio to companies and want to know if it was opened and what was seen, without asking the recruiter to do anything special.

## Decision

- A tracked link is the portfolio URL plus `?ref=<slug>`. The slug comes from a label the owner types, such as "Nubank — Front-end Pleno".
- The tracker sends `ref` with the landing page only. The timeline finds the sessions that landed with that `ref` and then follows each whole session, so later pages and clicks are included.
- The first opening is written to D1 with `UPDATE … WHERE first_opened_at IS NULL RETURNING`. Only the request that wins that update sends the email, so a link never notifies twice.
- The email is sent from the ingest Worker inside `waitUntil`, so the visitor's request never waits on Resend.

## Consequences

- No redirect service and no extra domain: the link opens the real portfolio.
- Anyone can add a `ref` by hand; unknown slugs are ignored.
- Visits are read from Analytics Engine, so the timeline covers the last 90 days, while the first opening date is kept in D1 forever.
