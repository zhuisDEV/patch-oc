import type { PatchDecision, PatchDefinition } from "../lib/patch_utils.ts";

const CHILD_BLOCK_START = 'if (placement === "child") {';
const CHILD_BLOCK_END = "} else threadId = conversationId || void 0;";
const ORIGINAL_NEEDLE = "threadId: conversationId";
const PATCHED_NEEDLE =
  "threadId: /^channel:/i.test(conversationId) ? conversationId.slice(8) : conversationId";

export function patchDiscordChildPrimaryBindingContent(
  content: string,
): PatchDecision {
  const start = content.indexOf(CHILD_BLOCK_START);
  if (start < 0) {
    return {
      status: "skipped",
      detail: "Discord child-placement block not found",
    };
  }

  const end = content.indexOf(CHILD_BLOCK_END, start);
  if (end < 0) {
    return {
      status: "error",
      detail: "Discord child-placement block end not found",
    };
  }

  const section = content.slice(start, end);
  if (section.includes(PATCHED_NEEDLE)) {
    return {
      status: "already",
      detail: "Discord child primary binding already normalizes channel: IDs",
      nextContent: content,
    };
  }

  if (!section.includes(ORIGINAL_NEEDLE)) {
    return {
      status: "error",
      detail: "threadId assignment in child placement block not found",
    };
  }

  const patchedSection = section.replace(ORIGINAL_NEEDLE, PATCHED_NEEDLE);
  const nextContent = content.slice(0, start) + patchedSection +
    content.slice(end);

  if (!nextContent.includes(PATCHED_NEEDLE)) {
    return {
      status: "error",
      detail: "post-patch marker validation failed",
    };
  }

  return {
    status: "patched",
    detail:
      "normalized channel: conversation IDs for Discord child primary binding",
    nextContent,
  };
}

export const discordChildPrimaryBindingPatch: PatchDefinition = {
  id: "discord-child-primary-binding",
  aliases: [
    "3",
    "part3",
    "discord-child",
    "thread-binding-primary",
    "thread-binding-channel-prefix",
  ],
  title: "Discord child primary binding normalization",
  summary:
    "Fixes child-placement thread binding by normalizing channel:<id> before parent channel resolution.",
  filePattern: /^thread-bindings\.manager(?:-[A-Za-z0-9_]+)?\.js$/,
  backupSuffix: ".bak-discord-child-primary-binding",
  patchFileContent: patchDiscordChildPrimaryBindingContent,
};
