#!/usr/bin/env -S deno run -A

import { runCli } from "./lib/patch_cli.ts";
import { acpRoutedFallbackPatch } from "./patches/acp_routed_fallback.ts";

if (import.meta.main) {
  await runCli({
    programName: "patch_openclaw_acp_routed_fallback.ts",
    description:
      "Patch OpenClaw ACP routed fallback replay duplicate-message bug in built runtime.",
    patches: [acpRoutedFallbackPatch],
    defaultPatchIds: [acpRoutedFallbackPatch.id],
    allowPartSelection: false,
  });
}
