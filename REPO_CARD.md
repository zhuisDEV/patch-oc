# Repo Card

## Name

`patch-oc`

## One-Line Description

Personal OpenClaw source patches plus legacy runtime hotpatches.

## Layout

- `current-source-patches/`: current source patches for an OpenClaw git checkout
- `legacy-runtime-hotpatches/`: old Deno scripts for installed runtime bundles
- root docs: status, changelog, and handoff notes

## Current Recommendation

Apply the current source patch from an OpenClaw checkout:

```bash
git am /path/to/patch-oc/current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch
```

## What It Fixes

- current source patch: Discord reply typing lifecycle starts late or blinks
  between accepted preflight and real reply dispatch
- legacy runtime parts:
  - context-engine plugins incorrectly classified as hook-only in status/inspect
  - routed ACP replies replaying accumulated text again as a final reply
  - Discord child-placement primary bind failures when conversation id is
    `channel:<id>`

The old runtime parts `1`, `2`, and `3` are deprecated compatibility patches for
older installs. They are not the default recommendation for current OpenClaw.

## Generality

- part `1` is generalized to any plugin with `kind: "context-engine"`
- part `2` is generalized at the routed ACP delivery layer, not Discord-only
- part `3` is targeted to Discord session binding adapter child-placement
  normalization

## Typical Search Phrases

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

## Canonical Commands

```bash
git am /path/to/patch-oc/current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch
cd /path/to/patch-oc/legacy-runtime-hotpatches
./check.sh --part <1|2|3>
./apply.sh --part <1|2|3>
```

## Release

Unreleased local patch catalog update after `v1.0.8`
