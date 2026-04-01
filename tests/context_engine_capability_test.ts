import { patchContextEngineCapabilityContent } from "../patches/context_engine_capability.ts";

Deno.test("part1 patches a status bundle with missing context-engine capability", () => {
  const input =
    `function buildCapabilityEntries(plugin) {\n\treturn [\n\t\t{\n\t\t\tkind: "tool",\n\t\t\tids: plugin.kind === "tool" ? [plugin.id] : []\n\t\t}\n\t].filter((entry) => entry.ids.length > 0);\n}\nfunction deriveInspectShape(params) {\n\treturn params;\n}`;

  const result = patchContextEngineCapabilityContent(input);
  if (result.status !== "patched") {
    throw new Error(`expected patched, got ${result.status}`);
  }
  if (!result.nextContent?.includes('kind: "context-engine"')) {
    throw new Error("missing context-engine capability marker");
  }
});

Deno.test("part1 reports already when the capability mapping exists", () => {
  const input =
    `function buildCapabilityEntries(plugin) {\n\treturn [\n\t\t{\n\t\t\tkind: "context-engine",\n\t\t\tids: plugin.kind === "context-engine" ? [plugin.id] : []\n\t\t}\n\t].filter((entry) => entry.ids.length > 0);\n}\nfunction deriveInspectShape(params) {\n\treturn params;\n}`;

  const result = patchContextEngineCapabilityContent(input);
  if (result.status !== "already") {
    throw new Error(`expected already, got ${result.status}`);
  }
});
