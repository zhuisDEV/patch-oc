# patch-oc

Local OpenClaw runtime hotfixes.

## Repository Rule

`patch-oc` is for local hotfixes only. New work in this repo must be a
checkable/applyable runtime hotpatch for an installed OpenClaw package or an
installed OpenClaw plugin package.

Do not add upstream PR mailboxes, `git am` source patches, source-checkout
workflows, PR tracking folders, or old compatibility patch sets here. If an
upstream PR is still needed, keep that work in the OpenClaw source/PR workspace
and convert only the needed local temporary coverage into a Deno runtime
hotpatch under `current-runtime-hotpatches/`.

## Layout

- `current-runtime-hotpatches/`: active Deno hotpatches for installed OpenClaw
  and installed plugin `dist/` bundles
- root docs: repo-level status, changelog, and handoff notes

## Current Runtime Hotpatches

Use these only when the installed OpenClaw package does not yet include the
pending upstream fix.

| Patch                                                                         | Symptom                                                                            | Check / apply                                                                                                                           |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `current-runtime-hotpatches/patch_openclaw_installer_rollback.ts`             | blocked plugin install/update can leave an existing managed npm plugin uninstalled | `cd current-runtime-hotpatches && ./check.sh` / `cd current-runtime-hotpatches && ./apply.sh`                                           |
| `current-runtime-hotpatches/patch_openclaw_discord_reply_typing_lifecycle.ts` | Discord reply feedback can start late, then show `typing -> gap -> typing`         | `cd current-runtime-hotpatches && ./check_discord_reply_typing.sh` / `cd current-runtime-hotpatches && ./apply_discord_reply_typing.sh` |

The installer rollback hotpatch is for upstream PR
https://github.com/openclaw/openclaw/pull/77237. It patches installed
`dist/install-*.js` bundles and writes `.bak-npm-plugin-install-rollback`
backups.

The Discord reply typing lifecycle hotpatch is local runtime coverage for the
same upstream bug tracked by the OpenClaw Discord reply typing lifecycle PR. It
patches both installed OpenClaw core `dist/channel-lifecycle.core-*.js` and the
installed `@openclaw/discord` `dist/message-handler*.js` bundles, and writes
`.bak-discord-reply-typing-lifecycle` backups.

## Requirements

- Deno installed
- OpenClaw installed globally
- permission to modify installed OpenClaw and installed plugin `dist/` files on
  your machine

## Agent-Friendly Flow

Keep one stable local checkout and reference the patch by path:

```bash
mkdir -p ~/.openclaw/lws/vendor
git clone https://github.com/zhuisDEV/patch-oc.git ~/.openclaw/lws/vendor/patch-oc
```

For the installer rollback runtime hotpatch:

```bash
cd ~/.openclaw/lws/vendor/patch-oc/current-runtime-hotpatches
./check.sh
./apply.sh
```

For the Discord reply typing lifecycle runtime hotpatch:

```bash
cd ~/.openclaw/lws/vendor/patch-oc/current-runtime-hotpatches
./check_discord_reply_typing.sh
./apply_discord_reply_typing.sh
```

Suggested agent instruction:

```text
Use existing local checkout at ~/.openclaw/lws/vendor/patch-oc.
Do not clone patch-oc in normal runs.
patch-oc is local runtime hotfix only. Do not add source PR mailboxes, git-am
source patches, old compatibility patch sets, or PR tracking folders here.
For the current installer rollback runtime hotpatch, run:
  cd ~/.openclaw/lws/vendor/patch-oc/current-runtime-hotpatches
  ./check.sh
  ./apply.sh
For the current Discord reply typing lifecycle runtime hotpatch, run:
  cd ~/.openclaw/lws/vendor/patch-oc/current-runtime-hotpatches
  ./check_discord_reply_typing.sh
  ./apply_discord_reply_typing.sh
```

## Development

```bash
deno fmt README.md REPO_CARD.md CHANGELOG.md handoff.md current-runtime-hotpatches

cd current-runtime-hotpatches
deno task verify
```

## Repo Metadata

Suggested GitHub description:

`Local OpenClaw runtime hotfixes for installed packages.`

Suggested topics:

- `openclaw`
- `hotfix`
- `patch`
- `deno`
- `discord`

See `REPO_CARD.md` for a short discovery card aimed at humans and AI agents.
