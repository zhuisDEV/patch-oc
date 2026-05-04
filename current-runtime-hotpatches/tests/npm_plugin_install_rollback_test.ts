import { patchNpmPluginInstallRollbackContent } from "../patches/npm_plugin_install_rollback.ts";

const OLD_INSTALL_BUNDLE = `import path from "node:path";
import fs from "node:fs/promises";
async function removeManagedNpmRootDependency(params) {}
async function rollbackManagedNpmPluginInstall(params) {
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
function resolveInstalledNpmResolutionMismatch(params) {
\treturn null;
}
async function installPluginFromNpmSpec(params) {
\tconst spec = params.spec;
\tconst logger = params.logger;
\tconst npmRoot = params.npmRoot;
\tconst parsedSpec = { name: "dangerous-plugin" };
\tconst npmResolution = {};
\tconst installRoot = path.join(npmRoot, "node_modules", parsedSpec.name);
\tconst timeoutMs = 1000;
\tconst driftResult = {};
\tconst expectedPluginId = parsedSpec.name;
\tconst effectiveMode = "update";
\tlogger.info?.(\`Installing \${spec} into \${npmRoot}…\`);
\tawait upsertManagedNpmRootDependency({
\t\tnpmRoot,
\t\tpackageName: parsedSpec.name,
\t\tdependencySpec: resolveManagedNpmRootDependencySpec({
\t\t\tparsedSpec,
\t\t\tresolution: npmResolution
\t\t})
\t});
\tconst install = await runCommandWithTimeout([
\t\t"npm",
\t\t...createSafeNpmInstallArgs({
\t\t\tomitDev: true,
\t\t\tloglevel: "error",
\t\t\tnoAudit: true,
\t\t\tnoFund: true
\t\t}),
\t\t"--prefix",
\t\t"."
\t], {
\t\tcwd: npmRoot,
\t\ttimeoutMs: Math.max(timeoutMs, 3e5),
\t\tenv: createSafeNpmInstallEnv(process.env, {
\t\t\tpackageLock: true,
\t\t\tquiet: true
\t\t})
\t});
\tif (install.code !== 0) {
\t\tawait removeManagedNpmRootDependency({
\t\t\tnpmRoot,
\t\t\tpackageName: parsedSpec.name
\t\t});
\t\treturn {
\t\t\tok: false,
\t\t\terror: \`npm install failed: \${install.stderr.trim() || install.stdout.trim()}\`
\t\t};
\t}
\tlet installedDependency;
\ttry {
\t\tinstalledDependency = await readManagedNpmRootInstalledDependency({
\t\t\tnpmRoot,
\t\t\tpackageName: parsedSpec.name
\t\t});
\t} catch (error) {
\t\tawait rollbackManagedNpmPluginInstall({
\t\t\tnpmRoot,
\t\t\tpackageName: parsedSpec.name,
\t\t\ttargetDir: installRoot,
\t\t\ttimeoutMs,
\t\t\tlogger
\t\t});
\t\treturn {
\t\t\tok: false,
\t\t\terror: \`Failed to verify npm install metadata for \${parsedSpec.name}: \${String(error)}\`
\t\t};
\t}
\tconst resolutionMismatch = resolveInstalledNpmResolutionMismatch({
\t\tpackageName: parsedSpec.name,
\t\texpected: npmResolution,
\t\tinstalled: installedDependency
\t});
\tif (resolutionMismatch) {
\t\tawait rollbackManagedNpmPluginInstall({
\t\t\tnpmRoot,
\t\t\tpackageName: parsedSpec.name,
\t\t\ttargetDir: installRoot,
\t\t\ttimeoutMs,
\t\t\tlogger
\t\t});
\t\treturn {
\t\t\tok: false,
\t\t\terror: resolutionMismatch
\t\t};
\t}
\tconst result = await installPluginFromInstalledPackageDir({
\t\tdangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
\t\tpackageDir: installRoot,
\t\tdependencyScanRootDir: npmRoot,
\t\tlogger,
\t\texpectedPluginId,
\t\ttrustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
\t\tmode: effectiveMode,
\t\tinstallPolicyRequest: {
\t\t\tkind: "plugin-npm",
\t\t\trequestedSpecifier: spec
\t\t}
\t});
\tif (!result.ok) {
\t\tawait rollbackManagedNpmPluginInstall({
\t\t\tnpmRoot,
\t\t\tpackageName: parsedSpec.name,
\t\t\ttargetDir: installRoot,
\t\t\ttimeoutMs,
\t\t\tlogger
\t\t});
\t\treturn result;
\t}
\treturn {
\t\t...result,
\t\tnpmResolution,
\t\t...driftResult.integrityDrift ? { integrityDrift: driftResult.integrityDrift } : {}
\t};
}
async function installPluginFromPath(params) {
\treturn params;
}`;

Deno.test("installer rollback hotpatch adds managed npm root snapshot restore", () => {
  const result = patchNpmPluginInstallRollbackContent(OLD_INSTALL_BUNDLE);
  if (result.status !== "patched") {
    throw new Error(`expected patched, got ${result.status}: ${result.detail}`);
  }
  const output = result.nextContent ?? "";
  for (
    const marker of [
      'import os from "node:os";',
      "openclaw-npm-plugin-rollback-",
      "createManagedNpmPluginInstallRollbackSnapshot",
      "restoreManagedNpmPluginInstallRollbackSnapshot",
      "snapshot: rollbackSnapshot",
      "await cleanupManagedNpmPluginInstallRollbackSnapshot(rollbackSnapshot);",
    ]
  ) {
    if (!output.includes(marker)) {
      throw new Error(`missing marker after patch: ${marker}`);
    }
  }
});

Deno.test("installer rollback hotpatch is idempotent", () => {
  const first = patchNpmPluginInstallRollbackContent(OLD_INSTALL_BUNDLE);
  if (first.status !== "patched" || !first.nextContent) {
    throw new Error(`expected first patch, got ${first.status}`);
  }
  const second = patchNpmPluginInstallRollbackContent(first.nextContent);
  if (second.status !== "already") {
    throw new Error(`expected already, got ${second.status}`);
  }
});

Deno.test("installer rollback hotpatch skips unrelated install bundles", () => {
  const result = patchNpmPluginInstallRollbackContent(
    'import path from "node:path";\nexport const value = 1;\n',
  );
  if (result.status !== "skipped") {
    throw new Error(`expected skipped, got ${result.status}`);
  }
});
