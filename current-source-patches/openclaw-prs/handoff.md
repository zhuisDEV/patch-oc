# Handoff

## 2026-05-04

- Refreshed the portable source patch from the rebased OpenClaw PR branch:
  `zhuisDEV/codex/discord-reply-typing-lifecycle`.
- Upstream draft PR: `https://github.com/openclaw/openclaw/pull/76091`
- OpenClaw base checked: `origin/main` at
  `9cc802241c7fd4be55ddfe8a2c0176e898e98b7c`
- Latest PR commit: `81075df0e5b0ffb2f6f4e539c4ce195f48ec9690`
- Patch file now contains a four-commit `git am` mailbox:
  - `69ad08a465b98e8e4c3d9ce16696772804da64e8`
    `Fix Discord reply typing lifecycle`
  - `0ad96afca933d6a7e5a7194c9b27d515ba19367c`
    `fix(discord): clean skipped reply typing feedback`
  - `c70b79e9fa4a89078341989a13db72ba255347db`
    `fix(channels): retry tripped typing starts`
  - `81075df0e5b0ffb2f6f4e539c4ce195f48ec9690`
    `test(discord): align typing lifecycle fixtures`
- Current patch SHA-256:
  `1cec8fe8a60cfc00592026e488d5b8c4606637779ff607f6daa93f499db4b1ab`
- Apply smoke passed with `git am` on a clean temporary OpenClaw worktree based
  at `origin/main` `9cc802241c7fd4be55ddfe8a2c0176e898e98b7c`.

## 2026-05-03

- Added portable source patch for Discord reply typing lifecycle:
  `current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch`.
- Upstream draft PR: `https://github.com/openclaw/openclaw/pull/76091`
- Branch: `zhuisDEV/codex/discord-reply-typing-lifecycle`
- Latest commit: `3f81d745dad4d56814df58663fca3076e0b36f7b`
- Patch file now contains a three-commit `git am` mailbox:
  - `fb59ff626af60e88b08d4b82c6da350a9fbdd7d5`
    `Fix Discord reply typing lifecycle`
  - `42242c8396a8a19261efb446fe948573473a7828`
    `fix(discord): clean skipped reply typing feedback`
  - `3f81d745dad4d56814df58663fca3076e0b36f7b`
    `fix(channels): retry tripped typing starts`
- Current patch SHA-256:
  `2d95762523a3703eb898fbe1bee0ebbba8a1c3be6338f87369073d759a082243`
- Apply from an OpenClaw source checkout with:
  `git am /path/to/patch-oc/current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch`

## 2026-03-30

- Added PR note file:
  `/Users/lilac/gh/openclaw-prs/2026-03-30-acp-routed-fallback-replay-fix.md`.
- Documented upstream PR `openclaw/openclaw#56887` for the ACP duplicate-reply
  root cause and the minimal-impact routed `block` visibility fix strategy.

## 2026-04-02

- Rebased the ACP duplicate-replay source-fix work onto then-current upstream
  `openclaw/main` in `/Users/lilac/gh/openclaw`.
- Refined the source fix in
  `/Users/lilac/gh/openclaw/src/auto-reply/reply/dispatch-acp-delivery.ts` to
  treat all non-tool ACP text as visible while preserving existing Telegram tool
  visibility behavior.
- Updated ACP regression coverage in:
  - `/Users/lilac/gh/openclaw/src/auto-reply/reply/dispatch-acp.test.ts`
  - `/Users/lilac/gh/openclaw/src/auto-reply/reply/dispatch-acp-delivery.test.ts`
- Verified with:
  `pnpm test -- src/auto-reply/reply/dispatch-acp.test.ts src/auto-reply/reply/dispatch-acp-delivery.test.ts`

## 2026-04-07

- Refreshed the context-engine PR branch onto latest upstream `openclaw/main`.
  - local refresh branch: `codex/context-engine-main-refresh`
  - pushed branch: `zhuisDEV/codex/context-engine-capability-inspect-fix`
  - PR: `openclaw/openclaw#58766`
- Resolved the `src/plugins/status.ts` import conflict by keeping the current
  runtime-load imports and adding `hasKind`.
- Preserved the exact capability-ID assertion in
  `/Users/lilac/gh/openclaw/src/plugins/status.test.ts`.
- Verified with: `pnpm test -- src/plugins/status.test.ts`
- Audited the ACP PR against latest upstream `openclaw/main`.
  - local audit branch: `codex/acp-main-audit`
  - verified current upstream already contains delivered-text visibility hooks
    for Discord/Telegram and ACP regression coverage for routed/direct Discord
    block delivery
  - verified with:
    `pnpm test -- src/auto-reply/reply/dispatch-acp.test.ts src/auto-reply/reply/dispatch-acp-delivery.test.ts`
- Closed `openclaw/openclaw#56887` as superseded by current upstream ACP
  behavior instead of rebasing the older implementation onto the newer
  channel-hook design.

## 2026-04-08

- Verified the latest published release and current upstream separately.
  - local installed binary is still `OpenClaw 2026.4.5 (3e72c03)`
  - fetched upstream tags through `v2026.4.8`
  - current upstream head is `f4c64168e7`
- Verified `patch-oc` against the published `openclaw@2026.4.8` npm package, not
  just the local install.
  - packed and unpacked `openclaw@2026.4.8`
  - ran:
    `cd legacy-runtime-hotpatches && ./check.sh --part all --openclaw-root /tmp/openclaw-pack-*/package --verbose`
  - result: both hot patches still match the published `dist/` bundle layout
    with no patch-repo code changes required
- Re-verified ACP duplicate-replay status on `v2026.4.8`.
  - release source already contains delivered-text visibility hooks in
    `src/auto-reply/reply/dispatch-acp-delivery.ts`
  - release tests already cover routed/direct Discord visible block delivery
  - verified with:
    `pnpm --dir /tmp/openclaw-v2026.4.8 test -- src/auto-reply/reply/dispatch-acp.test.ts src/auto-reply/reply/dispatch-acp-delivery.test.ts`
    (`47` tests passed)
  - outcome: `openclaw/openclaw#56887` remains correctly closed as superseded
- Re-verified the context-engine capability gap on both `v2026.4.8` and current
  `origin/main`.
  - `src/plugins/status.ts` still omits a `context-engine` capability entry
  - `origin/main:src/plugins/status.test.ts` no longer contains the
    context-engine regression test
  - `v2026.4.8` targeted status suite passes with only `20` tests, confirming
    the release still predates the regression coverage
- Refreshed `openclaw/openclaw#58766` again onto current upstream.
  - rebased cleanly onto `origin/main` at `f4c64168e7`
  - new commit ids:
    - `b618aea858` `fix(plugins): classify context-engine plugins as capability`
    - `15649245a4` `test(plugins): assert context-engine capability ids`
  - verified with:
    `pnpm --dir /Users/lilac/gh/openclaw test -- src/plugins/status.test.ts`
    (`21` tests passed)
  - force-pushed to: `zhuisDEV/codex/context-engine-capability-inspect-fix`

## 2026-04-14

- Verified `openclaw/openclaw#58766` is merged.
  - merged at: `2026-04-13T14:32:25Z`
  - merge commit: `143c1e81a220f3d91df259daa65ad32864efd438`
- Verified current upstream `origin/main` now includes the context-engine
  capability entry in `src/plugins/status.ts`.
- Verified current local OpenClaw install is `2026.4.9 (0512059)`, so the part
  `1` context-engine patch is no longer needed on this host for current
  releases.
- Remaining ACP PR state is unchanged: `openclaw/openclaw#56887` stays closed as
  superseded.

## 2026-04-20

- Verified current `/Users/lilac/gh/openclaw` is on:
  - branch: `main`
  - head: `77b424b15e1377bf084e5fc3bf4f6757cf38a4a8`
- Confirmed a new upstream mismatch in `plugins.allow` phantom audit logic.
  - config validation and doctor trust the full plugin manifest registry
  - `src/security/audit-extra.async.ts` only trusted installed extension dirs
    plus bundled channel plugins
  - bundled non-channel plugins like `openai`, `google`, and `acpx` could still
    trigger false-positive phantom warnings
- Opened upstream PR:
  - `openclaw/openclaw#69230`
  - branch: `zhuisDEV/codex/security-audit-plugins-allow-manifest`
- Source change:
  - `src/security/audit-extra.async.ts` now trusts the full manifest registry
    for phantom allowlist checks and updates warning text to say "known plugin"
    instead of "installed plugin"
- Test change:
  - `src/security/audit-plugins-phantom.test.ts` now mocks the manifest registry
    and adds bundled non-channel coverage
- Verification:
  - `pnpm test -- src/security/audit-plugins-phantom.test.ts`
  - `pnpm test -- src/security/dangerous-config-flags.test.ts`
  - repo commit hook passed during commit (`pnpm check` chain)

## 2026-04-22

- Re-verified `openclaw/openclaw#69230` against the new release line and current
  upstream.
  - latest stable tag checked: `v2026.4.21`
  - current upstream head checked: `4e22fc949889fa16d2775617e05f1b944892849c`
  - outcome: the PR is still necessary
- Confirmed the bug still exists on `v2026.4.21`.
  - `src/security/audit-plugins-trust.ts` still trusts installed extension dirs
    plus `listChannelPlugins()` only for phantom `plugins.allow` checks
  - bundled non-channel plugins can still false-positive as unknown/phantom
    allowlist entries
- Refreshed the PR onto the current upstream file layout.
  - local refresh branch: `codex/security-audit-plugins-allow-refresh`
  - pushed branch: `zhuisDEV/codex/security-audit-plugins-allow-manifest`
  - new PR commit: `cd59d5ef09d20a4e192ed0ecfa6ec8d0440cea97`
- Source change now lives in:
  - `src/security/audit-plugins-trust.ts`
  - it loads the full plugin manifest registry, keeps installed-plugin checks
    for defense in depth, and updates the warning text to "known plugin"
- Test change now lives in:
  - `src/security/audit-plugins-trust.test.ts`
  - it mocks the manifest registry and covers bundled non-channel plugin IDs
- Verification:
  - `pnpm test -- src/security/audit-plugins-trust.test.ts src/security/dangerous-config-flags.test.ts`
  - repo commit hook passed during commit, including:
    - lint on changed files
    - `pnpm check:changed`
    - `43` files / `416` tests passed in the changed-test shard
- Updated the PR metadata after refresh.
  - refreshed PR body to reference the current file/test paths
  - added PR comment:
    `https://github.com/openclaw/openclaw/pull/69230#issuecomment-4293474455`

## 2026-04-23

- Updated `/Users/lilac/gh/openclaw` to the latest GitHub upstream.
  - current `origin/main` head: `c45026e5cc0fdc8163292aad6a30d1e5351fbee6`
  - latest stable tag checked: `v2026.4.21`
  - latest prerelease tag checked: `v2026.4.22-beta.1`
- Re-verified `openclaw/openclaw#69230` on the latest upstream state.
  - outcome: the PR is still necessary
  - both `v2026.4.21`, `v2026.4.22-beta.1`, and current `main` still use
    `installedPluginIds + listChannelPlugins()` for phantom `plugins.allow`
    checks in `src/security/audit-plugins-trust.ts`
  - bundled non-channel plugins can still false-positive there
- Rebased the PR branch onto current `main`.
  - local branch: `codex/security-audit-plugins-allow-refresh`
  - pushed branch: `zhuisDEV/codex/security-audit-plugins-allow-manifest`
  - new PR commit: `d04f3ce095f3f457bd70fb0721b7b99792f2d695`
- Re-checked the prior CI blocker on current upstream.
  - `src/agents/workspace-run.test.ts` now passes on latest `main`
  - that means the older red CI was stale-base fallout, not a failure in this
    security-audit fix
- Verification:
  - `pnpm test -- src/security/audit-plugins-trust.test.ts src/security/dangerous-config-flags.test.ts src/agents/workspace-run.test.ts`
  - all three targeted suites passed locally after rebase
- PR status after push:
  - new CI run started for commit `d04f3ce095f3f457bd70fb0721b7b99792f2d695`
  - PR url: `https://github.com/openclaw/openclaw/pull/69230`

## 2026-04-28

- Rechecked `openclaw/openclaw#69230`.
  - PR state: closed on `2026-04-26T10:39:46Z`
  - merged: no
  - reason given by `clawsweeper`: already implemented on current `main`
  - PR CI on commit `d04f3ce095f3f457bd70fb0721b7b99792f2d695` was green
- Verified the upstream replacement implementation after fetching latest
  `origin/main` and tags.
  - latest stable tag checked: `v2026.4.26`
  - latest prerelease tag checked: `v2026.4.26-beta.1`
  - current upstream head checked: `3ed3248d7b`
- Verified both current `origin/main` and `v2026.4.26` now use
  `loadPluginRegistrySnapshot(...)` inside `src/security/audit-plugins-trust.ts`
  for phantom `plugins.allow` checks.
  - this is broader than our PR branch because it scopes the known-plugin lookup
    to the audited `stateDir`
  - it still fixes the original false-positive for bundled non-channel plugin
    IDs like `openai`, `google`, and `acpx`
- Outcome:
  - no further action needed on `#69230`
  - tracked OpenClaw PR work now has no open upstream PRs
