# patch-oc

Personal OpenClaw patches and hotfix notes.

`patch-oc` now keeps two kinds of patches:

- source PR patches that should be applied to an OpenClaw git checkout with
  `git am`
- legacy Deno runtime hotpatches for older installed OpenClaw `dist/` bundles

The current recommended patch is the Discord reply typing lifecycle source patch
in `openclaw-prs/`.

## Included patches

### Current source patch

| Patch                                                        | Symptom                                                                    | Apply from an OpenClaw source checkout                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch` | Discord reply feedback can start late, then show `typing -> gap -> typing` | `git am /path/to/patch-oc/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch` |

### Legacy runtime hotpatches

| Part | Patch                                       | Symptom                                                                                                             | Scope                                                               |
| ---- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `1`  | context-engine capability classification    | a `kind: "context-engine"` plugin can be reported as `hook-only` in `openclaw status` or `openclaw plugins inspect` | generalized to any context-engine plugin                            |
| `2`  | ACP routed fallback replay                  | ACP turns can send block text and then replay the same accumulated text again as a final message                    | generalized across direct and routed ACP delivery, not Discord-only |
| `3`  | Discord child primary binding normalization | thread-bound ACP spawn fails with `thread_binding_invalid` when conversation id is `channel:<id>`                   | Discord child-placement primary binding path                        |

## Maintenance notes

- Part `1` is already fixed upstream. Current `openclaw/main` uses
  `context-engine` capability entries in `src/plugins/inspect-shape.ts`.
- Part `2` is superseded for the Discord duplicate-reply case by channel-level
  ACP delivered-text visibility hooks. The older broad runtime transform may
  still report as applicable against some installed bundles, so do not treat
  that alone as proof the Discord bug remains.
- Part `3` is fixed upstream by Discord session-binding normalization paths:
  child binding now accepts normalized parent channel ids and
  `resolveChannelIdForBinding(...)` normalizes `channel:<id>` thread inputs.
- The legacy runtime parts are kept for old installs only. Do not run
  `./apply.sh --part all` on current OpenClaw unless a specific old runtime
  check proves one of those compatibility patches is still needed.

## Legacy part 1

Run these checks:

```bash
openclaw status
openclaw plugins inspect <your-context-engine-plugin-id>
```

Part `1` is only relevant for old installs where your active context-engine
plugin is in use, but status or inspect output still treats it like a hook-only
plugin. `moon` was the original observed case, but the fix is intentionally
generalized to all `kind: "context-engine"` plugins.

Note:

- OpenClaw `2026.4.15` and current upstream already include this fix. Treat part
  `1` as deprecated unless you are maintaining an older install.

Implementation note:

- part `1` now pre-filters `status-*.js` candidates by the
  `buildCapabilityEntries` marker before patch evaluation
- this keeps `--verbose` output focused on real target bundles instead of
  listing unrelated status helper shards as `SKIPPED`

## Legacy part 2

Part `2` was relevant if an ACP session sent a normal reply first and then
replayed the same full text again at end of turn. The symptom was most obvious
in Discord ACP Codex sessions, especially on longer replies.

Note:

- The tracked Discord case is superseded upstream by channel-level delivered
  text visibility hooks. The old broad core patch can still report `PATCHED`
  against some installed bundles, but that does not necessarily mean the Discord
  duplicate-reply bug remains.

The runtime-level diagnosis is:

- ACP `block` text was delivered
- `shouldTreatDeliveredTextAsVisible(...)` did not count non-tool block text as
  visible text
- end-of-turn fallback replayed the accumulated text as a `final`

## Legacy part 3

Part `3` was relevant if a Discord thread-bound ACP spawn failed with:

- `thread_binding_invalid`
- `Session binding adapter failed to bind target conversation`

and the failed route uses a `conversationId` in `channel:<id>` format.

Note:

- Current upstream includes Discord binding normalization that covers this path.
  Treat part `3` as deprecated unless you are patching an old install that still
  has the exact failure.

The runtime-level diagnosis is:

- Discord top-level placement is `child`
- child route resolves parent channel with `threadId: conversationId`
- `conversationId` may be `channel:<id>` (normalized identity), not a raw id
- primary child route fails channel/thread bind target resolution

## Requirements

- Deno installed
- OpenClaw installed globally
- permission to modify the installed OpenClaw `dist/` files on your machine

## Quick start

Apply the current source patch from an OpenClaw checkout:

```bash
cd /path/to/openclaw
git am /path/to/patch-oc/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch
```

For old installed runtime bundles only, run a dry check first:

```bash
git clone https://github.com/zhuisDEV/patch-oc.git
cd patch-oc
./check.sh --part all
```

Then apply only the legacy runtime patch you have verified is needed:

```bash
./apply.sh --part 1
./apply.sh --part 2
./apply.sh --part 3
```

## Agent-friendly flow (single approval)

If your agent runs in exec-approval mode, avoid cloning inside each run. Clone
once, then keep a stable local checkout and run one apply command per task.

One-time setup:

```bash
mkdir -p ~/.openclaw/lws/vendor
git clone https://github.com/zhuisDEV/patch-oc.git ~/.openclaw/lws/vendor/patch-oc
```

For the current source patch:

```bash
cd /path/to/openclaw
git am ~/.openclaw/lws/vendor/patch-oc/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch
```

For old runtime hotpatches only, run:

```bash
cd ~/.openclaw/lws/vendor/patch-oc
./check.sh --part <1|2|3>
./apply.sh --part <1|2|3>
```

This usually reduces approval friction to a single exec approval for the apply
step instead of multiple approvals for `mkdir` + `git clone` + apply commands.

### Suggested instruction for agents

Use this in your agent prompt/instructions:

```text
Use existing local checkout at ~/.openclaw/lws/vendor/patch-oc.
Do not clone patch-oc in normal runs.
Run:
  cd /path/to/openclaw
  git am ~/.openclaw/lws/vendor/patch-oc/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch
For legacy runtime hotpatches only:
  cd ~/.openclaw/lws/vendor/patch-oc
  ./check.sh --part <1|2|3>
  ./apply.sh --part <1|2|3>
```

### Optional cleanup after successful apply

If you only needed this repo for a one-time patch run, you can remove the local
checkout after verification:

```bash
rm -rf ~/.openclaw/lws/vendor/patch-oc
```

Important:

- Removing the local `patch-oc` folder does not revert already-applied runtime
  patch changes under your OpenClaw `dist/` directory.
- After a future OpenClaw update, clone `patch-oc` again and re-run `check.sh`
  and `apply.sh` if needed.

## Legacy Runtime CLI Usage

The main entrypoint is:

```bash
deno run -A ./patch_oc.ts --check --part all
deno run -A ./patch_oc.ts --apply --part 1
deno run -A ./patch_oc.ts --apply --part 2
deno run -A ./patch_oc.ts --apply --part 3
```

Supported selectors:

- `--part 1`
- `--part 2`
- `--part 3`
- `--part all`
- `--part context-engine-capability`
- `--part acp-routed-fallback`
- `--part discord-child-primary-binding`

List supported parts:

```bash
deno run -A ./patch_oc.ts --list-parts
```

The convenience wrappers forward arguments to the main CLI:

```bash
./check.sh --part 1
./apply.sh --part 2
./apply.sh --part 3
```

The part-specific scripts are still available for direct use:

```bash
deno run -A ./patch_openclaw_context_engine_inspect.ts --check
deno run -A ./patch_openclaw_context_engine_inspect.ts --apply

deno run -A ./patch_openclaw_acp_routed_fallback.ts --check
deno run -A ./patch_openclaw_acp_routed_fallback.ts --apply

deno run -A ./patch_openclaw_discord_child_primary_binding.ts --check
deno run -A ./patch_openclaw_discord_child_primary_binding.ts --apply
```

## OpenClaw root detection

By default, `patch-oc` tries to locate the OpenClaw install automatically:

- `OPENCLAW_ROOT`
- resolved `openclaw` binary location
- global package-manager roots from `npm`, `pnpm`, and `yarn`
- `/opt/homebrew/lib/node_modules/openclaw`
- `/usr/local/lib/node_modules/openclaw`

You can override it explicitly:

```bash
./apply.sh --part all --openclaw-root /path/to/openclaw
```

## Verification

### Verify part 1

```bash
openclaw plugins inspect <your-context-engine-plugin-id>
openclaw status
```

Expected after patch:

- inspect shows the plugin under `Capabilities`
- shape/capability output is not reduced to hook-only
- hook-only compatibility warning is removed when this was the only cause

### Verify part 2

```bash
rg -n "shouldTreatDeliveredTextAsVisible|routed: true|routed: false|params\.delivery\.getRoutedCounts\(\)\.block === 0" \
  "${OPENCLAW_ROOT:-/path/to/openclaw}"/dist/dispatch-acp*.js
```

Expected after patch:

- current OpenClaw builds may keep the ACP logic in `dispatch-acp-Da_OnWGW.js`
  instead of only the old `dispatch-acp.runtime*.js` wrappers
- `if (params.kind === "tool") return false;`
- non-tool ACP block text counts as visible
- direct ACP block text on Discord no longer replays as a final fallback

Then reproduce one routed ACP session. If the bug matched this fix, the extra
end-of-turn replay should stop.

### Verify part 3

```bash
rg -n "threadId: \/\^channel:\/i\.test\(conversationId\) \? conversationId\.slice\(8\) : conversationId" \
  "${OPENCLAW_ROOT:-/path/to/openclaw}"/dist/thread-bindings.manager*.js
```

Expected after patch:

- child-placement lookup strips `channel:` before channel/thread resolution
- primary child placement no longer fails from `channel:<id>` mismatch
- thread-bound spawn does not need to rely on current-placement fallback for
  this case

## Safety and backups

On apply, each patched file gets a sibling backup:

- part `1`: `status-*.js.bak-context-engine-capability`
- part `2`: `dispatch-acp*.js.bak-acp-routed-visible-block`
- part `3`: `thread-bindings.manager*.js.bak-discord-child-primary-binding`

This repo does not patch OpenClaw source code. It patches the installed build
artifacts under `dist/`, so you will usually need to re-apply after OpenClaw
updates.

## Development

Run the local verification suite before pushing:

```bash
deno fmt
deno lint
deno task check
deno task test
./check.sh --part all --verbose
```

## Repo metadata

Suggested GitHub description:

`Hot patches for installed OpenClaw runtimes: context-engine capability classification, ACP duplicate final replay fix, and Discord child binding normalization.`

Suggested topics:

- `openclaw`
- `hotfix`
- `patch`
- `deno`
- `context-engine`
- `acp`
- `codex`
- `discord`

See `REPO_CARD.md` for a short discovery card aimed at humans and AI agents.
