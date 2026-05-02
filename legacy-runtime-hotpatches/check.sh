#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

deno run -A "$SCRIPT_DIR/patch_oc.ts" --check "$@"
