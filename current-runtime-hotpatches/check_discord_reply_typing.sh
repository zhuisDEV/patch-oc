#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

deno run \
  --allow-read \
  --allow-env=OPENCLAW_ROOT,OPENCLAW_DISCORD_ROOT,HOME,PATH \
  --allow-run=which,npm,pnpm \
  "$SCRIPT_DIR/patch_openclaw_discord_reply_typing_lifecycle.ts" \
  --check \
  "$@"
