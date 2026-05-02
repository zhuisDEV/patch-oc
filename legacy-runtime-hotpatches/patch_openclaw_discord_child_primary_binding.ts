#!/usr/bin/env -S deno run -A

import { runCli } from "./lib/patch_cli.ts";
import { discordChildPrimaryBindingPatch } from "./patches/discord_child_primary_binding.ts";

if (import.meta.main) {
  await runCli({
    programName: "patch_openclaw_discord_child_primary_binding.ts",
    description:
      "Patch OpenClaw Discord child-placement primary thread binding channel-id normalization bug in built runtime.",
    patches: [discordChildPrimaryBindingPatch],
    defaultPatchIds: [discordChildPrimaryBindingPatch.id],
    allowPartSelection: false,
  });
}
