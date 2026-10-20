# 0009 — Visit funnel

## Context

A portfolio has no checkout, so a classic conversion funnel does not fit. What a developer wants to know is how far a visitor went: did they stay, look at the projects, open one, and finally reach out?

## Decision

- Five stages: arrived, stayed (10 seconds of section attention), viewed projects, opened a project (`repo` or `demo` click) and contacted (`email`, `whatsapp`, `linkedin` or `cv` click).
- Each visit is placed at the furthest stage it reached, and a stage counts every visit at that stage or beyond. A visitor who clicks the e-mail without scrolling to the projects still counts as having passed through them, so the funnel never widens.
- The rule lives in `core` (`funnelOf`). The site report and the tracked-link timeline both feed it session journeys, so the overview and each link are measured the same way.
- The adapter reads one row per session and one per session action from Analytics Engine; no new event is collected.
- Tracked links show the same stages as a trail instead of a funnel, because a link usually has one or two visits.

## Consequences

- No new data and no change to the tag: the funnel works on events already stored.
- The 10-second threshold is a product choice, kept as `stayedAfterMs` in `core`.
- The report reads up to 20,000 sessions per period for the funnel, far above what a portfolio sees in 90 days.
