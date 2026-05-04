#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

deno run \
  --allow-read \
  --allow-write \
  --allow-env=OPENCLAW_ROOT,PATH \
  --allow-run=which,npm,pnpm \
  "$SCRIPT_DIR/patch_openclaw_installer_rollback.ts" \
  --apply \
  "$@"
