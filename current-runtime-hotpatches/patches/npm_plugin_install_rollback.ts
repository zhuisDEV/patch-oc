import type { PatchDecision, PatchDefinition } from "../lib/patch_utils.ts";

const PATCH_MARKER = "openclaw-npm-plugin-rollback-";
const ROLLBACK_START =
  "async function rollbackManagedNpmPluginInstall(params) {";
const AFTER_ROLLBACK =
  "\nfunction resolveInstalledNpmResolutionMismatch(params) {";
const INSTALL_START_NEEDLE =
  "logger.info?.(`Installing ${spec} into ${npmRoot}";
const INSTALL_END = "\nasync function installPluginFromPath(params) {";

const ROLLBACK_SECTION =
  `async function rollbackManagedNpmPluginInstall(params) {
\tif (params.snapshot) {
\t\ttry {
\t\t\tawait restoreManagedNpmPluginInstallRollbackSnapshot({
\t\t\t\tnpmRoot: params.npmRoot,
\t\t\t\tsnapshot: params.snapshot
\t\t\t});
\t\t} catch (error) {
\t\t\tparams.logger.warn?.(\`Failed to restore managed npm plugin root after installing \${params.packageName}: \${String(error)}\`);
\t\t}
\t\treturn;
\t}
\ttry {
\t\tawait runCommandWithTimeout([
\t\t\t"npm",
\t\t\t"uninstall",
\t\t\t"--loglevel=error",
\t\t\t"--ignore-scripts",
\t\t\t"--no-audit",
\t\t\t"--no-fund",
\t\t\t"--prefix",
\t\t\t".",
\t\t\tparams.packageName
\t\t], {
\t\t\tcwd: params.npmRoot,
\t\t\ttimeoutMs: Math.max(params.timeoutMs, 3e5),
\t\t\tenv: createSafeNpmInstallEnv(process.env, {
\t\t\t\tpackageLock: true,
\t\t\t\tquiet: true
\t\t\t})
\t\t});
\t} catch (error) {
\t\tparams.logger.warn?.(\`Failed to run npm uninstall rollback for \${params.packageName}: \${String(error)}\`);
\t}
\ttry {
\t\tawait fs.rm(params.targetDir, {
\t\t\trecursive: true,
\t\t\tforce: true
\t\t});
\t} catch (error) {
\t\tparams.logger.warn?.(\`Failed to remove failed plugin install directory \${params.targetDir}: \${String(error)}\`);
\t}
\ttry {
\t\tawait removeManagedNpmRootDependency({
\t\t\tnpmRoot: params.npmRoot,
\t\t\tpackageName: params.packageName
\t\t});
\t} catch (error) {
\t\tparams.logger.warn?.(\`Failed to remove managed npm dependency \${params.packageName}: \${String(error)}\`);
\t}
}
async function readRollbackFileIfPresent(filePath) {
\ttry {
\t\treturn await fs.readFile(filePath, "utf8");
\t} catch (error) {
\t\tif (error.code === "ENOENT") return void 0;
\t\tthrow error;
\t}
}
async function writeOrRemoveRollbackFile(filePath, contents) {
\tif (contents === void 0) {
\t\tawait fs.rm(filePath, { force: true });
\t\treturn;
\t}
\tawait fs.mkdir(path.dirname(filePath), { recursive: true });
\tawait fs.writeFile(filePath, contents, "utf8");
}
async function createManagedNpmPluginInstallRollbackSnapshot(params) {
\tconst tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "${PATCH_MARKER}"));
\tlet nodeModulesBackupDir;
\tconst nodeModulesDir = path.join(params.npmRoot, "node_modules");
\ttry {
\t\tawait fs.stat(nodeModulesDir);
\t\tnodeModulesBackupDir = path.join(tempDir, "node_modules");
\t\tawait fs.cp(nodeModulesDir, nodeModulesBackupDir, {
\t\t\trecursive: true,
\t\t\tforce: true,
\t\t\tverbatimSymlinks: true
\t\t});
\t} catch (error) {
\t\tif (error.code !== "ENOENT") {
\t\t\tawait fs.rm(tempDir, {
\t\t\t\trecursive: true,
\t\t\t\tforce: true
\t\t\t});
\t\t\tthrow error;
\t\t}
\t}
\ttry {
\t\treturn {
\t\t\tpackageJson: await readRollbackFileIfPresent(path.join(params.npmRoot, "package.json")),
\t\t\tpackageLockJson: await readRollbackFileIfPresent(path.join(params.npmRoot, "package-lock.json")),
\t\t\t...nodeModulesBackupDir ? { nodeModulesBackupDir } : {},
\t\t\ttempDir
\t\t};
\t} catch (error) {
\t\tawait fs.rm(tempDir, {
\t\t\trecursive: true,
\t\t\tforce: true
\t\t});
\t\tthrow error;
\t}
}
async function restoreManagedNpmPluginInstallRollbackSnapshot(params) {
\tconst nodeModulesDir = path.join(params.npmRoot, "node_modules");
\tawait fs.rm(nodeModulesDir, {
\t\trecursive: true,
\t\tforce: true
\t});
\tif (params.snapshot.nodeModulesBackupDir) {
\t\tawait fs.mkdir(params.npmRoot, { recursive: true });
\t\tawait fs.cp(params.snapshot.nodeModulesBackupDir, nodeModulesDir, {
\t\t\trecursive: true,
\t\t\tforce: true,
\t\t\tverbatimSymlinks: true
\t\t});
\t}
\tawait writeOrRemoveRollbackFile(path.join(params.npmRoot, "package.json"), params.snapshot.packageJson);
\tawait writeOrRemoveRollbackFile(path.join(params.npmRoot, "package-lock.json"), params.snapshot.packageLockJson);
}
async function cleanupManagedNpmPluginInstallRollbackSnapshot(snapshot) {
\tif (!snapshot) return;
\tawait fs.rm(snapshot.tempDir, {
\t\trecursive: true,
\t\tforce: true
\t});
}`;

const INSTALL_SECTION =
  `\tconst rollbackSnapshot = await createManagedNpmPluginInstallRollbackSnapshot({
\t\tnpmRoot
\t});
\ttry {
\t\tlogger.info?.(\`Installing \${spec} into \${npmRoot}\\u2026\`);
\t\tawait upsertManagedNpmRootDependency({
\t\t\tnpmRoot,
\t\t\tpackageName: parsedSpec.name,
\t\t\tdependencySpec: resolveManagedNpmRootDependencySpec({
\t\t\t\tparsedSpec,
\t\t\t\tresolution: npmResolution
\t\t\t})
\t\t});
\t\tconst install = await runCommandWithTimeout([
\t\t\t"npm",
\t\t\t...createSafeNpmInstallArgs({
\t\t\t\tomitDev: true,
\t\t\t\tloglevel: "error",
\t\t\t\tnoAudit: true,
\t\t\t\tnoFund: true
\t\t\t}),
\t\t\t"--prefix",
\t\t\t"."
\t\t], {
\t\t\tcwd: npmRoot,
\t\t\ttimeoutMs: Math.max(timeoutMs, 3e5),
\t\t\tenv: createSafeNpmInstallEnv(process.env, {
\t\t\t\tpackageLock: true,
\t\t\t\tquiet: true
\t\t\t})
\t\t});
\t\tif (install.code !== 0) {
\t\t\tawait rollbackManagedNpmPluginInstall({
\t\t\t\tnpmRoot,
\t\t\t\tpackageName: parsedSpec.name,
\t\t\t\ttargetDir: installRoot,
\t\t\t\ttimeoutMs,
\t\t\t\tlogger,
\t\t\t\tsnapshot: rollbackSnapshot
\t\t\t});
\t\t\treturn {
\t\t\t\tok: false,
\t\t\t\terror: \`npm install failed: \${install.stderr.trim() || install.stdout.trim()}\`
\t\t\t};
\t\t}
\t\tlet installedDependency;
\t\ttry {
\t\t\tinstalledDependency = await readManagedNpmRootInstalledDependency({
\t\t\t\tnpmRoot,
\t\t\t\tpackageName: parsedSpec.name
\t\t\t});
\t\t} catch (error) {
\t\t\tawait rollbackManagedNpmPluginInstall({
\t\t\t\tnpmRoot,
\t\t\t\tpackageName: parsedSpec.name,
\t\t\t\ttargetDir: installRoot,
\t\t\t\ttimeoutMs,
\t\t\t\tlogger,
\t\t\t\tsnapshot: rollbackSnapshot
\t\t\t});
\t\t\treturn {
\t\t\t\tok: false,
\t\t\t\terror: \`Failed to verify npm install metadata for \${parsedSpec.name}: \${String(error)}\`
\t\t\t};
\t\t}
\t\tconst resolutionMismatch = resolveInstalledNpmResolutionMismatch({
\t\t\tpackageName: parsedSpec.name,
\t\t\texpected: npmResolution,
\t\t\tinstalled: installedDependency
\t\t});
\t\tif (resolutionMismatch) {
\t\t\tawait rollbackManagedNpmPluginInstall({
\t\t\t\tnpmRoot,
\t\t\t\tpackageName: parsedSpec.name,
\t\t\t\ttargetDir: installRoot,
\t\t\t\ttimeoutMs,
\t\t\t\tlogger,
\t\t\t\tsnapshot: rollbackSnapshot
\t\t\t});
\t\t\treturn {
\t\t\t\tok: false,
\t\t\t\terror: resolutionMismatch
\t\t\t};
\t\t}
\t\tconst result = await installPluginFromInstalledPackageDir({
\t\t\tdangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
\t\t\tpackageDir: installRoot,
\t\t\tdependencyScanRootDir: npmRoot,
\t\t\tlogger,
\t\t\texpectedPluginId,
\t\t\ttrustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
\t\t\tmode: effectiveMode,
\t\t\tinstallPolicyRequest: {
\t\t\t\tkind: "plugin-npm",
\t\t\t\trequestedSpecifier: spec
\t\t\t}
\t\t});
\t\tif (!result.ok) {
\t\t\tawait rollbackManagedNpmPluginInstall({
\t\t\t\tnpmRoot,
\t\t\t\tpackageName: parsedSpec.name,
\t\t\t\ttargetDir: installRoot,
\t\t\t\ttimeoutMs,
\t\t\t\tlogger,
\t\t\t\tsnapshot: rollbackSnapshot
\t\t\t});
\t\t\treturn result;
\t\t}
\t\treturn {
\t\t\t...result,
\t\t\tnpmResolution,
\t\t\t...driftResult.integrityDrift ? { integrityDrift: driftResult.integrityDrift } : {}
\t\t};
\t} finally {
\t\tawait cleanupManagedNpmPluginInstallRollbackSnapshot(rollbackSnapshot);
\t}`;

function insertOsImport(content: string): PatchDecision {
  if (content.includes('import os from "node:os";')) {
    return {
      status: "already",
      detail: "node:os import already present",
      nextContent: content,
    };
  }
  const pathImport = 'import path from "node:path";\n';
  if (!content.includes(pathImport)) {
    return {
      status: "error",
      detail: "node:path import not found",
    };
  }
  return {
    status: "patched",
    detail: "inserted node:os import",
    nextContent: content.replace(
      pathImport,
      `${pathImport}import os from "node:os";\n`,
    ),
  };
}

function replaceRegion(
  content: string,
  startNeedle: string,
  endNeedle: string,
  replacement: string,
  missingStartDetail: string,
  missingEndDetail: string,
): PatchDecision {
  const start = content.indexOf(startNeedle);
  if (start < 0) {
    return {
      status: "error",
      detail: missingStartDetail,
    };
  }
  const end = content.indexOf(endNeedle, start);
  if (end < 0) {
    return {
      status: "error",
      detail: missingEndDetail,
    };
  }
  return {
    status: "patched",
    detail: "replaced runtime region",
    nextContent: content.slice(0, start) + replacement + content.slice(end),
  };
}

function replaceInstallBody(content: string): PatchDecision {
  const marker = content.indexOf(INSTALL_START_NEEDLE);
  if (marker < 0) {
    return {
      status: "error",
      detail: "npm install mutation block not found",
    };
  }
  const lineStart = content.lastIndexOf("\n", marker) + 1;
  const end = content.indexOf(INSTALL_END, marker);
  if (end < 0) {
    return {
      status: "error",
      detail: "installPluginFromPath not found after npm install block",
    };
  }
  return {
    status: "patched",
    detail: "wrapped npm install mutation in rollback snapshot",
    nextContent: content.slice(0, lineStart) + INSTALL_SECTION +
      content.slice(end),
  };
}

export function patchNpmPluginInstallRollbackContent(
  content: string,
): PatchDecision {
  if (content.includes(PATCH_MARKER)) {
    return {
      status: "already",
      detail: "managed npm plugin rollback snapshot already present",
      nextContent: content,
    };
  }

  if (!content.includes("async function installPluginFromNpmSpec(")) {
    return {
      status: "skipped",
      detail: "installPluginFromNpmSpec not found",
    };
  }

  let nextContent = content;
  const importResult = insertOsImport(nextContent);
  if (importResult.status === "error") return importResult;
  nextContent = importResult.nextContent ?? nextContent;

  const rollbackResult = replaceRegion(
    nextContent,
    ROLLBACK_START,
    AFTER_ROLLBACK,
    ROLLBACK_SECTION,
    "rollbackManagedNpmPluginInstall not found",
    "resolveInstalledNpmResolutionMismatch not found after rollback function",
  );
  if (rollbackResult.status === "error") return rollbackResult;
  nextContent = rollbackResult.nextContent ?? nextContent;

  const installResult = replaceInstallBody(nextContent);
  if (installResult.status === "error") return installResult;
  nextContent = installResult.nextContent ?? nextContent;

  const requiredMarkers = [
    'import os from "node:os";',
    PATCH_MARKER,
    "createManagedNpmPluginInstallRollbackSnapshot",
    "restoreManagedNpmPluginInstallRollbackSnapshot",
    "snapshot: rollbackSnapshot",
  ];
  const missingMarker = requiredMarkers.find((marker) =>
    !nextContent.includes(marker)
  );
  if (missingMarker) {
    return {
      status: "error",
      detail: `post-patch marker missing: ${missingMarker}`,
    };
  }

  return {
    status: "patched",
    detail:
      "added managed npm root snapshot rollback around plugin npm install validation",
    nextContent,
  };
}

export const npmPluginInstallRollbackPatch: PatchDefinition = {
  id: "npm-plugin-install-rollback",
  aliases: ["installer-rollback", "plugin-install-rollback"],
  title: "Preserve managed npm plugin root on blocked install/update",
  summary:
    "Restores package.json, package-lock.json, and node_modules when plugin npm install validation rejects a candidate.",
  filePattern: /^install(?:-[A-Za-z0-9_-]+)?\.js$/,
  candidateContainsAny: [
    "async function rollbackManagedNpmPluginInstall(params)",
    "async function installPluginFromNpmSpec(",
  ],
  backupSuffix: ".bak-npm-plugin-install-rollback",
  patchFileContent: patchNpmPluginInstallRollbackContent,
};
