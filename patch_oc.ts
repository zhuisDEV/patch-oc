#!/usr/bin/env -S deno run -A

import { runCli } from "./lib/patch_cli.ts";
import { acpRoutedFallbackPatch } from "./patches/acp_routed_fallback.ts";
import { contextEngineCapabilityPatch } from "./patches/context_engine_capability.ts";

const patches = [contextEngineCapabilityPatch, acpRoutedFallbackPatch];

if (import.meta.main) {
  await runCli({
    programName: "patch_oc.ts",
    description: "Apply OpenClaw runtime hot patches.",
    patches,
    defaultPatchIds: patches.map((patch) => patch.id),
    allowPartSelection: true,
  });
}
