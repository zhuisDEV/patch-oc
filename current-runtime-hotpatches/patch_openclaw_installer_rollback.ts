#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env=OPENCLAW_ROOT,PATH --allow-run=which,npm,pnpm

import {
  logPatchResults,
  type Mode,
  resolveOpenclawRoot,
  runPatchDefinition,
} from "./lib/patch_utils.ts";
import { npmPluginInstallRollbackPatch } from "./patches/npm_plugin_install_rollback.ts";

type ParsedArgs = {
  mode: Mode;
  openclawRoot?: string;
  noBackup: boolean;
  verbose: boolean;
};

function printHelp(): void {
  console.log([
    "Apply the current OpenClaw installer rollback runtime hotpatch.",
    "",
    "Usage:",
    "  deno run --allow-read --allow-write --allow-env=OPENCLAW_ROOT,PATH --allow-run=which,npm,pnpm patch_openclaw_installer_rollback.ts [--apply|--check] [--openclaw-root <path>] [--no-backup] [--verbose]",
    "",
    "Options:",
    "  --apply                Apply patch (default)",
    "  --check                Check only; exits non-zero if patch is needed",
    "  --openclaw-root <path> Override OpenClaw install root (contains dist/)",
    "  --no-backup            Skip writing .bak backup files when patching",
    "  --verbose              Print skipped files and extra detail",
    "  -h, --help             Show this help",
  ].join("\n"));
}

function parseArgs(argv: string[]): ParsedArgs {
  let mode: Mode = "apply";
  let openclawRoot: string | undefined;
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

  return { mode, openclawRoot, noBackup, verbose };
}

async function main(): Promise<void> {
  const parsed = parseArgs(Deno.args);
  const openclawRoot = await resolveOpenclawRoot(parsed.openclawRoot);
  const results = await runPatchDefinition(npmPluginInstallRollbackPatch, {
    mode: parsed.mode,
    openclawRoot,
    noBackup: parsed.noBackup,
  });
  logPatchResults(
    npmPluginInstallRollbackPatch,
    results,
    parsed.mode,
    parsed.verbose,
  );

  if (results.some((result) => result.status === "error")) Deno.exit(2);
  if (
    parsed.mode === "check" &&
    results.some((result) => result.status === "patched")
  ) {
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
