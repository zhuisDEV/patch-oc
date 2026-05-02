# Changelog

## Unreleased - 2026-05-03

- Split the repo by patch lifecycle:
  - current source patches now live under `current-source-patches/`
  - old Deno runtime scripts now live under `legacy-runtime-hotpatches/`
  - root now contains repo-level docs and metadata only
- Refreshed the Discord reply typing lifecycle source patch after PR review.
  - The portable patch now includes the skipped queued-run cleanup repair.
- Merged the OpenClaw PR patch workspace into
  `current-source-patches/openclaw-prs/`.
  - Added
    `current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch`.
  - Kept the prior PR notes from `/Users/lilac/gh/openclaw-prs`.
- Marked the existing runtime hotpatch parts `1`, `2`, and `3` as legacy
  compatibility patches rather than current recommendations.
- Documented the current review:
  - part `1` is fixed upstream by context-engine capability entries
  - part `2` is superseded for the Discord duplicate-reply case by channel
    delivered-text visibility hooks
  - part `3` is fixed upstream by Discord binding channel-id normalization

## v1.0.8 - 2026-04-20

- Documented maintenance status for all three patch parts.
- Clarified that part `1` is already included in OpenClaw `2026.4.15` and is now
  primarily a compatibility path for older installs.
- Clarified that part `2` may become removable once future OpenClaw updates
  consistently upstream the ACP duplicate-replay fix.
- Added `handoff.md` to capture release-maintenance guidance for future cleanup
  decisions, including the current uncertainty around part `3`.

## v1.0.7 - 2026-04-10

- Reduced part `1` noisy `SKIPPED` output by adding content-probe prefiltering
  in patch candidate selection.
  - new patch-definition field: `candidateContainsAny`
  - part `1` now only evaluates `status-*.js` files that contain
    `function buildCapabilityEntries(plugin) {`
- Added regression test coverage for content-probe file filtering in:
  - `tests/patch_utils_test.ts`
- Kept patch behavior unchanged; only candidate selection/output quality
  improved.

## v1.0.6 - 2026-04-10

- Added part `3` (`discord-child-primary-binding`) to patch Discord
  child-placement primary binding normalization so `channel:<id>` conversation
  IDs are converted to raw IDs before parent channel resolution.
- Added a dedicated entrypoint:
  - `patch_openclaw_discord_child_primary_binding.ts`
- Added regression coverage for part `3` patch behavior and file targeting.
- Updated docs and CLI examples for three-part patch selection (`1`, `2`, `3`,
  `all`).

## v1.0.5 - 2026-04-07

- Updated part `2` file targeting so it also matches the current delegated ACP
  runtime bundle shape (`dispatch-acp-*.js`) used by newer OpenClaw builds.
- Added regression coverage for the new delegated ACP bundle name to prevent
  future selector drift.

## v1.0.4 - 2026-04-02

- Fixed part `2` so non-tool ACP block/final text is counted as visible on
  direct Discord turns too, which suppresses the duplicate final replay.
- Simplified the part `2` patch logic to patch the ACP visibility function
  directly instead of relying on routed call-site markers.
- Updated tests and docs to match the corrected generalized behavior.

## v1.0.3 - 2026-04-02

- Fixed part `2` bundle targeting so it matches both:
  - `dispatch-acp.runtime-<hash>.js`
  - `dispatch-acp.runtime.js`
- Broadened OpenClaw root detection with package-manager roots from `npm`,
  `pnpm`, and `yarn`, reducing dependency on host-specific default paths.
- Updated verification docs to use generic `OPENCLAW_ROOT`/`--openclaw-root`
  patterns instead of Homebrew-only paths.

## v1.0.2 - 2026-04-02

- Improved part `2` portability across runtime shape drift:
  - keeps the existing routed visibility + call-site patch path
  - adds a compatibility fallback that patches the end-of-turn final replay
    condition with `params.delivery.getRoutedCounts().block === 0`
- Added tests for compatibility-path patching and "already patched" detection
  using the fallback guard marker.

## v1.0.1 - 2026-04-01

- Added an agent-operations guide for single-approval patch flow using a stable
  local checkout.
- Added post-apply optional cleanup instructions for removing the local
  `patch-oc` checkout safely.
- Clarified that removing the local repo does not revert already-applied runtime
  patch changes.

## v1.0.0 - 2026-04-01

- Added a unified `patch_oc.ts` CLI with part selection for part `1`, part `2`,
  or both.
- Kept part-specific entrypoints for direct single-patch usage.
- Refactored duplicate patch-script runtime logic into shared library modules.
- Added tests for both runtime transforms.
- Added release-grade documentation for diagnosis, application, verification,
  backups, and discovery metadata.
