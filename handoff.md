# patch-oc handoff

## 2026-05-03

- Merged `/Users/lilac/gh/openclaw-prs` into this repo under
  `/Users/lilac/gh/patch-oc/openclaw-prs`.
  - current source patch:
    `openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch`
  - patch SHA-256 from creation:
    `6b52dfed1cbefbfb65a022b4d4f815cb3485fac405d49eef741db3fa13e24a6f`
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
  - Use the source patch in `openclaw-prs/` for the Discord reply typing
    lifecycle work.
  - Treat runtime parts `1`, `2`, and `3` as deprecated compatibility patches
    for old installs only.
  - Do not use `./apply.sh --part all` on current OpenClaw unless an explicit
    old-runtime check justifies it.

## 2026-04-20

- Part `1` was already included in OpenClaw `2026.4.15`. It was kept only for
  older installs.
- Part `2` had been fixed by another upstream OpenClaw update path for the
  tracked Discord case and was expected to become removable.
- Part `3` was still uncertain at that time and needed more runtime testing.
