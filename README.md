# patch-oc

Hot patches for installed OpenClaw runtimes.

`patch-oc` is a small Deno-based utility repo for applying targeted fixes
directly to OpenClaw's installed `dist/` bundles when an upstream fix is not
available yet. Release `v1.0.0` ships two independent patches and lets you check
or apply part `1`, part `2`, or both.

## Included patches

| Part | Patch                                    | Symptom                                                                                                             | Scope                                                          |
| ---- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `1`  | context-engine capability classification | a `kind: "context-engine"` plugin can be reported as `hook-only` in `openclaw status` or `openclaw plugins inspect` | generalized to any context-engine plugin                       |
| `2`  | ACP routed fallback replay               | routed ACP turns can send block text and then replay the same accumulated text again as a final message             | generalized at the routed ACP delivery layer, not Discord-only |

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
applied at the routed ACP delivery layer so it is not restricted to Discord.

The runtime-level diagnosis is:

- routed ACP `block` text was delivered
- `shouldTreatDeliveredTextAsVisible(...)` did not count that routed block as
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
- `/opt/homebrew/lib/node_modules/openclaw`
- `/usr/local/lib/node_modules/openclaw`

You can override it explicitly:

```bash
./apply.sh --part all --openclaw-root /opt/homebrew/lib/node_modules/openclaw
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
rg -n "shouldTreatDeliveredTextAsVisible|routed: true|routed: false" \
  /opt/homebrew/lib/node_modules/openclaw/dist/dispatch-acp.runtime-*.js
```

Expected after patch:

- `if (params.routed && params.kind === "block") return true;`
- routed ACP call site includes `routed: true`
- direct ACP call site includes `routed: false`

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

`Hot patches for installed OpenClaw runtimes: context-engine capability classification and routed ACP duplicate final replay fixes.`

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
