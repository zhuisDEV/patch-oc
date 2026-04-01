import type { PatchDecision, PatchDefinition } from "../lib/patch_utils.ts";

const TARGET_REGION_MARKER =
  "function shouldTreatDeliveredTextAsVisible(params) {";

const DESIRED_FUNC =
  `function shouldTreatDeliveredTextAsVisible(params) {\n\tif (!params.text?.trim()) return false;\n\tif (params.kind === "final") return true;\n\tif (params.routed && params.kind === "block") return true;\n\treturn normalizeDeliveryChannel(params.channel) === "telegram";\n}`;

function injectRoutedFlag(
  input: string,
  channelExpr: "routedChannel" | "directChannel",
  routedValue: "true" | "false",
): { text: string; changed: boolean } {
  const pattern = new RegExp(
    String
      .raw`shouldTreatDeliveredTextAsVisible\(\{\s*channel:\s*${channelExpr}\s*,\s*kind\s*,\s*text:\s*ttsPayload\.text\s*(,)?\s*\}\)`,
    "m",
  );
  const match = input.match(pattern);
  if (!match) return { text: input, changed: false };

  const replacement =
    `shouldTreatDeliveredTextAsVisible({\n\t\t\tchannel: ${channelExpr},\n\t\t\tkind,\n\t\t\ttext: ttsPayload.text,\n\t\t\trouted: ${routedValue}\n\t\t})`;

  return {
    text: input.replace(pattern, replacement),
    changed: true,
  };
}

export function patchAcpRoutedFallbackContent(content: string): PatchDecision {
  if (!content.includes(TARGET_REGION_MARKER)) {
    return {
      status: "skipped",
      detail: "ACP delivery visibility function not found",
    };
  }

  const hasDesiredFunction = content.includes(
    'if (params.routed && params.kind === "block") return true;',
  );
  const hasRoutedTrue = content.includes("routed: true");
  const hasRoutedFalse = content.includes("routed: false");

  if (hasDesiredFunction && hasRoutedTrue && hasRoutedFalse) {
    return {
      status: "already",
      detail: "routed visibility + call-site flags already present",
      nextContent: content,
    };
  }

  const funcRegex =
    /function shouldTreatDeliveredTextAsVisible\(params\) \{[\s\S]*?\n\}(?=\nfunction createAcpDispatchDeliveryCoordinator\(params\) \{)/;
  if (!funcRegex.test(content)) {
    return {
      status: "error",
      detail:
        "unable to locate shouldTreatDeliveredTextAsVisible function block",
    };
  }

  let next = content.replace(funcRegex, DESIRED_FUNC);

  if (
    !next.includes('if (params.routed && params.kind === "block") return true;')
  ) {
    return {
      status: "error",
      detail: "function patch marker missing after replace",
    };
  }

  next = injectRoutedFlag(next, "routedChannel", "true").text;
  next = injectRoutedFlag(next, "directChannel", "false").text;

  const missingMarkers = [
    !next.includes("routed: true") ? "routed: true call-site" : "",
    !next.includes("routed: false") ? "routed: false call-site" : "",
  ].filter(Boolean);

  if (missingMarkers.length > 0) {
    return {
      status: "error",
      detail: `missing patch markers: ${missingMarkers.join(", ")}`,
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
    detail: "patched routed block visibility and call-site routing flags",
    nextContent: next,
  };
}

export const acpRoutedFallbackPatch: PatchDefinition = {
  id: "acp-routed-fallback",
  aliases: ["2", "part2", "acp", "duplicate-reply", "dispatch-acp"],
  title: "ACP routed fallback replay",
  summary:
    "Fixes routed ACP turns replaying accumulated block text again as a final reply.",
  filePattern: /^dispatch-acp\.runtime-.*\.js$/,
  backupSuffix: ".bak-acp-routed-visible-block",
  patchFileContent: patchAcpRoutedFallbackContent,
};
