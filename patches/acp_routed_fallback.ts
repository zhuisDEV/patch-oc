import type { PatchDecision, PatchDefinition } from "../lib/patch_utils.ts";

const TARGET_REGION_MARKER =
  "function shouldTreatDeliveredTextAsVisible(params) {";
const NEW_FUNC =
  `function shouldTreatDeliveredTextAsVisible(params) {\n\tif (!params.text?.trim()) return false;\n\tif (params.kind === "tool") return false;\n\treturn true;\n}`;

export function patchAcpRoutedFallbackContent(content: string): PatchDecision {
  if (
    !content.includes(TARGET_REGION_MARKER) &&
    !content.includes("async function finalizeAcpTurnOutput(params)")
  ) {
    return {
      status: "skipped",
      detail: "ACP delivery visibility function not found",
    };
  }

  if (content.includes('if (params.kind === "tool") return false;')) {
    return {
      status: "already",
      detail: "ACP visibility function already treats non-tool text as visible",
      nextContent: content,
    };
  }

  const funcRegex =
    /function shouldTreatDeliveredTextAsVisible\(params\)\s*\{[\s\S]*?\n\}/;
  if (!funcRegex.test(content)) {
    return {
      status: "error",
      detail:
        "unable to locate shouldTreatDeliveredTextAsVisible function block",
    };
  }

  const next = content.replace(funcRegex, NEW_FUNC);

  if (!next.includes('if (params.kind === "tool") return false;')) {
    return {
      status: "error",
      detail: "visibility function patch marker missing after replace",
    };
  }

  if (next === content) {
    return {
      status: "already",
      detail: "content already in expected patched form",
      nextContent: content,
    };
  }

  return {
    status: "patched",
    detail: "patched ACP visibility so non-tool text counts as visible",
    nextContent: next,
  };
}

export const acpRoutedFallbackPatch: PatchDefinition = {
  id: "acp-routed-fallback",
  aliases: ["2", "part2", "acp", "duplicate-reply", "dispatch-acp"],
  title: "ACP routed fallback replay",
  summary:
    "Fixes ACP turns replaying accumulated block text again as a final reply.",
  filePattern: /^dispatch-acp(?:\.runtime(?:-.*)?|-[A-Za-z0-9_]+)\.js$/,
  backupSuffix: ".bak-acp-routed-visible-block",
  patchFileContent: patchAcpRoutedFallbackContent,
};
