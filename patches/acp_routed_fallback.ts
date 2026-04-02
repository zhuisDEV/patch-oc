import type { PatchDecision, PatchDefinition } from "../lib/patch_utils.ts";

const TARGET_REGION_MARKER =
  "function shouldTreatDeliveredTextAsVisible(params) {";
const FINAL_FALLBACK_GUARD_MARKER =
  "params.delivery.getRoutedCounts().block === 0";

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
  if (
    !content.includes(TARGET_REGION_MARKER) &&
    !content.includes("async function finalizeAcpTurnOutput(params)")
  ) {
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
  const hasFallbackGuard = content.includes(FINAL_FALLBACK_GUARD_MARKER);

  if (
    hasFallbackGuard ||
    (hasDesiredFunction && hasRoutedTrue && hasRoutedFalse)
  ) {
    return {
      status: "already",
      detail:
        "effective routed replay suppression already present (call-site and/or fallback guard)",
      nextContent: content,
    };
  }

  let next = content;
  const edits: string[] = [];

  if (!hasDesiredFunction) {
    const funcRegex =
      /function shouldTreatDeliveredTextAsVisible\(params\)\s*\{[\s\S]*?\n\}/;
    if (funcRegex.test(next)) {
      next = next.replace(funcRegex, DESIRED_FUNC);
      edits.push("visibility function");
    }
  }

  if (!next.includes("routed: true")) {
    const result = injectRoutedFlag(next, "routedChannel", "true");
    if (result.changed) {
      next = result.text;
      edits.push("routed true call-site");
    }
  }

  if (!next.includes("routed: false")) {
    const result = injectRoutedFlag(next, "directChannel", "false");
    if (result.changed) {
      next = result.text;
      edits.push("routed false call-site");
    }
  }

  if (!next.includes(FINAL_FALLBACK_GUARD_MARKER)) {
    const fallbackRegex =
      /if \(ttsMode !== "all" && hasAccumulatedBlockText &&/;
    if (fallbackRegex.test(next)) {
      next = next.replace(
        fallbackRegex,
        `if (ttsMode !== "all" && hasAccumulatedBlockText && ${FINAL_FALLBACK_GUARD_MARKER} &&`,
      );
      edits.push("final fallback guard");
    }
  }

  const nowHasDesiredFunction = next.includes(
    'if (params.routed && params.kind === "block") return true;',
  );
  const nowHasRoutedTrue = next.includes("routed: true");
  const nowHasRoutedFalse = next.includes("routed: false");
  const nowHasFallbackGuard = next.includes(FINAL_FALLBACK_GUARD_MARKER);
  const effectiveSuppression = nowHasFallbackGuard ||
    (nowHasDesiredFunction && nowHasRoutedTrue && nowHasRoutedFalse);

  if (!effectiveSuppression) {
    return {
      status: "error",
      detail:
        "unable to apply effective routed replay suppression markers; runtime shape may have changed",
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
    detail: edits.length > 0
      ? `patched ${edits.join(", ")}`
      : "patched effective routed replay suppression",
    nextContent: next,
  };
}

export const acpRoutedFallbackPatch: PatchDefinition = {
  id: "acp-routed-fallback",
  aliases: ["2", "part2", "acp", "duplicate-reply", "dispatch-acp"],
  title: "ACP routed fallback replay",
  summary:
    "Fixes routed ACP turns replaying accumulated block text again as a final reply.",
  filePattern: /^dispatch-acp\.runtime(?:-.*)?\.js$/,
  backupSuffix: ".bak-acp-routed-visible-block",
  patchFileContent: patchAcpRoutedFallbackContent,
};
