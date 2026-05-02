import path from "node:path";
import { listMatchingDistFiles } from "../lib/patch_utils.ts";

Deno.test("listMatchingDistFiles filters by content probes when configured", async () => {
  const root = await Deno.makeTempDir({ prefix: "patch-oc-root-" });
  const dist = path.join(root, "dist");
  await Deno.mkdir(dist, { recursive: true });

  const withMarker = path.join(dist, "status-A.js");
  const withoutMarker = path.join(dist, "status-B.js");
  await Deno.writeTextFile(
    withMarker,
    "function buildCapabilityEntries(plugin) { return []; }",
  );
  await Deno.writeTextFile(withoutMarker, "export const x = 1;");

  const files = await listMatchingDistFiles(root, /^status-.*\.js$/, [
    "function buildCapabilityEntries(plugin) {",
  ]);

  if (files.length !== 1) {
    throw new Error(`expected exactly one matching file, got ${files.length}`);
  }
  if (files[0] !== withMarker) {
    throw new Error(`expected ${withMarker}, got ${files[0]}`);
  }
});
