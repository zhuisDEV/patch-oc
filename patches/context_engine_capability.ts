import type { PatchDecision, PatchDefinition } from "../lib/patch_utils.ts";

const BUILD_CAPABILITIES_START = "function buildCapabilityEntries(plugin) {";
const BUILD_CAPABILITIES_END = "function deriveInspectShape(params) {";
const CAPABILITY_FILTER_NEEDLE = "].filter((entry) => entry.ids.length > 0);";
const CONTEXT_ENGINE_MARKER = 'kind: "context-engine"';

const INSERT_CAPABILITY_BLOCK =
  `,\n\t\t{\n\t\t\tkind: "context-engine",\n\t\t\tids: plugin.kind === "context-engine" ? [plugin.id] : []\n\t\t}\n\t].filter((entry) => entry.ids.length > 0);`;

export function patchContextEngineCapabilityContent(
  content: string,
): PatchDecision {
  const start = content.indexOf(BUILD_CAPABILITIES_START);
  if (start < 0) {
    return {
      status: "skipped",
      detail: "buildCapabilityEntries not found",
    };
  }

  const end = content.indexOf(BUILD_CAPABILITIES_END, start);
  if (end < 0) {
    return {
      status: "error",
      detail: "deriveInspectShape not found after buildCapabilityEntries",
    };
  }

  const section = content.slice(start, end);
  if (section.includes(CONTEXT_ENGINE_MARKER)) {
    return {
      status: "already",
      detail: "context-engine capability already present",
      nextContent: content,
    };
  }

  if (!section.includes(CAPABILITY_FILTER_NEEDLE)) {
    return {
      status: "error",
      detail: "capability filter tail not found",
    };
  }

  const patchedSection = section.replace(
    CAPABILITY_FILTER_NEEDLE,
    INSERT_CAPABILITY_BLOCK,
  );
  const nextContent = content.slice(0, start) + patchedSection +
    content.slice(end);

  if (!nextContent.includes(CONTEXT_ENGINE_MARKER)) {
    return {
      status: "error",
      detail: "post-patch marker validation failed",
    };
  }

  return {
    status: "patched",
    detail: "inserted context-engine capability mapping",
    nextContent,
  };
}

export const contextEngineCapabilityPatch: PatchDefinition = {
  id: "context-engine-capability",
  aliases: ["1", "part1", "context-engine", "inspect"],
  title: "Context-engine capability classification",
  summary:
    "Fixes status/inspect so any context-engine plugin is counted as a capability instead of hook-only.",
  filePattern: /^status-.*\.js$/,
  backupSuffix: ".bak-context-engine-capability",
  patchFileContent: patchContextEngineCapabilityContent,
};
