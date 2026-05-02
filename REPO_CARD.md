# Repo Card

## Name

`patch-oc`

## One-line description

Personal OpenClaw source patches plus legacy runtime hotpatches.

## What it fixes

- current source patch: Discord reply typing lifecycle starts late or blinks
  between accepted preflight and real reply dispatch
- legacy runtime parts:
- context-engine plugins incorrectly classified as hook-only in status/inspect
- routed ACP replies replaying the same accumulated text again as a final reply
- Discord child-placement primary bind failures when conversation id is
  `channel:<id>`

## Current Recommendation

Apply the current source patch from an OpenClaw checkout:

```bash
git am /path/to/patch-oc/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch
```

The old runtime parts `1`, `2`, and `3` are deprecated compatibility patches for
older installs. They are not the default recommendation for current OpenClaw.

## Generality

- part `1` is generalized to any plugin with `kind: "context-engine"`
- part `2` is generalized at the routed ACP delivery layer, not Discord-only
- part `3` is targeted to Discord session binding adapter child-placement
  normalization

## Typical search phrases

- `discord typing starts late`
- `discord typing gap before reply`
- `openclaw reply typing lifecycle`
- `openclaw context-engine hook-only`
- `openclaw moon hook-only`
- `openclaw acp duplicate reply`
- `codex discord duplicate final replay`
- `dispatch-acp shouldTreatDeliveredTextAsVisible routed block`
- `thread_binding_invalid Session binding adapter failed`
- `thread-bindings.manager channel prefix child placement`

## Canonical commands

```bash
git am /path/to/patch-oc/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch
./check.sh --part all
./apply.sh --part 1
./apply.sh --part 2
./apply.sh --part 3
```

## Release

Unreleased local patch catalog update after `v1.0.8`
