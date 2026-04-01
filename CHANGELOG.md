# Changelog

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
