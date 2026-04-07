import {
  acpRoutedFallbackPatch,
  patchAcpRoutedFallbackContent,
} from "../patches/acp_routed_fallback.ts";

Deno.test("part2 patches ACP visibility so non-tool text is visible", () => {
  const input =
    `function normalizeDeliveryChannel(value) {\n\treturn value?.trim().toLowerCase() || void 0;\n}\nasync function shouldTreatDeliveredTextAsVisible(params) {\n\tif (!params.text?.trim()) return false;\n\tif (params.kind === "final") return true;\n\treturn normalizeDeliveryChannel(params.channel) === "telegram";\n}\nfunction createAcpDispatchDeliveryCoordinator(params) {\n\tconst tracksVisibleText = shouldTreatDeliveredTextAsVisible({\n\t\tchannel: routedChannel,\n\t\tkind,\n\t\ttext: ttsPayload.text\n\t});\n\tconst directVisibleText = shouldTreatDeliveredTextAsVisible({\n\t\tchannel: directChannel,\n\t\tkind,\n\t\ttext: ttsPayload.text\n\t});\n\treturn { tracksVisibleText, directVisibleText };\n}`;

  const result = patchAcpRoutedFallbackContent(input);
  if (result.status !== "patched") {
    throw new Error(`expected patched, got ${result.status}`);
  }
  if (
    !result.nextContent?.includes('if (params.kind === "tool") return false;')
  ) {
    throw new Error("missing non-tool visibility marker");
  }
});

Deno.test("part2 reports already when non-tool visibility already exists", () => {
  const input =
    `function normalizeDeliveryChannel(value) {\n\treturn value?.trim().toLowerCase() || void 0;\n}\nfunction shouldTreatDeliveredTextAsVisible(params) {\n\tif (!params.text?.trim()) return false;\n\tif (params.kind === "tool") return false;\n\treturn true;\n}\nfunction createAcpDispatchDeliveryCoordinator(params) {\n\tconst tracksVisibleText = shouldTreatDeliveredTextAsVisible({\n\t\tchannel: routedChannel,\n\t\tkind,\n\t\ttext: ttsPayload.text\n\t});\n\tconst directVisibleText = shouldTreatDeliveredTextAsVisible({\n\t\tchannel: directChannel,\n\t\tkind,\n\t\ttext: ttsPayload.text\n\t});\n\treturn { tracksVisibleText, directVisibleText };\n}`;

  const result = patchAcpRoutedFallbackContent(input);
  if (result.status !== "already") {
    throw new Error(`expected already, got ${result.status}`);
  }
});

Deno.test("part2 file pattern matches hashed and unhashed dispatch bundles", () => {
  if (!acpRoutedFallbackPatch.filePattern.test("dispatch-acp.runtime.js")) {
    throw new Error("expected unhashed runtime bundle to match");
  }
  if (
    !acpRoutedFallbackPatch.filePattern.test(
      "dispatch-acp.runtime-DyGP6Eev.js",
    )
  ) {
    throw new Error("expected hashed runtime bundle to match");
  }
  if (!acpRoutedFallbackPatch.filePattern.test("dispatch-acp-Da_OnWGW.js")) {
    throw new Error("expected delegated ACP bundle to match");
  }
  if (
    acpRoutedFallbackPatch.filePattern.test(
      "dispatch-acp-command-bypass-CyZG1x6a.js",
    )
  ) {
    throw new Error("did not expect command-bypass bundle to match");
  }
});
