import {
  discordChildPrimaryBindingPatch,
  patchDiscordChildPrimaryBindingContent,
} from "../patches/discord_child_primary_binding.ts";

Deno.test("part3 patches Discord child primary binding to normalize channel IDs", () => {
  const input =
    `const sessionBindingAdapter = {\n\tbind: async (input) => {\n\t\tconst conversationId = input.conversation.conversationId ?? \"\";\n\t\tlet channelId = input.conversation.parentConversationId;\n\t\tif (placement === \"child\") {\n\t\t\tcreateThread = true;\n\t\t\tif (!channelId && conversationId) channelId = await resolveChannelIdForBinding({\n\t\t\t\tcfg: resolveCurrentCfg(),\n\t\t\t\taccountId,\n\t\t\t\ttoken: resolveCurrentToken(),\n\t\t\t\tthreadId: conversationId\n\t\t\t}) ?? void 0;\n\t\t} else threadId = conversationId || void 0;\n\t}\n};`;

  const result = patchDiscordChildPrimaryBindingContent(input);
  if (result.status !== "patched") {
    throw new Error(`expected patched, got ${result.status}`);
  }
  if (
    !result.nextContent?.includes(
      "threadId: /^channel:/i.test(conversationId) ? conversationId.slice(8) : conversationId",
    )
  ) {
    throw new Error("missing channel-prefix normalization marker");
  }
});

Deno.test("part3 reports already when normalization already exists", () => {
  const input =
    `if (placement === \"child\") {\n\tcreateThread = true;\n\tif (!channelId && conversationId) channelId = await resolveChannelIdForBinding({\n\t\tcfg: resolveCurrentCfg(),\n\t\taccountId,\n\t\ttoken: resolveCurrentToken(),\n\t\tthreadId: /^channel:/i.test(conversationId) ? conversationId.slice(8) : conversationId\n\t}) ?? void 0;\n} else threadId = conversationId || void 0;`;

  const result = patchDiscordChildPrimaryBindingContent(input);
  if (result.status !== "already") {
    throw new Error(`expected already, got ${result.status}`);
  }
});

Deno.test("part3 file pattern matches hashed and unhashed manager bundles", () => {
  if (
    !discordChildPrimaryBindingPatch.filePattern.test(
      "thread-bindings.manager.js",
    )
  ) {
    throw new Error("expected unhashed manager bundle to match");
  }
  if (
    !discordChildPrimaryBindingPatch.filePattern.test(
      "thread-bindings.manager-Dki468EV.js",
    )
  ) {
    throw new Error("expected hashed manager bundle to match");
  }
  if (
    discordChildPrimaryBindingPatch.filePattern.test(
      "thread-bindings.state-DYxR1cgm.js",
    )
  ) {
    throw new Error("did not expect state bundle to match");
  }
});
