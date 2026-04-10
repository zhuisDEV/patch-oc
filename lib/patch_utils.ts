import path from "node:path";

export type Mode = "apply" | "check";
export type PatchStatus = "patched" | "already" | "skipped" | "error";

export type PatchDecision = {
  status: PatchStatus;
  detail: string;
  nextContent?: string;
};

export type PatchResult = {
  file: string;
  status: PatchStatus;
  detail: string;
  backupPath?: string;
};

export type PatchDefinition = {
  id: string;
  aliases: string[];
  title: string;
  summary: string;
  filePattern: RegExp;
  candidateContainsAny?: string[];
  backupSuffix: string;
  patchFileContent: (content: string) => PatchDecision;
};

function decode(output: Uint8Array): string {
  return new TextDecoder().decode(output).trim();
}

async function runTextCommand(
  command: string,
  args: string[],
): Promise<string | null> {
  try {
    const result = await new Deno.Command(command, {
      args,
      stdout: "piped",
      stderr: "null",
    }).output();
    if (!result.success) return null;
    const output = decode(result.stdout).split(/\r?\n/).find((line) =>
      line.trim().length > 0
    );
    return output?.trim() ?? null;
  } catch {
    return null;
  }
}

async function resolveRootFromOpenclawBinary(): Promise<string | null> {
  const binPath = await runTextCommand("which", ["openclaw"]);
  if (!binPath) return null;

  let realBin = binPath;
  try {
    realBin = await Deno.realPath(binPath);
  } catch {
    // Keep the original path if realpath is unavailable.
  }

  if (path.basename(realBin) === "openclaw.mjs") {
    return path.dirname(realBin);
  }

  const candidates = [
    path.resolve(path.dirname(realBin), "../lib/node_modules/openclaw"),
    path.resolve(path.dirname(realBin), "../node_modules/openclaw"),
  ];

  for (const candidate of candidates) {
    try {
      const stat = await Deno.stat(candidate);
      if (stat.isDirectory) return candidate;
    } catch {
      // Keep scanning candidates.
    }
  }

  return null;
}

async function resolveRootsFromPackageManagers(): Promise<string[]> {
  const candidates = new Set<string>();

  const npmRoot = await runTextCommand("npm", ["root", "-g"]);
  if (npmRoot) candidates.add(path.join(npmRoot, "openclaw"));

  const pnpmRoot = await runTextCommand("pnpm", ["root", "-g"]);
  if (pnpmRoot) candidates.add(path.join(pnpmRoot, "openclaw"));

  const yarnGlobalDir = await runTextCommand("yarn", ["global", "dir"]);
  if (yarnGlobalDir) {
    candidates.add(path.join(yarnGlobalDir, "node_modules", "openclaw"));
  }

  return [...candidates];
}

export async function resolveOpenclawRoot(explicit?: string): Promise<string> {
  const envRoot = Deno.env.get("OPENCLAW_ROOT")?.trim();
  const rawCandidates = [
    explicit,
    envRoot,
    await resolveRootFromOpenclawBinary(),
    ...(await resolveRootsFromPackageManagers()),
    "/opt/homebrew/lib/node_modules/openclaw",
    "/usr/local/lib/node_modules/openclaw",
  ].filter((value): value is string =>
    typeof value === "string" && value.length > 0
  );

  for (const candidate of rawCandidates) {
    const resolved = path.resolve(candidate);
    const distDir = path.join(resolved, "dist");
    try {
      const stat = await Deno.stat(distDir);
      if (stat.isDirectory) return resolved;
    } catch {
      // Ignore and continue.
    }
  }

  throw new Error(
    "Unable to find OpenClaw install root. Use --openclaw-root <path>.",
  );
}

export async function listMatchingDistFiles(
  openclawRoot: string,
  pattern: RegExp,
  candidateContainsAny?: string[],
): Promise<string[]> {
  const distDir = path.join(openclawRoot, "dist");
  const files: string[] = [];
  const hasContentProbe = Array.isArray(candidateContainsAny) &&
    candidateContainsAny.length > 0;

  for await (const entry of Deno.readDir(distDir)) {
    if (!entry.isFile) continue;
    if (!pattern.test(entry.name)) continue;
    const filePath = path.join(distDir, entry.name);

    if (hasContentProbe) {
      const content = await Deno.readTextFile(filePath);
      const matchedProbe = candidateContainsAny.some((needle) =>
        content.includes(needle)
      );
      if (!matchedProbe) continue;
    }

    files.push(filePath);
  }

  files.sort();
  return files;
}

async function patchFile(
  patch: PatchDefinition,
  file: string,
  mode: Mode,
  noBackup: boolean,
): Promise<PatchResult> {
  const content = await Deno.readTextFile(file);
  const decision = patch.patchFileContent(content);

  if (decision.status === "error" || decision.status === "skipped") {
    return {
      file,
      status: decision.status,
      detail: decision.detail,
    };
  }

  if (decision.status === "already") {
    return {
      file,
      status: "already",
      detail: decision.detail,
    };
  }

  if (mode === "check") {
    return {
      file,
      status: "patched",
      detail: "patch required",
    };
  }

  let backupPath: string | undefined;
  if (!noBackup) {
    backupPath = `${file}${patch.backupSuffix}`;
    try {
      await Deno.stat(backupPath);
    } catch {
      await Deno.copyFile(file, backupPath);
    }
  }

  await Deno.writeTextFile(file, decision.nextContent ?? content);
  return {
    file,
    status: "patched",
    detail: decision.detail,
    backupPath,
  };
}

export async function runPatchDefinition(
  patch: PatchDefinition,
  options: {
    mode: Mode;
    openclawRoot: string;
    noBackup: boolean;
  },
): Promise<PatchResult[]> {
  const files = await listMatchingDistFiles(
    options.openclawRoot,
    patch.filePattern,
    patch.candidateContainsAny,
  );
  if (files.length === 0) {
    const probeHint = patch.candidateContainsAny?.length
      ? ` and containing one of: ${patch.candidateContainsAny.join(" | ")}`
      : "";
    throw new Error(
      `No files matching ${patch.filePattern}${probeHint} found under ${
        path.join(options.openclawRoot, "dist")
      }`,
    );
  }

  const results: PatchResult[] = [];
  for (const file of files) {
    results.push(await patchFile(patch, file, options.mode, options.noBackup));
  }
  return results;
}

export function logPatchResults(
  patch: PatchDefinition,
  results: PatchResult[],
  mode: Mode,
  verbose: boolean,
): void {
  console.log(`${patch.id}: ${patch.title}`);
  for (const result of results) {
    if (!verbose && result.status === "skipped") continue;
    const suffix = result.backupPath
      ? ` (${result.detail}; backup=${result.backupPath})`
      : ` (${result.detail})`;
    console.log(`${result.status.toUpperCase()} ${result.file}${suffix}`);
  }

  const patched = results.filter((item) => item.status === "patched").length;
  const already = results.filter((item) => item.status === "already").length;
  const skipped = results.filter((item) => item.status === "skipped").length;
  const errors = results.filter((item) => item.status === "error").length;
  const prefix = mode === "check" ? "CHECK" : "APPLY";

  console.log(
    `${prefix} SUMMARY patched${
      mode === "check" ? "-needed" : ""
    }=${patched} already=${already} skipped=${skipped} errors=${errors}`,
  );
}
