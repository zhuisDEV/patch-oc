# patch-oc

Hot patches for installed OpenClaw runtimes.

`patch-oc` is a small Deno-based utility repo for applying targeted fixes
directly to OpenClaw's installed `dist/` bundles when an upstream fix is not
available yet. Release `v1.0.4` ships two independent patches and lets you check
or apply part `1`, part `2`, or both.

## Included patches

| Part | Patch                                    | Symptom                                                                                                             | Scope                                                               |
| ---- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `1`  | context-engine capability classification | a `kind: "context-engine"` plugin can be reported as `hook-only` in `openclaw status` or `openclaw plugins inspect` | generalized to any context-engine plugin                            |
| `2`  | ACP routed fallback replay               | ACP turns can send block text and then replay the same accumulated text again as a final message                    | generalized across direct and routed ACP delivery, not Discord-only |

## When to use part 1

Run these checks:

```bash
openclaw status
openclaw plugins inspect <your-context-engine-plugin-id>
```

Part `1` is relevant if your active context-engine plugin is in use, but status
or inspect output still treats it like a hook-only plugin. `moon` was the
original observed case, but the fix is intentionally generalized to all
`kind: "context-engine"` plugins.

## When to use part 2

Part `2` is relevant if an ACP session sends a normal reply first and then
replays the same full text again at end of turn. The symptom is most obvious in
Discord ACP Codex sessions, especially on longer replies, but the patch is
applied at the ACP delivery layer so it is not restricted to Discord.

The runtime-level diagnosis is:

- ACP `block` text was delivered
- `shouldTreatDeliveredTextAsVisible(...)` did not count non-tool block text as
  visible text
- end-of-turn fallback replayed the accumulated text as a `final`

## Requirements

- Deno installed
- OpenClaw installed globally
- permission to modify the installed OpenClaw `dist/` files on your machine

## Quick start

Clone the repo and run a dry check first:

```bash
git clone https://github.com/zhuisDEV/patch-oc.git
cd patch-oc
./check.sh --part all
```

Then apply only what you need:

```bash
./apply.sh --part 1
./apply.sh --part 2
./apply.sh --part all
```

## Agent-friendly flow (single approval)

If your agent runs in exec-approval mode, avoid cloning inside each run. Clone
once, then keep a stable local checkout and run one apply command per task.

One-time setup:

```bash
mkdir -p ~/.openclaw/lws/vendor
git clone https://github.com/zhuisDEV/patch-oc.git ~/.openclaw/lws/vendor/patch-oc
```

Per patch run:

```bash
cd ~/.openclaw/lws/vendor/patch-oc
./check.sh --part all
./apply.sh --part all
```

This usually reduces approval friction to a single exec approval for the apply
step instead of multiple approvals for `mkdir` + `git clone` + apply commands.

### Suggested instruction for agents

Use this in your agent prompt/instructions:

```text
Use existing local checkout at ~/.openclaw/lws/vendor/patch-oc.
Do not clone patch-oc in normal runs.
Run:
  cd ~/.openclaw/lws/vendor/patch-oc
  ./check.sh --part <1|2|all>
  ./apply.sh --part <1|2|all>
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

## CLI usage

The main entrypoint is:

```bash
deno run -A ./patch_oc.ts --check --part all
deno run -A ./patch_oc.ts --apply --part 1
deno run -A ./patch_oc.ts --apply --part 2
```

Supported selectors:

- `--part 1`
- `--part 2`
- `--part all`
- `--part context-engine-capability`
- `--part acp-routed-fallback`

List supported parts:

```bash
deno run -A ./patch_oc.ts --list-parts
```

The convenience wrappers forward arguments to the main CLI:

```bash
./check.sh --part 1
./apply.sh --part 2
```

The part-specific scripts are still available for direct use:

```bash
deno run -A ./patch_openclaw_context_engine_inspect.ts --check
deno run -A ./patch_openclaw_context_engine_inspect.ts --apply

deno run -A ./patch_openclaw_acp_routed_fallback.ts --check
deno run -A ./patch_openclaw_acp_routed_fallback.ts --apply
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
  "${OPENCLAW_ROOT:-/path/to/openclaw}"/dist/dispatch-acp.runtime*.js
```

Expected after patch:

- `if (params.kind === "tool") return false;`
- non-tool ACP block text counts as visible
- direct ACP block text on Discord no longer replays as a final fallback

Then reproduce one routed ACP session. If the bug matched this fix, the extra
end-of-turn replay should stop.

## Safety and backups

On apply, each patched file gets a sibling backup:

- part `1`: `status-*.js.bak-context-engine-capability`
- part `2`: `dispatch-acp.runtime-*.js.bak-acp-routed-visible-block`

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

`Hot patches for installed OpenClaw runtimes: context-engine capability classification and ACP duplicate final replay fixes.`

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
