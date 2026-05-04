import {
  patchChannelRunQueueOnSkipContent,
  patchDiscordMessageHandlerTypingLifecycleContent,
  patchDiscordMessageProcessTypingLifecycleContent,
} from "../patches/discord_reply_typing_lifecycle.ts";

const OLD_CHANNEL_LIFECYCLE_BUNDLE = `function createChannelRunQueue(params) {
\tconst queue = new KeyedAsyncQueue();
\tconst runState = createRunStateMachine({
\t\tsetStatus: params.setStatus,
\t\tabortSignal: params.abortSignal
\t});
\tconst reportError = (error) => {
\t\ttry {
\t\t\tparams.onError?.(error);
\t\t} catch {}
\t};
\treturn {
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
\t};
}`;

const OLD_HANDLER_BUNDLE =
  `import { t as sendTyping } from "./typing-BSi1dUHm.js";
import { danger, logVerbose } from "openclaw/plugin-sdk/runtime-env";
import { createChannelRunQueue } from "openclaw/plugin-sdk/channel-lifecycle";
function buildDiscordInboundJob(ctx, options) {
\tconst { runtime, abortSignal, guildHistories, client, threadBindings, discordRestFetch, message, data, threadChannel, ...payload } = ctx;
\treturn {
\t\tpayload,
\t\truntime: {
\t\t\truntime,
\t\t\tabortSignal,
\t\t\tguildHistories,
\t\t\tclient,
\t\t\tthreadBindings,
\t\t\tdiscordRestFetch
\t\t},
\t\treplayKeys: options?.replayKeys
\t};
}
function materializeDiscordInboundJob(job, abortSignal) {
\treturn { ...job.payload, ...job.runtime, abortSignal };
}
async function processDiscordQueuedMessage(params) {
\tconst processDiscordMessageImpl = params.testing?.processDiscordMessage ?? (await loadMessageProcessRuntime()).processDiscordMessage;
\tconst abortSignal = mergeAbortSignals([params.job.runtime.abortSignal, params.lifecycleSignal]);
\ttry {
\t\tawait processDiscordMessageImpl(materializeDiscordInboundJob(params.job, abortSignal));
\t\tawait commitDiscordInboundReplay({
\t\t\treplayKeys: params.job.replayKeys,
\t\t\treplayGuard: params.replayGuard
\t\t});
\t} catch (error) {
\t\tthrow error;
\t}
}
function createDiscordMessageRunQueue(params) {
\tconst replayGuard = params.replayGuard ?? createDiscordInboundReplayGuard();
\tconst runQueue = createChannelRunQueue({
\t\tsetStatus: params.setStatus,
\t\tabortSignal: params.abortSignal,
\t\tonError: (error) => {
\t\t\tparams.runtime.error?.(danger(\`discord message run failed: \${String(error)}\`));
\t\t}
\t});
\treturn {
\t\tenqueue(job) {
\t\t\trunQueue.enqueue(job.queueKey, async ({ lifecycleSignal }) => {
\t\t\t\tawait processDiscordQueuedMessage({
\t\t\t\t\tjob,
\t\t\t\t\tlifecycleSignal,
\t\t\t\t\treplayGuard,
\t\t\t\t\ttesting: params.__testing
\t\t\t\t});
\t\t\t});
\t\t},
\t\tdeactivate: runQueue.deactivate
\t};
}
function shouldSendAcceptedDiscordTypingCue(ctx) {
\tif (ctx.abortSignal?.aborted) return false;
\tif (!ctx.isDirectMessage || ctx.isGuildMessage || ctx.isGroupDm) return false;
\tif (!ctx.messageText.trim()) return false;
\tconst configuredTypingMode = ctx.cfg.session?.typingMode ?? ctx.cfg.agents?.defaults?.typingMode;
\treturn configuredTypingMode === void 0 || configuredTypingMode === "instant";
}
function queueAcceptedDiscordTypingCue(ctx) {
\tif (!shouldSendAcceptedDiscordTypingCue(ctx)) return;
\tconst { rest } = createDiscordRestClient({
\t\tcfg: ctx.cfg,
\t\ttoken: ctx.token,
\t\taccountId: ctx.accountId
\t});
\tsendTyping({
\t\trest,
\t\tchannelId: ctx.messageChannelId
\t}).catch((err) => {
\t\tlogVerbose(\`discord early typing cue failed for channel \${ctx.messageChannelId}: \${String(err)}\`);
\t});
}
function createDiscordMessageHandler(params) {
\treturn params;
}`;

const OLD_PROCESS_BUNDLE =
  `async function processDiscordMessage(ctx, observer) {
\tconst { cfg, discordConfig, accountId, token, runtime, guildHistories, historyLimit, mediaMaxBytes, textLimit, replyToMode, ackReactionScope, message, messageChannelId, isGuildMessage, isDirectMessage, isGroupDm, messageText, shouldRequireMention, canDetectMention, effectiveWasMentioned, shouldBypassMention, channelConfig, threadBindings, route, discordRestFetch, abortSignal } = ctx;
\tif (isProcessAborted(abortSignal)) return;
\tconst processContext = await buildDiscordMessageProcessContext({
\t\tctx,
\t\ttext,
\t\tmediaList
\t});
\tif (!processContext) return;
\tconst { ctxPayload, persistedSessionKey, turn, replyPlan, deliverTarget, replyTarget, replyReference } = processContext;
\tobserver?.onReplyPlanResolved?.({
\t\tcreatedThreadId: replyPlan.createdThreadId,
\t\tsessionKey: persistedSessionKey
\t});
\tconst typingChannelId = deliverTarget.startsWith("channel:") ? deliverTarget.slice(8) : messageChannelId;
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
\t});
\treturn replyPipeline;
}`;

function assertIncludes(value: string, marker: string): void {
  if (!value.includes(marker)) {
    throw new Error(`missing marker: ${marker}`);
  }
}

function assertNotIncludes(value: string, marker: string): void {
  if (value.includes(marker)) {
    throw new Error(`unexpected marker: ${marker}`);
  }
}

Deno.test("core run queue hotpatch adds skipped-run cleanup hook", () => {
  const result = patchChannelRunQueueOnSkipContent(
    OLD_CHANNEL_LIFECYCLE_BUNDLE,
  );
  if (result.status !== "patched") {
    throw new Error(`expected patched, got ${result.status}: ${result.detail}`);
  }
  const output = result.nextContent ?? "";
  assertIncludes(output, "enqueue(key, task, options)");
  assertIncludes(output, "await options?.onSkip?.();");
  assertIncludes(output, "await onSkip();");
});

Deno.test("core run queue hotpatch is idempotent", () => {
  const first = patchChannelRunQueueOnSkipContent(OLD_CHANNEL_LIFECYCLE_BUNDLE);
  if (first.status !== "patched" || !first.nextContent) {
    throw new Error(`expected first patch, got ${first.status}`);
  }
  const second = patchChannelRunQueueOnSkipContent(first.nextContent);
  if (second.status !== "already") {
    throw new Error(`expected already, got ${second.status}`);
  }
});

Deno.test("discord handler hotpatch carries accepted typing feedback into the queue", () => {
  const result = patchDiscordMessageHandlerTypingLifecycleContent(
    OLD_HANDLER_BUNDLE,
  );
  if (result.status !== "patched") {
    throw new Error(`expected patched, got ${result.status}: ${result.detail}`);
  }
  const output = result.nextContent ?? "";
  assertIncludes(output, "openclaw/plugin-sdk/channel-reply-pipeline");
  assertIncludes(output, "createPatchOcDiscordReplyTypingFeedback");
  assertIncludes(output, "replyTypingFeedback,");
  assertIncludes(output, "ctx.replyTypingFeedback = replyTypingFeedback;");
  assertIncludes(output, "if (!ctx.messageChannelId?.trim?.()) return false;");
  assertNotIncludes(
    output,
    "if (!ctx.isDirectMessage || ctx.isGuildMessage || ctx.isGroupDm) return false;",
  );
  assertIncludes(
    output,
    "cleanupSkippedDiscordQueuedMessage({ job, replayGuard })",
  );
});

Deno.test("discord handler hotpatch broadens older hotpatch from DMs to accepted channels", () => {
  const first = patchDiscordMessageHandlerTypingLifecycleContent(
    OLD_HANDLER_BUNDLE,
  );
  if (first.status !== "patched" || !first.nextContent) {
    throw new Error(`expected first patch, got ${first.status}`);
  }
  const olderHotpatchShape = first.nextContent.replace(
    "if (!ctx.messageChannelId?.trim?.()) return false;",
    "if (!ctx.isDirectMessage || ctx.isGuildMessage || ctx.isGroupDm) return false;",
  );
  const broadened = patchDiscordMessageHandlerTypingLifecycleContent(
    olderHotpatchShape,
  );
  if (broadened.status !== "patched" || !broadened.nextContent) {
    throw new Error(
      `expected scope broadening patch, got ${broadened.status}: ${broadened.detail}`,
    );
  }
  assertIncludes(
    broadened.nextContent,
    "if (!ctx.messageChannelId?.trim?.()) return false;",
  );
  assertNotIncludes(
    broadened.nextContent,
    "if (!ctx.isDirectMessage || ctx.isGuildMessage || ctx.isGroupDm) return false;",
  );
});

Deno.test("discord handler hotpatch is idempotent", () => {
  const first = patchDiscordMessageHandlerTypingLifecycleContent(
    OLD_HANDLER_BUNDLE,
  );
  if (first.status !== "patched" || !first.nextContent) {
    throw new Error(`expected first patch, got ${first.status}`);
  }
  const second = patchDiscordMessageHandlerTypingLifecycleContent(
    first.nextContent,
  );
  if (second.status !== "already") {
    throw new Error(`expected already, got ${second.status}`);
  }
});

Deno.test("discord process hotpatch reuses queued typing feedback", () => {
  const result = patchDiscordMessageProcessTypingLifecycleContent(
    OLD_PROCESS_BUNDLE,
  );
  if (result.status !== "patched") {
    throw new Error(`expected patched, got ${result.status}: ${result.detail}`);
  }
  const output = result.nextContent ?? "";
  assertIncludes(
    output,
    "async function processDiscordMessageInner(ctx, observer)",
  );
  assertIncludes(output, "ctx.replyTypingFeedback?.onCleanup?.();");
  assertIncludes(output, "replyTypingFeedback } = ctx;");
  assertIncludes(output, "const typingFeedback = replyTypingFeedback;");
  assertIncludes(output, "typingCallbacks: typingFeedback");
});

Deno.test("discord process hotpatch is idempotent", () => {
  const first = patchDiscordMessageProcessTypingLifecycleContent(
    OLD_PROCESS_BUNDLE,
  );
  if (first.status !== "patched" || !first.nextContent) {
    throw new Error(`expected first patch, got ${first.status}`);
  }
  const second = patchDiscordMessageProcessTypingLifecycleContent(
    first.nextContent,
  );
  if (second.status !== "already") {
    throw new Error(`expected already, got ${second.status}`);
  }
});
