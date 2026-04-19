# Repo Card

## Name

`patch-oc`

## One-line description

Hot patches for installed OpenClaw runtimes.

## What it fixes

- context-engine plugins incorrectly classified as hook-only in status/inspect
- routed ACP replies replaying the same accumulated text again as a final reply
- Discord child-placement primary bind failures when conversation id is
  `channel:<id>`

## Generality

- part `1` is generalized to any plugin with `kind: "context-engine"`
- part `2` is generalized at the routed ACP delivery layer, not Discord-only
- part `3` is targeted to Discord session binding adapter child-placement
  normalization

## Typical search phrases

- `openclaw context-engine hook-only`
- `openclaw moon hook-only`
- `openclaw acp duplicate reply`
- `codex discord duplicate final replay`
- `dispatch-acp shouldTreatDeliveredTextAsVisible routed block`
- `thread_binding_invalid Session binding adapter failed`
- `thread-bindings.manager channel prefix child placement`

## Canonical commands

```bash
./check.sh --part all
./apply.sh --part 1
./apply.sh --part 2
./apply.sh --part 3
```

## Release

`v1.0.8`
