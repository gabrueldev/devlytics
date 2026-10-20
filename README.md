# Devlytics

Free analytics built for developer portfolios: which projects get attention, what visitors click, and whether the link you sent to a company was opened.

One tag, no IDs, no cookies:

```html
<script defer src="https://devlytics.gabrueldev.com/t.js"></script>
```

> Work in progress.

## Development

Requires Node 24+ and pnpm.

```sh
pnpm install
pnpm test
pnpm dev
```

| Command          | What it does                                         |
| ---------------- | ---------------------------------------------------- |
| `pnpm typecheck` | Strict TypeScript across the workspace               |
| `pnpm lint`      | ESLint, including the no-comments rule               |
| `pnpm test`      | Vitest, running Workers code inside the real runtime |
| `pnpm build`     | Bundles each Worker without deploying                |

## Layout

```
apps/ingest       Worker that serves the tracker and receives events
apps/api          Worker for the dashboard API, webhooks and cron
packages/core     Business rules and ports, free of any vendor code
packages/adapters Port implementations for Cloudflare and third parties
packages/db       D1 schema and migrations
docs/decisions    Why things are the way they are
```
