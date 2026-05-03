# OpenClaw PR Workspace

This folder holds PR-specific notes and handoff state for contributions to
`openclaw/openclaw`.

Keep local runtime/hotfix notes in `/Users/lilac/.openclaw/skills/handoff.md`.
Keep upstream PR tracking and review follow-up here.

## PR Status

- `#76091` `[codex] Fix Discord reply typing lifecycle`
  - branch: `zhuisDEV/codex/discord-reply-typing-lifecycle`
  - status: draft/open as of `2026-05-03`
  - latest commit: `3f81d745dad4d56814df58663fca3076e0b36f7b`
  - portable patch:
    `current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch`
  - patch shape: three-commit `git am` mailbox
  - scope: use one accepted-turn Discord typing feedback owner from preflight
    acceptance through reply dispatch, preventing late feedback and
    `typing -> gap -> typing` loops
  - review repair: clean skipped accepted typing feedback when a queued run
    never starts after deactivation
  - review repair: reset a tripped shared typing guard on repeated reply starts
    without recreating an active keepalive interval
- `#69230` `fix(security): trust manifest registry in phantom plugin audit`
  - branch: `zhuisDEV/codex/security-audit-plugins-allow-manifest`
  - status: closed as implemented on `2026-04-26`
  - upstream implementation: registry-snapshot based fix on current `main`
  - verified on `2026-04-28`: current `origin/main` and `v2026.4.26` both trust
    the plugin registry snapshot for phantom `plugins.allow` checks
  - original scope: fix false-positive `plugins.allow` phantom warnings for
    bundled non-channel plugins
  - current active file path: `src/security/audit-plugins-trust.ts`
- `#58766`
  `fix(plugins): treat context-engine plugins as capabilities in status/inspect`
  - branch: `zhuisDEV/codex/context-engine-capability-inspect-fix`
  - status: merged on `2026-04-13`
  - merge commit: `143c1e81a220f3d91df259daa65ad32864efd438`
- `#56887` `fix(acp): avoid final text replay after visible ACP text delivery`
  - branch: `zhuisDEV/codex/acp-routed-visible-text`
  - status: closed as superseded
  - verified on `2026-04-08`: published `v2026.4.8` and current `origin/main`
    already include ACP delivered-text visibility hooks plus regression coverage
    for routed/direct Discord block delivery

## Current Outcome

- active OpenClaw PR: `#76091` for Discord reply typing lifecycle
- current upstream `origin/main` and `v2026.4.26` include the phantom
  `plugins.allow` audit fix through a registry-snapshot implementation
- current upstream `origin/main` includes the context-engine capability fix
- current upstream already includes the ACP duplicate-replay fix path for the
  addressed Discord case

## Current verification baseline

- latest upstream head last checked: `origin/main` at `c8fa0fd1c9`
- latest prerelease tags fetched: `v2026.5.2-beta.1`, `v2026.5.2-beta.2`,
  `v2026.5.2-beta.3`

## Related checkouts

- source repo: `/Users/lilac/gh/openclaw`
- patch repo: `/Users/lilac/gh/patch-oc`
- PR handoff:
  `/Users/lilac/gh/patch-oc/current-source-patches/openclaw-prs/handoff.md`
