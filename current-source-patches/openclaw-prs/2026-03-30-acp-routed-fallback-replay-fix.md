# OpenClaw Contribution Note — 2026-03-30

## PR

- Repository: `openclaw/openclaw`
- PR: [#56887](https://github.com/openclaw/openclaw/pull/56887)
- Branch: `codex/acp-routed-visible-text`

## Problem

ACP routed turns on Discord could reply twice: first as streamed/routed block
text, then again as final fallback text at end of turn.

## Root Cause

`dispatch-acp-delivery` visibility classification only reliably marked non-final
visible text for Telegram direct behavior, so routed Discord block delivery did
not always set `deliveredVisibleText=true`. Finalization then treated the turn
as not visibly delivered and replayed accumulated block text as a final message.

## Fix Strategy

Apply a minimal source fix at visibility classification and keep existing
Telegram direct behavior unchanged.

## Final Fix Applied

1. Added routed-context visibility handling in
   `src/auto-reply/reply/dispatch-acp-delivery.ts`.
2. Scoped routed visible override to `block` text only.
3. Kept `final` visible semantics as-is.
4. Preserved existing direct Telegram behavior (including tool visibility
   behavior).

## Tests

- Added routed Discord regression in `src/auto-reply/reply/dispatch-acp.test.ts`
  to assert no final fallback replay when routed block already delivered.
- Added guard in `src/auto-reply/reply/dispatch-acp-delivery.test.ts` to
  preserve direct Telegram tool visibility semantics.

## Reviewer Feedback Resolved

A bot review noted an unintended behavior change from a temporary
`kind === "tool"` early-return. That change was reverted, and fix scope was
narrowed to routed `block` only.

## Follow-up Commits

- `379fe4d49d` — initial routed visibility fix + Discord regression test.
- `2e4705dc49` — preserve Telegram direct tool visibility semantics.
- `bd39fba0bd` — scope routed override to block only (minimal impact).
