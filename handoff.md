# patch-oc handoff

## 2026-05-04

- Checked
  `current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch`
  against current `/Users/lilac/gh/openclaw` `origin/main` at
  `9cc802241c7fd4be55ddfe8a2c0176e898e98b7c`.
- The old patch was stale and failed to apply to current OpenClaw after upstream
  Discord test/runtime shape changes.
- Refreshed the source patch from rebased PR branch
  `zhuisDEV/codex/discord-reply-typing-lifecycle`.
  - latest upstream PR commit: `81075df0e5b0ffb2f6f4e539c4ce195f48ec9690`
  - current patch SHA-256:
    `1cec8fe8a60cfc00592026e488d5b8c4606637779ff607f6daa93f499db4b1ab`
  - patch shape: four-commit `git am` mailbox
- Apply smoke passed with `git am` on a clean temporary OpenClaw worktree based
  at `origin/main` `9cc802241c7fd4be55ddfe8a2c0176e898e98b7c`.

## 2026-05-03

- Reorganized the repo so current and legacy patch material no longer share the
  root.
  - current source patches: `current-source-patches/openclaw-prs/`
  - legacy runtime hotpatch CLI: `legacy-runtime-hotpatches/`
  - repo root: documentation and metadata only
- Updated root documentation, repo card, and per-folder READMEs for the new
  paths.
- Merged `/Users/lilac/gh/openclaw-prs` into this repo under
  `/Users/lilac/gh/patch-oc/current-source-patches/openclaw-prs`.
  - current source patch:
    `current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch`
  - current patch SHA-256 after PR review repairs:
    `2d95762523a3703eb898fbe1bee0ebbba8a1c3be6338f87369073d759a082243`
  - latest upstream PR commit: `3f81d745dad4d56814df58663fca3076e0b36f7b`
- Reviewed the legacy runtime hotpatch parts against current fetched
  `/Users/lilac/gh/openclaw` `origin/main` at `c8fa0fd1c9`.
  - part `1` no longer needed for current upstream:
    `src/plugins/inspect-shape.ts` includes `context-engine` capability
    handling.
  - part `2` is superseded for the tracked Discord ACP duplicate-reply case:
    Discord now exposes `shouldTreatDeliveredTextAsVisible` from its channel
    plugin. The older broad runtime patch can still report `PATCHED` against
    some installed bundles because core fallback behavior is narrower than the
    old local transform.
  - part `3` no longer needed for current upstream: Discord child binding uses
    normalized parent channel ids and `resolveChannelIdForBinding(...)`
    normalizes `channel:<id>` inputs.
- Current practical guidance:
  - Use the source patch in `current-source-patches/openclaw-prs/` for the
    Discord reply typing lifecycle work.
  - Treat runtime parts `1`, `2`, and `3` as deprecated compatibility patches
    for old installs only.
  - Run legacy runtime commands from `legacy-runtime-hotpatches/`; do not use
    `./apply.sh --part all` on current OpenClaw unless an explicit old-runtime
    check justifies it.

## 2026-04-20

- Part `1` was already included in OpenClaw `2026.4.15`. It was kept only for
  older installs.
- Part `2` had been fixed by another upstream OpenClaw update path for the
  tracked Discord case and was expected to become removable.
- Part `3` was still uncertain at that time and needed more runtime testing.
