#!/usr/bin/env -S deno run -A

import { runCli } from "./lib/patch_cli.ts";
import { contextEngineCapabilityPatch } from "./patches/context_engine_capability.ts";

if (import.meta.main) {
  await runCli({
    programName: "patch_openclaw_context_engine_inspect.ts",
    description:
      "Patch OpenClaw plugin-inspect capability classification for context-engine plugins.",
    patches: [contextEngineCapabilityPatch],
    defaultPatchIds: [contextEngineCapabilityPatch.id],
    allowPartSelection: false,
  });
}
