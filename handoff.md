# patch-oc handoff

## 2026-05-04

- Converted `patch-oc` to local runtime-hotfix-only scope.
  - Removed active source patch / PR mailbox material from this repo.
  - Removed stale legacy runtime hotpatch code and tests for the old
    context-engine, ACP duplicate-replay, and Discord child-binding parts.
  - Moved `patch_utils.ts` into `current-runtime-hotpatches/lib/` so active
    hotpatches are self-contained.
  - Root README now says future work must be checkable/applyable runtime
    hotpatches for installed OpenClaw or installed plugin bundles.
  - Upstream PR work should stay in `/Users/lilac/gh/openclaw` or a dedicated PR
    workspace; `patch-oc` should only keep the temporary local runtime coverage.
- Added a Discord reply typing lifecycle runtime hotpatch.
  - New patch: `patch_openclaw_discord_reply_typing_lifecycle.ts`.
  - Target: installed OpenClaw `dist/channel-lifecycle.core-*.js` plus installed
    `@openclaw/discord` `dist/message-handler-*.js` and
    `dist/message-handler.process-*.js` bundles.
  - Purpose: runtime version of the accepted Discord reply typing feedback
    lifecycle fix while the upstream PR is pending.
  - Check with `current-runtime-hotpatches/check_discord_reply_typing.sh`; apply
    with `current-runtime-hotpatches/apply_discord_reply_typing.sh`.
  - This change added the patch to `patch-oc` and validated it against a temp
    copy of the installed bundles, but did not apply it to the global install.
- Added current runtime hotpatch support under `current-runtime-hotpatches/`.
  - New patch: `patch_openclaw_installer_rollback.ts`.
  - Target: installed OpenClaw `dist/install-*.js` bundles.
  - Purpose: temporary local coverage for upstream PR #77237 until a packaged
    release includes snapshot/restore rollback for managed npm plugin installs.
  - The patcher backs up changed install bundles with
    `.bak-npm-plugin-install-rollback`.
  - It should be checked with `current-runtime-hotpatches/check.sh` and applied
    with `current-runtime-hotpatches/apply.sh`; this change added the patch to
    `patch-oc` but did not apply it to the global OpenClaw install.

## 2026-05-03

- Reorganized the repo so current and legacy patch material no longer share the
  root.
  - current source patch material existed temporarily, but was later removed by
    the 2026-05-04 local-hotfix-only conversion.
  - legacy runtime hotpatch CLI existed temporarily, but was later removed by
    the 2026-05-04 stale-code cleanup.
  - repo root: documentation and metadata only
- Updated root documentation, repo card, and per-folder READMEs for the new
  paths.
- Merged OpenClaw PR patch material into this repo temporarily. That source
  patch material is no longer kept here after the 2026-05-04 conversion.
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
- Current practical guidance is superseded by the `2026-05-04` local-hotfix-only
  conversion above: add local temporary coverage as runtime hotpatches under
  `current-runtime-hotpatches/`.

## 2026-04-20

- Part `1` was already included in OpenClaw `2026.4.15`. It was kept only for
  older installs.
- Part `2` had been fixed by another upstream OpenClaw update path for the
  tracked Discord case and was expected to become removable.
- Part `3` was still uncertain at that time and needed more runtime testing.
