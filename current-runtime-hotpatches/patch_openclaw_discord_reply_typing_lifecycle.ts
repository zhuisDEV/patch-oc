#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env=OPENCLAW_ROOT,OPENCLAW_DISCORD_ROOT,HOME,PATH --allow-run=which,npm,pnpm

import path from "node:path";
import {
  logPatchResults,
  type Mode,
  resolveOpenclawRoot,
  runPatchDefinition,
} from "./lib/patch_utils.ts";
import {
  channelRunQueueOnSkipPatch,
  discordMessageHandlerTypingLifecyclePatch,
  discordMessageProcessTypingLifecyclePatch,
} from "./patches/discord_reply_typing_lifecycle.ts";

type ParsedArgs = {
  mode: Mode;
  openclawRoot?: string;
  discordRoot?: string;
  noBackup: boolean;
  verbose: boolean;
};

function printHelp(): void {
  console.log([
    "Apply the current Discord reply typing lifecycle runtime hotpatch.",
    "",
    "Usage:",
    "  deno run --allow-read --allow-write --allow-env=OPENCLAW_ROOT,OPENCLAW_DISCORD_ROOT,HOME,PATH --allow-run=which,npm,pnpm patch_openclaw_discord_reply_typing_lifecycle.ts [--apply|--check] [--openclaw-root <path>] [--discord-root <path>] [--no-backup] [--verbose]",
    "",
    "Options:",
    "  --apply                Apply patch (default)",
    "  --check                Check only; exits non-zero if patch is needed",
    "  --openclaw-root <path> Override OpenClaw install root (contains dist/)",
    "  --discord-root <path>  Override installed @openclaw/discord root (contains dist/)",
    "  --no-backup            Skip writing .bak backup files when patching",
    "  --verbose              Print skipped files and extra detail",
    "  -h, --help             Show this help",
  ].join("\n"));
}

function parseArgs(argv: string[]): ParsedArgs {
  let mode: Mode = "apply";
  let openclawRoot: string | undefined;
  let discordRoot: string | undefined;
  let noBackup = false;
  let verbose = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") {
      mode = "apply";
      continue;
    }
    if (arg === "--check") {
      mode = "check";
      continue;
    }
    if (arg === "--openclaw-root") {
      openclawRoot = argv[i + 1];
      if (!openclawRoot) throw new Error("--openclaw-root requires a value.");
      i += 1;
      continue;
    }
    if (arg === "--discord-root") {
      discordRoot = argv[i + 1];
      if (!discordRoot) throw new Error("--discord-root requires a value.");
      i += 1;
      continue;
    }
    if (arg === "--no-backup") {
      noBackup = true;
      continue;
    }
    if (arg === "--verbose") {
      verbose = true;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      printHelp();
      Deno.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { mode, openclawRoot, discordRoot, noBackup, verbose };
}

async function isDiscordPluginRoot(candidate: string): Promise<boolean> {
  const distDir = path.join(candidate, "dist");
  try {
    const stat = await Deno.stat(distDir);
    if (!stat.isDirectory) return false;
  } catch {
    return false;
  }

  try {
    const packageJson = JSON.parse(
      await Deno.readTextFile(path.join(candidate, "package.json")),
    ) as { name?: unknown };
    return packageJson.name === "@openclaw/discord";
  } catch {
    return true;
  }
}

async function resolveDiscordRoot(explicit?: string): Promise<string> {
  const envRoot = Deno.env.get("OPENCLAW_DISCORD_ROOT")?.trim();
  const home = Deno.env.get("HOME")?.trim();
  const rawCandidates = [
    explicit,
    envRoot,
    home
      ? path.join(
        home,
        ".openclaw",
        "npm",
        "node_modules",
        "@openclaw",
        "discord",
      )
      : undefined,
  ].filter((value): value is string =>
    typeof value === "string" && value.length > 0
  );

  for (const candidate of rawCandidates) {
    const resolved = path.resolve(candidate);
    if (await isDiscordPluginRoot(resolved)) return resolved;
  }

  throw new Error(
    "Unable to find installed @openclaw/discord root. Use --discord-root <path>.",
  );
}

async function main(): Promise<void> {
  const parsed = parseArgs(Deno.args);
  const openclawRoot = await resolveOpenclawRoot(parsed.openclawRoot);
  const discordRoot = await resolveDiscordRoot(parsed.discordRoot);

  const patchRuns = [
    {
      patch: channelRunQueueOnSkipPatch,
      root: openclawRoot,
    },
    {
      patch: discordMessageHandlerTypingLifecyclePatch,
      root: discordRoot,
    },
    {
      patch: discordMessageProcessTypingLifecyclePatch,
      root: discordRoot,
    },
  ];
  const allResults = [];

  for (const run of patchRuns) {
    const results = await runPatchDefinition(run.patch, {
      mode: parsed.mode,
      openclawRoot: run.root,
      noBackup: parsed.noBackup,
    });
    logPatchResults(run.patch, results, parsed.mode, parsed.verbose);
    allResults.push(...results);
  }

  if (allResults.some((result) => result.status === "error")) Deno.exit(2);
  if (
    parsed.mode === "check" &&
    allResults.some((result) => result.status === "patched")
  ) {
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
