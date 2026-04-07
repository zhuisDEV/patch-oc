# Repo Card

## Name

`patch-oc`

## One-line description

Hot patches for installed OpenClaw runtimes.

## What it fixes

- context-engine plugins incorrectly classified as hook-only in status/inspect
- routed ACP replies replaying the same accumulated text again as a final reply

## Generality

- part `1` is generalized to any plugin with `kind: "context-engine"`
- part `2` is generalized at the routed ACP delivery layer, not Discord-only

## Typical search phrases

- `openclaw context-engine hook-only`
- `openclaw moon hook-only`
- `openclaw acp duplicate reply`
- `codex discord duplicate final replay`
- `dispatch-acp shouldTreatDeliveredTextAsVisible routed block`

## Canonical commands

```bash
./check.sh --part all
./apply.sh --part 1
./apply.sh --part 2
```

## Release

`v1.0.5`
