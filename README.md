# patch-oc

Personal OpenClaw patches and hotfix notes.

The repo is intentionally split by lifecycle:

- `current-source-patches/` holds patches that should be applied to an OpenClaw
  source checkout with `git am`.
- `legacy-runtime-hotpatches/` holds old Deno hotpatch scripts for installed
  OpenClaw `dist/` bundles.
- Root files are only repo-level documentation and metadata.

## Current Source Patches

| Patch                                                                               | Symptom                                                                    | Apply from an OpenClaw source checkout                                                                       |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch` | Discord reply feedback can start late, then show `typing -> gap -> typing` | `git am /path/to/patch-oc/current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch` |

Quick apply:

```bash
cd /path/to/openclaw
git am /path/to/patch-oc/current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch
```

## Legacy Runtime Hotpatches

These are kept for old installs only. They are no longer the default
recommendation for current OpenClaw.

| Part | Patch                                       | Symptom                                                                                                             | Current status                                                  |
| ---- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `1`  | context-engine capability classification    | a `kind: "context-engine"` plugin can be reported as `hook-only` in `openclaw status` or `openclaw plugins inspect` | fixed upstream; legacy compatibility only                       |
| `2`  | ACP routed fallback replay                  | ACP turns can send block text and then replay the same accumulated text again as a final message                    | superseded for the tracked Discord case by delivered-text hooks |
| `3`  | Discord child primary binding normalization | thread-bound ACP spawn fails with `thread_binding_invalid` when conversation id is `channel:<id>`                   | fixed upstream by Discord binding channel-id normalization      |

Run legacy checks from the legacy folder:

```bash
cd /path/to/patch-oc/legacy-runtime-hotpatches
./check.sh --part <1|2|3>
```

Apply only a legacy runtime patch that a check proves is needed:

```bash
cd /path/to/patch-oc/legacy-runtime-hotpatches
./apply.sh --part 1
./apply.sh --part 2
./apply.sh --part 3
```

Do not run `./apply.sh --part all` on current OpenClaw unless an explicit
old-runtime check justifies every part.

## Requirements

Current source patch:

- an OpenClaw source checkout
- `git`

Legacy runtime hotpatches:

- Deno installed
- OpenClaw installed globally
- permission to modify the installed OpenClaw `dist/` files on your machine

## Agent-Friendly Flow

Keep one stable local checkout and reference the patch by path:

```bash
mkdir -p ~/.openclaw/lws/vendor
git clone https://github.com/zhuisDEV/patch-oc.git ~/.openclaw/lws/vendor/patch-oc
cd /path/to/openclaw
git am ~/.openclaw/lws/vendor/patch-oc/current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch
```

For old runtime hotpatches only:

```bash
cd ~/.openclaw/lws/vendor/patch-oc/legacy-runtime-hotpatches
./check.sh --part <1|2|3>
./apply.sh --part <1|2|3>
```

Suggested agent instruction:

```text
Use existing local checkout at ~/.openclaw/lws/vendor/patch-oc.
Do not clone patch-oc in normal runs.
For the current source patch, run:
  cd /path/to/openclaw
  git am ~/.openclaw/lws/vendor/patch-oc/current-source-patches/openclaw-prs/0001-Fix-Discord-reply-typing-lifecycle.patch
For legacy runtime hotpatches only, run:
  cd ~/.openclaw/lws/vendor/patch-oc/legacy-runtime-hotpatches
  ./check.sh --part <1|2|3>
  ./apply.sh --part <1|2|3>
```

## Legacy Runtime CLI

The legacy runtime tool lives in `legacy-runtime-hotpatches/`.

```bash
cd /path/to/patch-oc/legacy-runtime-hotpatches

deno run -A ./patch_oc.ts --check --part all
deno run -A ./patch_oc.ts --apply --part 1
deno run -A ./patch_oc.ts --apply --part 2
deno run -A ./patch_oc.ts --apply --part 3
deno run -A ./patch_oc.ts --list-parts
```

Supported selectors:

- `--part 1`
- `--part 2`
- `--part 3`
- `--part all`
- `--part context-engine-capability`
- `--part acp-routed-fallback`
- `--part discord-child-primary-binding`

Part-specific scripts are still available inside `legacy-runtime-hotpatches/`:

```bash
deno run -A ./patch_openclaw_context_engine_inspect.ts --check
deno run -A ./patch_openclaw_context_engine_inspect.ts --apply

deno run -A ./patch_openclaw_acp_routed_fallback.ts --check
deno run -A ./patch_openclaw_acp_routed_fallback.ts --apply

deno run -A ./patch_openclaw_discord_child_primary_binding.ts --check
deno run -A ./patch_openclaw_discord_child_primary_binding.ts --apply
```

## Legacy OpenClaw Root Detection

By default, the legacy tool tries to locate the OpenClaw install automatically:

- `OPENCLAW_ROOT`
- resolved `openclaw` binary location
- global package-manager roots from `npm`, `pnpm`, and `yarn`
- `/opt/homebrew/lib/node_modules/openclaw`
- `/usr/local/lib/node_modules/openclaw`

You can override it explicitly:

```bash
cd /path/to/patch-oc/legacy-runtime-hotpatches
./apply.sh --part 1 --openclaw-root /path/to/openclaw
```

## Legacy Verification

### Verify Part 1

```bash
openclaw plugins inspect <your-context-engine-plugin-id>
openclaw status
```

Expected after patch:

- inspect shows the plugin under `Capabilities`
- shape/capability output is not reduced to hook-only
- hook-only compatibility warning is removed when this was the only cause

### Verify Part 2

```bash
rg -n "shouldTreatDeliveredTextAsVisible|routed: true|routed: false|params\.delivery\.getRoutedCounts\(\)\.block === 0" \
  "${OPENCLAW_ROOT:-/path/to/openclaw}"/dist/dispatch-acp*.js
```

Expected after patch:

- current OpenClaw builds may keep the ACP logic in `dispatch-acp-Da_OnWGW.js`
  instead of only old `dispatch-acp.runtime*.js` wrappers
- `if (params.kind === "tool") return false;`
- non-tool ACP block text counts as visible
- direct ACP block text on Discord no longer replays as a final fallback

### Verify Part 3

```bash
rg -n "threadId: \/\^channel:\/i\.test\(conversationId\) \? conversationId\.slice\(8\) : conversationId" \
  "${OPENCLAW_ROOT:-/path/to/openclaw}"/dist/thread-bindings.manager*.js
```

Expected after patch:

- child-placement lookup strips `channel:` before channel/thread resolution
- primary child placement no longer fails from `channel:<id>` mismatch
- thread-bound spawn does not need to rely on current-placement fallback for
  this case

## Safety and Backups

Legacy runtime apply creates sibling backups:

- part `1`: `status-*.js.bak-context-engine-capability`
- part `2`: `dispatch-acp*.js.bak-acp-routed-visible-block`
- part `3`: `thread-bindings.manager*.js.bak-discord-child-primary-binding`

The legacy runtime tool patches installed build artifacts under `dist/`, so
those changes usually need to be re-applied after OpenClaw updates.

## Development

Run repo formatting and legacy verification before pushing:

```bash
deno fmt README.md REPO_CARD.md CHANGELOG.md handoff.md current-source-patches legacy-runtime-hotpatches

cd legacy-runtime-hotpatches
deno lint
deno task check
deno test --allow-read="$PWD,${TMPDIR:-/tmp}" --allow-write="${TMPDIR:-/tmp}"
./check.sh --part all --verbose
```

## Repo Metadata

Suggested GitHub description:

`Personal OpenClaw source patches plus legacy runtime hotpatches.`

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
