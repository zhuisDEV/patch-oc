# Current Runtime Hotpatches

This folder holds temporary hotpatches for installed OpenClaw and installed
plugin `dist/` bundles when an upstream PR is still pending and a packaged
release does not include the fix yet.

This is the active area for `patch-oc`. New local fixes should be added here as
Deno runtime hotpatches against installed OpenClaw or installed plugin bundles.

## Installer Rollback Preservation

Patch:

- `patch_openclaw_installer_rollback.ts`

Upstream PR:

- https://github.com/openclaw/openclaw/pull/77237

Symptom:

- A blocked `openclaw plugins install` or `openclaw plugins update` can leave an
  existing managed npm plugin uninstalled after npm has already mutated
  `.openclaw/npm/package.json`, `.openclaw/npm/package-lock.json`, or hoisted
  dependencies.

The hotpatch modifies the installed `dist/install-*.js` bundle so npm-backed
plugin installs snapshot the managed npm root before mutation and restore
`package.json`, `package-lock.json`, and `node_modules` when validation rejects
the candidate.

Check only:

```bash
cd /path/to/patch-oc/current-runtime-hotpatches
./check.sh
```

Apply:

```bash
cd /path/to/patch-oc/current-runtime-hotpatches
./apply.sh
```

Override the OpenClaw install root if auto-detection chooses the wrong one:

```bash
./check.sh --openclaw-root /opt/homebrew/lib/node_modules/openclaw
./apply.sh --openclaw-root /opt/homebrew/lib/node_modules/openclaw
```

The apply script writes a sibling backup beside the patched install bundle:

- `dist/install-*.js.bak-npm-plugin-install-rollback`

## Discord Reply Typing Lifecycle

Patch:

- `patch_openclaw_discord_reply_typing_lifecycle.ts`

Symptom:

- Discord reply feedback can start late and then show a
  `typing -> gap -> typing` lifecycle instead of one continuous accepted reply
  typing owner.

The hotpatch applies the runtime version of the Discord reply typing lifecycle
fix:

- installed OpenClaw core `dist/channel-lifecycle.core-*.js` gets skipped-run
  cleanup hook support for channel run queues
- installed `@openclaw/discord` `dist/message-handler-*.js` carries the accepted
  reply typing feedback object into queued processing
- installed `@openclaw/discord` `dist/message-handler.process-*.js` reuses that
  feedback object as the reply pipeline typing callbacks and cleans it up after
  processing

Check only:

```bash
cd /path/to/patch-oc/current-runtime-hotpatches
./check_discord_reply_typing.sh
```

Apply:

```bash
cd /path/to/patch-oc/current-runtime-hotpatches
./apply_discord_reply_typing.sh
```

Override install roots if auto-detection chooses the wrong paths:

```bash
./check_discord_reply_typing.sh \
  --openclaw-root /opt/homebrew/lib/node_modules/openclaw \
  --discord-root ~/.openclaw/npm/node_modules/@openclaw/discord
./apply_discord_reply_typing.sh \
  --openclaw-root /opt/homebrew/lib/node_modules/openclaw \
  --discord-root ~/.openclaw/npm/node_modules/@openclaw/discord
```

The apply script writes sibling backups beside patched bundles:

- `dist/channel-lifecycle.core-*.js.bak-discord-reply-typing-lifecycle`
- `dist/message-handler-*.js.bak-discord-reply-typing-lifecycle`
- `dist/message-handler.process-*.js.bak-discord-reply-typing-lifecycle`

## Development

```bash
cd /path/to/patch-oc/current-runtime-hotpatches
deno task verify
```
