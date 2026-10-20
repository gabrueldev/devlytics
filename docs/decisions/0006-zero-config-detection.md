# 0006 — Zero-config detection

## Context

Installation must be a single tag, so the tracker has to understand a portfolio without markup.

## Decision

- Sections are `<section id>` elements or anything marked `data-section`.
- A project is the nearest ancestor of a repository link (GitHub, GitLab, Bitbucket with owner and name) that contains a heading, as long as it holds exactly one repository. Its name is that heading.
- Once a page marks any `data-project`, only marked projects count, so developers can take full control.
- Attention counts while at least half of an element, or half of the viewport, is covered by it, and only with the tab visible. Glances under a second wait until they add up.
- Detection reruns when the DOM settles, which covers client-rendered portfolios and SPA navigation.
- The tracker imports only types and zod-free constants from `@devlytics/shared`, and a test keeps the bundle under 3 KB gzipped.

## Consequences

- Projects without a repository link need `data-project`.
- Untitled cards are skipped rather than guessed.
