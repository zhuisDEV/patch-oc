import { patchAcpRoutedFallbackContent } from "../patches/acp_routed_fallback.ts";

Deno.test("part2 patches routed ACP visibility and call-site flags", () => {
  const input =
    `function normalizeDeliveryChannel(value) {\n\treturn value?.trim().toLowerCase() || void 0;\n}\nfunction shouldTreatDeliveredTextAsVisible(params) {\n\tif (!params.text?.trim()) return false;\n\tif (params.kind === "final") return true;\n\treturn normalizeDeliveryChannel(params.channel) === "telegram";\n}\nfunction createAcpDispatchDeliveryCoordinator(params) {\n\tconst tracksVisibleText = shouldTreatDeliveredTextAsVisible({\n\t\tchannel: routedChannel,\n\t\tkind,\n\t\ttext: ttsPayload.text\n\t});\n\tconst directVisibleText = shouldTreatDeliveredTextAsVisible({\n\t\tchannel: directChannel,\n\t\tkind,\n\t\ttext: ttsPayload.text\n\t});\n\treturn { tracksVisibleText, directVisibleText };\n}`;

  const result = patchAcpRoutedFallbackContent(input);
  if (result.status !== "patched") {
    throw new Error(`expected patched, got ${result.status}`);
  }
  if (
    !result.nextContent?.includes(
      'if (params.routed && params.kind === "block") return true;',
    )
  ) {
    throw new Error("missing routed block visibility marker");
  }
  if (!result.nextContent.includes("routed: true")) {
    throw new Error("missing routed: true marker");
  }
  if (!result.nextContent.includes("routed: false")) {
    throw new Error("missing routed: false marker");
  }
});

Deno.test("part2 reports already when routed ACP markers already exist", () => {
  const input =
    `function normalizeDeliveryChannel(value) {\n\treturn value?.trim().toLowerCase() || void 0;\n}\nfunction shouldTreatDeliveredTextAsVisible(params) {\n\tif (!params.text?.trim()) return false;\n\tif (params.kind === "final") return true;\n\tif (params.routed && params.kind === "block") return true;\n\treturn normalizeDeliveryChannel(params.channel) === "telegram";\n}\nfunction createAcpDispatchDeliveryCoordinator(params) {\n\tconst tracksVisibleText = shouldTreatDeliveredTextAsVisible({\n\t\tchannel: routedChannel,\n\t\tkind,\n\t\ttext: ttsPayload.text,\n\t\trouted: true\n\t});\n\tconst directVisibleText = shouldTreatDeliveredTextAsVisible({\n\t\tchannel: directChannel,\n\t\tkind,\n\t\ttext: ttsPayload.text,\n\t\trouted: false\n\t});\n\treturn { tracksVisibleText, directVisibleText };\n}`;

  const result = patchAcpRoutedFallbackContent(input);
  if (result.status !== "already") {
    throw new Error(`expected already, got ${result.status}`);
  }
});
