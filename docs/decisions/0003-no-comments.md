# 0003 — No comments in code

## Context

Comments drift away from the code they describe, and most of them explain what a better name would.

## Decision

Code carries no comments, enforced by the `devlytics/no-comments` lint rule. Only `eslint-` and `@ts-expect-error` directives are allowed.

## Consequences

- Names do the explaining: functions are verb phrases, types are named after their role.
- The reason behind a non-obvious choice is recorded here, in `docs/decisions`, and in test names.
