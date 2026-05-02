import {
  logPatchResults,
  type Mode,
  type PatchDefinition,
  resolveOpenclawRoot,
  runPatchDefinition,
} from "./patch_utils.ts";

type CliConfig = {
  programName: string;
  description: string;
  patches: PatchDefinition[];
  defaultPatchIds: string[];
  allowPartSelection: boolean;
};

type ParsedArgs = {
  mode: Mode;
  openclawRoot?: string;
  noBackup: boolean;
  verbose: boolean;
  selectedPatchIds: string[];
  listParts: boolean;
};

function partSummary(patch: PatchDefinition): string {
  return `${patch.id}: ${patch.summary} (aliases: ${patch.aliases.join(", ")})`;
}

function printHelp(config: CliConfig): void {
  const usage = [
    config.description,
    "",
    "Usage:",
    `  deno run -A ${config.programName} [--apply|--check] ${
      config.allowPartSelection ? "[--part <value>]" : ""
    } [--openclaw-root <path>] [--no-backup] [--verbose]`,
    "",
    "Options:",
    "  --apply                Apply patch (default)",
    "  --check                Check only; exits non-zero if patch is needed",
    config.allowPartSelection
      ? "  --part <value>         Select 1, 2, all, or a patch id/alias"
      : "",
    config.allowPartSelection
      ? "  --list-parts           Show supported patch parts"
      : "",
    "  --openclaw-root <path> Override OpenClaw install root (contains dist/)",
    "  --no-backup            Skip writing .bak backup files when patching",
    "  --verbose              Print skipped files and extra detail",
    "  -h, --help             Show this help",
  ].filter(Boolean);

  console.log(usage.join("\n"));

  if (config.allowPartSelection) {
    console.log("");
    console.log("Parts:");
    for (const patch of config.patches) {
      console.log(`  ${partSummary(patch)}`);
    }
  }
}

function parsePartValues(raw: string): string[] {
  return raw.split(",").map((value) => value.trim()).filter(Boolean);
}

function resolvePatchIds(
  config: CliConfig,
  selectors: string[],
): string[] {
  if (selectors.length === 0) return [...config.defaultPatchIds];

  const aliasToId = new Map<string, string>();
  for (const patch of config.patches) {
    aliasToId.set(patch.id, patch.id);
    for (const alias of patch.aliases) aliasToId.set(alias, patch.id);
  }

  const resolved = new Set<string>();
  for (const selector of selectors) {
    if (selector === "all") {
      for (const patch of config.patches) resolved.add(patch.id);
      continue;
    }

    const patchId = aliasToId.get(selector);
    if (!patchId) {
      throw new Error(`Unknown patch selector: ${selector}`);
    }
    resolved.add(patchId);
  }

  return [...resolved];
}

function parseArgs(argv: string[], config: CliConfig): ParsedArgs {
  let mode: Mode = "apply";
  let openclawRoot: string | undefined;
  let noBackup = false;
  let verbose = false;
  let listParts = false;
  const selectors: string[] = [];

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
    if (arg === "--list-parts") {
      if (!config.allowPartSelection) {
        throw new Error("--list-parts is not supported for this entrypoint.");
      }
      listParts = true;
      continue;
    }
    if (arg === "--part") {
      if (!config.allowPartSelection) {
        throw new Error("--part is not supported for this entrypoint.");
      }
      const value = argv[i + 1];
      if (!value) throw new Error("--part requires a value.");
      selectors.push(...parsePartValues(value));
      i += 1;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      printHelp(config);
      Deno.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    mode,
    openclawRoot,
    noBackup,
    verbose,
    selectedPatchIds: resolvePatchIds(config, selectors),
    listParts,
  };
}

export async function runCli(config: CliConfig): Promise<void> {
  const parsed = parseArgs(Deno.args, config);

  if (parsed.listParts) {
    for (const patch of config.patches) console.log(partSummary(patch));
    return;
  }

  const selected = config.patches.filter((patch) =>
    parsed.selectedPatchIds.includes(patch.id)
  );
  if (selected.length === 0) {
    throw new Error("No patch parts selected.");
  }

  const openclawRoot = await resolveOpenclawRoot(parsed.openclawRoot);
  let sawError = false;
  let needsPatch = false;

  for (const [index, patch] of selected.entries()) {
    if (index > 0) console.log("");
    const results = await runPatchDefinition(patch, {
      mode: parsed.mode,
      openclawRoot,
      noBackup: parsed.noBackup,
    });
    logPatchResults(patch, results, parsed.mode, parsed.verbose);

    if (results.some((item) => item.status === "error")) sawError = true;
    if (
      parsed.mode === "check" &&
      results.some((item) => item.status === "patched")
    ) {
      needsPatch = true;
    }
  }

  if (sawError) Deno.exit(2);
  if (parsed.mode === "check" && needsPatch) Deno.exit(1);
}
