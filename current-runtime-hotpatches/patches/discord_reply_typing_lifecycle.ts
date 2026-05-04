import type { PatchDecision, PatchDefinition } from "../lib/patch_utils.ts";

const CORE_ON_SKIP_MARKER = "options?.onSkip?.()";
const CORE_OLD_QUEUE_SECTION = `\treturn {
\t\tenqueue(key, task) {
\t\t\tqueue.enqueue(key, async () => {
\t\t\t\tif (!runState.isActive()) return;
\t\t\t\trunState.onRunStart();
\t\t\t\ttry {
\t\t\t\t\tif (!runState.isActive()) return;
\t\t\t\t\tawait task({ lifecycleSignal: params.abortSignal });
\t\t\t\t} finally {
\t\t\t\t\trunState.onRunEnd();
\t\t\t\t}
\t\t\t}).catch(reportError);
\t\t},
\t\tdeactivate: runState.deactivate
\t};`;
const CORE_NEW_QUEUE_SECTION = `\treturn {
\t\tenqueue(key, task, options) {
\t\t\tconst onSkip = async () => {
\t\t\t\tawait options?.onSkip?.();
\t\t\t};
\t\t\tqueue.enqueue(key, async () => {
\t\t\t\tif (!runState.isActive()) {
\t\t\t\t\tawait onSkip();
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t\trunState.onRunStart();
\t\t\t\ttry {
\t\t\t\t\tif (!runState.isActive()) {
\t\t\t\t\t\tawait onSkip();
\t\t\t\t\t\treturn;
\t\t\t\t\t}
\t\t\t\t\tawait task({ lifecycleSignal: params.abortSignal });
\t\t\t\t} finally {
\t\t\t\t\trunState.onRunEnd();
\t\t\t\t}
\t\t\t}).catch(reportError);
\t\t},
\t\tdeactivate: runState.deactivate
\t};`;

const HANDLER_PATCH_MARKER = "createPatchOcDiscordReplyTypingFeedback";
const HANDLER_IMPORT_AFTER =
  `import { createChannelRunQueue } from "openclaw/plugin-sdk/channel-lifecycle";\n`;
const HANDLER_TYPING_IMPORT =
  `import { createTypingCallbacks } from "openclaw/plugin-sdk/channel-reply-pipeline";\n`;
const HANDLER_OLD_JOB_DESTRUCTURE =
  "const { runtime, abortSignal, guildHistories, client, threadBindings, discordRestFetch, message, data, threadChannel, ...payload } = ctx;";
const HANDLER_NEW_JOB_DESTRUCTURE =
  "const { runtime, abortSignal, guildHistories, client, threadBindings, replyTypingFeedback, discordRestFetch, message, data, threadChannel, ...payload } = ctx;";
const HANDLER_OLD_JOB_RUNTIME = `\t\truntime: {
\t\t\truntime,
\t\t\tabortSignal,
\t\t\tguildHistories,
\t\t\tclient,
\t\t\tthreadBindings,
\t\t\tdiscordRestFetch
\t\t},`;
const HANDLER_NEW_JOB_RUNTIME = `\t\truntime: {
\t\t\truntime,
\t\t\tabortSignal,
\t\t\tguildHistories,
\t\t\tclient,
\t\t\tthreadBindings,
\t\t\treplyTypingFeedback,
\t\t\tdiscordRestFetch
\t\t},`;
const HANDLER_OLD_QUEUE_ENQUEUE =
  `\t\t\trunQueue.enqueue(job.queueKey, async ({ lifecycleSignal }) => {
\t\t\t\tawait processDiscordQueuedMessage({
\t\t\t\t\tjob,
\t\t\t\t\tlifecycleSignal,
\t\t\t\t\treplayGuard,
\t\t\t\t\ttesting: params.__testing
\t\t\t\t});
\t\t\t});`;
const HANDLER_NEW_QUEUE_ENQUEUE =
  `\t\t\trunQueue.enqueue(job.queueKey, async ({ lifecycleSignal }) => {
\t\t\t\tawait processDiscordQueuedMessage({
\t\t\t\t\tjob,
\t\t\t\t\tlifecycleSignal,
\t\t\t\t\treplayGuard,
\t\t\t\t\ttesting: params.__testing
\t\t\t\t});
\t\t\t}, {
\t\t\t\tonSkip: () => cleanupSkippedDiscordQueuedMessage({ job, replayGuard })
\t\t\t});`;
const HANDLER_DM_ONLY_TYPING_GATE =
  "if (!ctx.isDirectMessage || ctx.isGuildMessage || ctx.isGroupDm) return false;";
const HANDLER_OLD_SHOULD_SEND_TYPING_CUE =
  `function shouldSendAcceptedDiscordTypingCue(ctx) {
\tif (ctx.abortSignal?.aborted) return false;
\tif (!ctx.isDirectMessage || ctx.isGuildMessage || ctx.isGroupDm) return false;
\tif (!ctx.messageText.trim()) return false;
\tconst configuredTypingMode = ctx.cfg.session?.typingMode ?? ctx.cfg.agents?.defaults?.typingMode;
\treturn configuredTypingMode === void 0 || configuredTypingMode === "instant";
}`;
const HANDLER_NEW_SHOULD_SEND_TYPING_CUE =
  `function shouldSendAcceptedDiscordTypingCue(ctx) {
\tif (ctx.abortSignal?.aborted) return false;
\tif (!ctx.messageChannelId?.trim?.()) return false;
\tif (!ctx.messageText.trim()) return false;
\tconst configuredTypingMode = ctx.cfg.session?.typingMode ?? ctx.cfg.agents?.defaults?.typingMode;
\treturn configuredTypingMode === void 0 || configuredTypingMode === "instant";
}`;
const HANDLER_CLEANUP_FUNCTION =
  `function cleanupSkippedDiscordQueuedMessage(params) {
\ttry {
\t\tparams.job.runtime.replyTypingFeedback?.onCleanup?.();
\t} finally {
\t\treleaseDiscordInboundReplay({
\t\t\treplayKeys: params.job.replayKeys,
\t\t\terror: new DiscordRetryableInboundError("discord queued run skipped before processing"),
\t\t\treplayGuard: params.replayGuard
\t\t});
\t}
}
`;
const HANDLER_QUEUE_FUNCTION =
  `const PATCH_OC_DISCORD_REPLY_TYPING_MAX_DURATION_MS = 20 * 6e4;
function createPatchOcDiscordReplyTypingFeedback(params) {
\tlet channelId = params.channelId;
\tconst rest = params.rest ?? createDiscordRestClient({
\t\tcfg: params.cfg,
\t\ttoken: params.token,
\t\taccountId: params.accountId
\t}).rest;
\tconst callbacks = createTypingCallbacks({
\t\tstart: () => sendTyping({ rest, channelId }),
\t\tonStartError: (err) => {
\t\t\tparams.log(\`discord typing failed for channel \${channelId}: \${String(err)}\`);
\t\t},
\t\tmaxDurationMs: params.maxDurationMs ?? PATCH_OC_DISCORD_REPLY_TYPING_MAX_DURATION_MS
\t});
\treturn {
\t\t...callbacks,
\t\tupdateChannelId: (nextChannelId) => {
\t\t\tconst trimmed = nextChannelId?.trim?.() ?? "";
\t\t\tif (trimmed) channelId = trimmed;
\t\t},
\t\tgetChannelId: () => channelId
\t};
}
function queueAcceptedDiscordTypingCue(ctx) {
\tif (!shouldSendAcceptedDiscordTypingCue(ctx)) return;
\tif (ctx.replyTypingFeedback) {
\t\tctx.replyTypingFeedback.onReplyStart().catch((err) => {
\t\t\tctx.runtime.error?.(danger(\`discord accepted typing failed: \${String(err)}\`));
\t\t});
\t\treturn;
\t}
\tconst replyTypingFeedback = createPatchOcDiscordReplyTypingFeedback({
\t\tcfg: ctx.cfg,
\t\ttoken: ctx.token,
\t\taccountId: ctx.accountId,
\t\tchannelId: ctx.messageChannelId,
\t\tlog: (message) => {
\t\t\tctx.runtime.error?.(danger(message));
\t\t}
\t});
\tctx.replyTypingFeedback = replyTypingFeedback;
\treplyTypingFeedback.onReplyStart().catch((err) => {
\t\tctx.runtime.error?.(danger(\`discord accepted typing failed: \${String(err)}\`));
\t});
}`;

const PROCESS_PATCH_MARKER = "typingCallbacks: typingFeedback";
const PROCESS_OLD_START =
  "async function processDiscordMessage(ctx, observer) {\n\tconst { cfg, discordConfig, accountId, token, runtime, guildHistories, historyLimit, mediaMaxBytes, textLimit, replyToMode, ackReactionScope, message, messageChannelId, isGuildMessage, isDirectMessage, isGroupDm, messageText, shouldRequireMention, canDetectMention, effectiveWasMentioned, shouldBypassMention, channelConfig, threadBindings, route, discordRestFetch, abortSignal } = ctx;";
const PROCESS_NEW_START =
  "async function processDiscordMessage(ctx, observer) {\n\ttry {\n\t\treturn await processDiscordMessageInner(ctx, observer);\n\t} finally {\n\t\tctx.replyTypingFeedback?.onCleanup?.();\n\t}\n}\nasync function processDiscordMessageInner(ctx, observer) {\n\tconst { cfg, discordConfig, accountId, token, runtime, guildHistories, historyLimit, mediaMaxBytes, textLimit, replyToMode, ackReactionScope, message, messageChannelId, isGuildMessage, isDirectMessage, isGroupDm, messageText, shouldRequireMention, canDetectMention, effectiveWasMentioned, shouldBypassMention, channelConfig, threadBindings, route, discordRestFetch, abortSignal, replyTypingFeedback } = ctx;";
const PROCESS_OLD_PIPELINE =
  `\tconst typingChannelId = deliverTarget.startsWith("channel:") ? deliverTarget.slice(8) : messageChannelId;
\tconst { onModelSelected, ...replyPipeline } = createChannelReplyPipeline({
\t\tcfg,
\t\tagentId: route.agentId,
\t\tchannel: "discord",
\t\taccountId: route.accountId,
\t\ttyping: {
\t\t\tstart: () => sendTyping({
\t\t\t\trest: feedbackRest,
\t\t\t\tchannelId: typingChannelId
\t\t\t}),
\t\t\tonStartError: (err) => {
\t\t\t\tlogTypingFailure({
\t\t\t\t\tlog: logVerbose,
\t\t\t\t\tchannel: "discord",
\t\t\t\t\ttarget: typingChannelId,
\t\t\t\t\terror: err
\t\t\t\t});
\t\t\t},
\t\t\tmaxDurationMs: DISCORD_TYPING_MAX_DURATION_MS
\t\t}
\t});`;
const PROCESS_NEW_PIPELINE =
  `\tconst typingChannelId = deliverTarget.startsWith("channel:") ? deliverTarget.slice(8) : messageChannelId;
\tconst typingFeedback = replyTypingFeedback;
\ttypingFeedback?.updateChannelId?.(typingChannelId);
\tconst { onModelSelected, ...replyPipeline } = createChannelReplyPipeline({
\t\tcfg,
\t\tagentId: route.agentId,
\t\tchannel: "discord",
\t\taccountId: route.accountId,
\t\t...(typingFeedback ? {
\t\t\ttypingCallbacks: typingFeedback
\t\t} : {
\t\t\ttyping: {
\t\t\t\tstart: () => sendTyping({
\t\t\t\t\trest: feedbackRest,
\t\t\t\t\tchannelId: typingChannelId
\t\t\t\t}),
\t\t\t\tonStartError: (err) => {
\t\t\t\t\tlogTypingFailure({
\t\t\t\t\t\tlog: logVerbose,
\t\t\t\t\t\tchannel: "discord",
\t\t\t\t\t\ttarget: typingChannelId,
\t\t\t\t\t\terror: err
\t\t\t\t\t});
\t\t\t\t},
\t\t\t\tmaxDurationMs: DISCORD_TYPING_MAX_DURATION_MS
\t\t\t}
\t\t})
\t});`;

function alreadyHasSourceHandlerFix(content: string): boolean {
  return content.includes("startAcceptedTypingFeedback") &&
    content.includes("replyTypingFeedback");
}

function hasGenericAcceptedTypingCueScope(content: string): boolean {
  return !content.includes(HANDLER_DM_ONLY_TYPING_GATE);
}

function alreadyHasSourceProcessFix(content: string): boolean {
  return content.includes("createDiscordReplyTypingFeedback") &&
    content.includes("typingCallbacks: typingFeedback") &&
    content.includes("replyTypingFeedback");
}

function replaceRequired(
  content: string,
  oldValue: string,
  newValue: string,
  detail: string,
): { ok: true; content: string } | { ok: false; decision: PatchDecision } {
  if (!content.includes(oldValue)) {
    return {
      ok: false,
      decision: {
        status: "error",
        detail: `unable to locate ${detail}; bundle shape may have drifted`,
      },
    };
  }
  return { ok: true, content: content.replace(oldValue, newValue) };
}

export function patchChannelRunQueueOnSkipContent(
  content: string,
): PatchDecision {
  if (content.includes(CORE_ON_SKIP_MARKER)) {
    return {
      status: "already",
      detail: "channel run queue already supports skipped-run cleanup hooks",
    };
  }
  if (!content.includes("function createChannelRunQueue(params)")) {
    return {
      status: "skipped",
      detail: "not a channel lifecycle bundle",
    };
  }
  const replaced = replaceRequired(
    content,
    CORE_OLD_QUEUE_SECTION,
    CORE_NEW_QUEUE_SECTION,
    "channel run queue implementation",
  );
  if (!replaced.ok) return replaced.decision;
  return {
    status: "patched",
    detail: "added skipped-run cleanup hook support to channel run queue",
    nextContent: replaced.content,
  };
}

export function patchDiscordMessageHandlerTypingLifecycleContent(
  content: string,
): PatchDecision {
  const hasLifecyclePatch = content.includes(HANDLER_PATCH_MARKER);
  if (hasLifecyclePatch && !hasGenericAcceptedTypingCueScope(content)) {
    const broadened = replaceRequired(
      content,
      HANDLER_OLD_SHOULD_SEND_TYPING_CUE,
      HANDLER_NEW_SHOULD_SEND_TYPING_CUE,
      "accepted typing cue scope",
    );
    if (!broadened.ok) return broadened.decision;
    return {
      status: "patched",
      detail:
        "broadened accepted Discord typing feedback from DMs to all accepted channels",
      nextContent: broadened.content,
    };
  }
  if (
    hasLifecyclePatch ||
    alreadyHasSourceHandlerFix(content)
  ) {
    return {
      status: "already",
      detail:
        "discord message handler already carries accepted reply typing feedback",
    };
  }
  if (
    !content.includes("function buildDiscordInboundJob(ctx, options)") ||
    !content.includes("function queueAcceptedDiscordTypingCue(ctx)")
  ) {
    return {
      status: "skipped",
      detail: "not the discord message handler bundle",
    };
  }

  let next = content;
  const shouldSendReplaced = replaceRequired(
    next,
    HANDLER_OLD_SHOULD_SEND_TYPING_CUE,
    HANDLER_NEW_SHOULD_SEND_TYPING_CUE,
    "accepted typing cue scope",
  );
  if (!shouldSendReplaced.ok) return shouldSendReplaced.decision;
  next = shouldSendReplaced.content;

  if (!next.includes(`openclaw/plugin-sdk/channel-reply-pipeline`)) {
    const imported = replaceRequired(
      next,
      HANDLER_IMPORT_AFTER,
      HANDLER_IMPORT_AFTER + HANDLER_TYPING_IMPORT,
      "channel reply pipeline import insertion point",
    );
    if (!imported.ok) return imported.decision;
    next = imported.content;
  }

  for (
    const replacement of [
      {
        oldValue: HANDLER_OLD_JOB_DESTRUCTURE,
        newValue: HANDLER_NEW_JOB_DESTRUCTURE,
        detail: "inbound job destructure",
      },
      {
        oldValue: HANDLER_OLD_JOB_RUNTIME,
        newValue: HANDLER_NEW_JOB_RUNTIME,
        detail: "inbound job runtime payload",
      },
    ]
  ) {
    const replaced = replaceRequired(
      next,
      replacement.oldValue,
      replacement.newValue,
      replacement.detail,
    );
    if (!replaced.ok) return replaced.decision;
    next = replaced.content;
  }

  const cleanupInserted = replaceRequired(
    next,
    "\nfunction createDiscordMessageRunQueue(params) {",
    `\n${HANDLER_CLEANUP_FUNCTION}function createDiscordMessageRunQueue(params) {`,
    "message run queue cleanup insertion point",
  );
  if (!cleanupInserted.ok) return cleanupInserted.decision;
  next = cleanupInserted.content;

  const enqueueReplaced = replaceRequired(
    next,
    HANDLER_OLD_QUEUE_ENQUEUE,
    HANDLER_NEW_QUEUE_ENQUEUE,
    "message run queue enqueue call",
  );
  if (!enqueueReplaced.ok) return enqueueReplaced.decision;
  next = enqueueReplaced.content;

  const queueStart = next.indexOf(
    "function queueAcceptedDiscordTypingCue(ctx) {",
  );
  const queueEnd = next.indexOf(
    "\nfunction createDiscordMessageHandler(params) {",
    queueStart,
  );
  if (queueStart < 0 || queueEnd < 0) {
    return {
      status: "error",
      detail: "unable to locate accepted typing cue function boundary",
    };
  }
  next = next.slice(0, queueStart) + HANDLER_QUEUE_FUNCTION +
    next.slice(queueEnd);

  return {
    status: "patched",
    detail:
      "carried accepted Discord reply typing feedback into queued processing",
    nextContent: next,
  };
}

export function patchDiscordMessageProcessTypingLifecycleContent(
  content: string,
): PatchDecision {
  if (
    content.includes(PROCESS_PATCH_MARKER) ||
    alreadyHasSourceProcessFix(content)
  ) {
    return {
      status: "already",
      detail:
        "discord message process already reuses accepted reply typing feedback",
    };
  }
  if (
    !content.includes("async function processDiscordMessage(ctx, observer)") ||
    !content.includes("createChannelReplyPipeline({")
  ) {
    return {
      status: "skipped",
      detail: "not the discord message process bundle",
    };
  }

  let next = content;
  for (
    const replacement of [
      {
        oldValue: PROCESS_OLD_START,
        newValue: PROCESS_NEW_START,
        detail: "processDiscordMessage entrypoint",
      },
      {
        oldValue: PROCESS_OLD_PIPELINE,
        newValue: PROCESS_NEW_PIPELINE,
        detail: "reply typing pipeline creation",
      },
    ]
  ) {
    const replaced = replaceRequired(
      next,
      replacement.oldValue,
      replacement.newValue,
      replacement.detail,
    );
    if (!replaced.ok) return replaced.decision;
    next = replaced.content;
  }

  return {
    status: "patched",
    detail: "reused queued Discord reply typing feedback during reply dispatch",
    nextContent: next,
  };
}

export const channelRunQueueOnSkipPatch: PatchDefinition = {
  id: "discord-reply-typing-core-run-queue",
  aliases: ["discord-reply-typing-core"],
  title: "Add channel run queue skipped-run cleanup hooks",
  summary:
    "Adds an onSkip hook so queued Discord reply typing feedback is cleaned when work is skipped before processing.",
  filePattern: /^channel-lifecycle\.core(?:-[A-Za-z0-9_-]+)?\.js$/,
  candidateContainsAny: ["function createChannelRunQueue(params)"],
  backupSuffix: ".bak-discord-reply-typing-lifecycle",
  patchFileContent: patchChannelRunQueueOnSkipContent,
};

export const discordMessageHandlerTypingLifecyclePatch: PatchDefinition = {
  id: "discord-reply-typing-message-handler",
  aliases: ["discord-reply-typing-handler"],
  title: "Carry accepted Discord reply typing feedback through the queue",
  summary:
    "Starts one accepted reply typing feedback owner and passes it into queued Discord message processing.",
  filePattern: /^message-handler-[A-Za-z0-9_-]+\.js$/,
  candidateContainsAny: [
    "function buildDiscordInboundJob(ctx, options)",
    "function queueAcceptedDiscordTypingCue(ctx)",
  ],
  backupSuffix: ".bak-discord-reply-typing-lifecycle",
  patchFileContent: patchDiscordMessageHandlerTypingLifecycleContent,
};

export const discordMessageProcessTypingLifecyclePatch: PatchDefinition = {
  id: "discord-reply-typing-message-process",
  aliases: ["discord-reply-typing-process"],
  title: "Reuse accepted Discord reply typing feedback during dispatch",
  summary:
    "Uses the queued accepted typing feedback as the reply pipeline typing callbacks and cleans it up after processing.",
  filePattern: /^message-handler\.process-[A-Za-z0-9_-]+\.js$/,
  candidateContainsAny: [
    "async function processDiscordMessage(ctx, observer)",
    "createChannelReplyPipeline({",
  ],
  backupSuffix: ".bak-discord-reply-typing-lifecycle",
  patchFileContent: patchDiscordMessageProcessTypingLifecycleContent,
};
