# Changelog

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
