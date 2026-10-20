# 0004 — One public hostname

## Context

The install tag is a public contract and must never change, and the dashboard calls the API from the browser.

## Decision

Everything is served from `devlytics.gabrueldev.com`. The Worker that owns the hostname holds it as a custom domain, and the others claim their paths with routes, which take precedence over custom domains:

| Path            | Worker                                    |
| --------------- | ----------------------------------------- |
| `/t.js`, `/e`   | `ingest`                                  |
| `/api/*`        | `api`, mounted under the `/api` base path |
| everything else | `web`, once it exists                     |

## Consequences

- The tracker and the dashboard share one origin, so the API needs no CORS for its own site.
- Until `web` exists, `ingest` owns the custom domain. When `web` ships it takes the custom domain and `ingest` moves to routes for `/t.js` and `/e`.
