# Repo Card

## Name

`patch-oc`

## One-Line Description

Local OpenClaw runtime hotfixes for installed packages.

## Layout

- `current-runtime-hotpatches/`: active Deno hotpatches for installed OpenClaw
  and installed plugin runtime bundles
- root docs: status, changelog, and handoff notes

## Current Recommendation

Use current runtime hotpatches only. Do not add source PR mailboxes, `git am`
patches, old compatibility patch sets, or PR tracking folders to this repo.

```bash
cd /path/to/patch-oc/current-runtime-hotpatches
./check_discord_reply_typing.sh
./apply_discord_reply_typing.sh
```

## What It Fixes

- Discord reply typing lifecycle starts late or blinks between accepted
  preflight and real reply dispatch
- blocked npm plugin install/update can leave an existing managed plugin
  uninstalled

## Typical Search Phrases

- `discord typing starts late`
- `discord typing gap before reply`
- `openclaw reply typing lifecycle`
- `openclaw plugin install rollback`
- `openclaw plugin install blocked leaves discord uninstalled`

## Canonical Commands

```bash
cd /path/to/patch-oc/current-runtime-hotpatches
./check_discord_reply_typing.sh
./apply_discord_reply_typing.sh

cd /path/to/patch-oc/current-runtime-hotpatches
./check.sh
./apply.sh
```

## Release

Unreleased local runtime hotfix catalog update after `v1.0.8`
