"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var AgentRunSseEmitter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRunSseEmitter = void 0;
const common_1 = require("@nestjs/common");
const messages_1 = require("@langchain/core/messages");
const agent_run_sse_gateway_1 = require("../../../../session-run/agent-run-sse.gateway");
const message_blocks_util_1 = require("../../message/message-blocks.util");
const llm_service_1 = require("../../../../llm/llm.service");
const llm_prompt_debug_util_1 = require("../../llm-prompt-debug.util");
const llm_output_sanitize_util_1 = require("../../llm-output-sanitize.util");
const summarize_prose_stream_util_1 = require("../../summarize-prose-stream.util");
const run_assistant_artifact_store_1 = require("./run-assistant-artifact.store");
const message_blocks_debug_util_1 = require("../../message/message-blocks-debug.util");
const run_aborted_error_1 = require("../../../../session-run/run-aborted.error");
let AgentRunSseEmitter = AgentRunSseEmitter_1 = class AgentRunSseEmitter {
    constructor(runSse, llmService, assistantArtifact) {
        this.runSse = runSse;
        this.llmService = llmService;
        this.assistantArtifact = assistantArtifact;
        this.logger = new common_1.Logger(AgentRunSseEmitter_1.name);
        this.streamSeq = new Map();
        this.runProseDeltaEmitted = new Map();
        this.runAuthoritativeFullSerialized = new Map();
    }
    shouldEmitForRun(sessionId, runId) {
        if (runId == null) {
            return true;
        }
        return this.runSse.canPublishRun(sessionId, runId);
    }
    thinkBufferKey(sessionId, runId) {
        return `${sessionId}:${runId}`;
    }
    clearThinkBuffer(sessionId, runId) {
        const key = this.thinkBufferKey(sessionId, runId);
        this.streamSeq.delete(key);
        this.runProseDeltaEmitted.delete(key);
        this.runAuthoritativeFullSerialized.delete(key);
    }
    emitRunMessageBlocksIfNeeded(sessionId, runId, turnId) {
        var _a;
        const artifact = this.assistantArtifact.peek(sessionId, runId);
        if (!(artifact === null || artifact === void 0 ? void 0 : artifact.blocks.length)) {
            return;
        }
        const turnIdResolved = (_a = turnId !== null && turnId !== void 0 ? turnId : this.assistantArtifact.peekTurnId(sessionId, runId)) !== null && _a !== void 0 ? _a : undefined;
        this.emitAuthoritativeFullFromArtifact(sessionId, runId, {
            turnId: turnIdResolved,
            replayProseIfNeeded: true,
            debugOrigin: 'emitRunMessageBlocksIfNeeded',
        });
    }
    publishRuleBlocksOnly(sessionId, runId, blocks, turnId) {
        var _a;
        const sanitized = (0, message_blocks_util_1.sanitizeMessageBlocks)(blocks);
        if (sanitized.length === 0) {
            return [];
        }
        const turnIdResolved = (_a = turnId !== null && turnId !== void 0 ? turnId : this.assistantArtifact.peekTurnId(sessionId, runId)) !== null && _a !== void 0 ? _a : undefined;
        const { placeholders, patches } = (0, message_blocks_util_1.planStructuredBlockStreaming)(runId, sanitized);
        for (const placeholder of placeholders) {
            this.emitMessageBlocks(sessionId, runId, [placeholder], {
                action: 'stream',
                mode: 'full',
                turnId: turnIdResolved,
            });
        }
        for (const patch of patches) {
            this.emitBlockPatch(sessionId, runId, patch);
        }
        return this.publishAssistantBlocks(sessionId, runId, sanitized, {
            turnId: turnIdResolved,
        });
    }
    emitThink(sessionId, runId, chunk, mode = 'delta') {
        this.runSse.emitThink(sessionId, runId, { content: chunk, mode });
    }
    emitMessageBlocks(sessionId, runId, blocks, options) {
        var _a, _b, _c, _d;
        const action = (_a = options === null || options === void 0 ? void 0 : options.action) !== null && _a !== void 0 ? _a : 'stream';
        const mode = (_b = options === null || options === void 0 ? void 0 : options.mode) !== null && _b !== void 0 ? _b : 'full';
        if (runId != null && !this.shouldEmitForRun(sessionId, runId)) {
            return;
        }
        const normalized = mode === 'full'
            ? (0, message_blocks_util_1.sanitizeMessageBlocks)(blocks)
            : (0, message_blocks_util_1.normalizeMessageBlocks)(blocks);
        if (normalized.length === 0) {
            return;
        }
        const key = runId == null ? null : this.thinkBufferKey(sessionId, runId);
        const nextSeq = key ? ((_c = this.streamSeq.get(key)) !== null && _c !== void 0 ? _c : 0) + 1 : undefined;
        if (key && nextSeq != null) {
            this.streamSeq.set(key, nextSeq);
        }
        if (key && mode === 'delta') {
            this.runProseDeltaEmitted.set(key, true);
        }
        const payload = {
            source: 'agent-run',
            action,
            runId,
            turnId: options === null || options === void 0 ? void 0 : options.turnId,
            blocks: normalized,
            code: options === null || options === void 0 ? void 0 : options.code,
            seq: nextSeq,
            mode,
        };
        this.runSse.emitAgentRunMessage(sessionId, runId, payload);
        if (runId != null) {
            const artifact = this.assistantArtifact.peek(sessionId, runId);
            (0, message_blocks_debug_util_1.emitAgentMessageSseDebug)({
                tag: `emitMessageBlocks:${action}:${mode}`,
                sessionId,
                runId,
                turnId: options === null || options === void 0 ? void 0 : options.turnId,
                ssePayload: payload,
                source: Object.assign(Object.assign({}, ((_d = options === null || options === void 0 ? void 0 : options.debugSource) !== null && _d !== void 0 ? _d : {})), { inputBlocks: blocks, normalizedBlocks: normalized, storageSerialized: mode === 'full'
                        ? (0, message_blocks_util_1.serializeMessageBlocksForStorage)(normalized)
                        : undefined, artifactSlot: artifact
                        ? {
                            phase: artifact.phase,
                            blocks: artifact.blocks,
                            serialized: artifact.serialized,
                        }
                        : null }),
            });
        }
    }
    emitBlockPatch(sessionId, runId, patch) {
        var _a;
        if (!this.shouldEmitForRun(sessionId, runId)) {
            return;
        }
        const block = (0, message_blocks_util_1.normalizeMessageBlocks)([patch.block])[0];
        if (!block || block.type === 'loading') {
            return;
        }
        const key = this.thinkBufferKey(sessionId, runId);
        const nextSeq = ((_a = this.streamSeq.get(key)) !== null && _a !== void 0 ? _a : 0) + 1;
        this.streamSeq.set(key, nextSeq);
        const payload = {
            source: 'agent-run',
            action: 'patch',
            runId,
            patches: [{ replaceId: patch.replaceId, block }],
            seq: nextSeq,
        };
        this.runSse.emitAgentRunMessage(sessionId, runId, payload);
        (0, message_blocks_debug_util_1.emitAgentMessageSseDebug)({
            tag: 'emitBlockPatch',
            sessionId,
            runId,
            ssePayload: payload,
            source: {
                inputPatch: patch,
                normalizedBlock: block,
            },
        });
    }
    async streamRunnableMessages(runnable, messages, sessionId, runId, abortSignal) {
        var _a, e_1, _b, _c;
        const signal = abortSignal !== null && abortSignal !== void 0 ? abortSignal : this.runSse.getRunAbortSignal(sessionId, runId);
        let merged;
        let streamedText = '';
        try {
            if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
                this.throwRunAborted(sessionId, runId);
            }
            const stream = await runnable.stream(messages);
            try {
                for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = await stream_1.next(), _a = stream_1_1.done, !_a;) {
                    _c = stream_1_1.value;
                    _d = false;
                    try {
                        const chunk = _c;
                        if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
                            this.throwRunAborted(sessionId, runId);
                        }
                        const row = chunk;
                        const delta = this.extractAiMessageText(row);
                        if (delta) {
                            streamedText += delta;
                            this.emitThink(sessionId, runId, delta, 'delta');
                        }
                        merged = merged ? merged.concat(row) : row;
                    }
                    finally {
                        _d = true;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = stream_1.return)) await _b.call(stream_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        catch (error) {
            if ((0, run_aborted_error_1.isAgentRunAbortedError)(error)) {
                throw error;
            }
            if ((signal === null || signal === void 0 ? void 0 : signal.aborted) || (error instanceof DOMException && error.name === 'AbortError')) {
                this.throwRunAborted(sessionId, runId);
            }
            this.logger.warn(`llm stream fallback to invoke sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
            const aiMessage = await runnable.invoke(messages);
            const text = this.extractAiMessageText(aiMessage).trim();
            if (text) {
                this.emitThink(sessionId, runId, text, 'delta');
            }
            return aiMessage;
        }
        if (merged) {
            const aiMessage = new messages_1.AIMessage({
                content: merged.content,
                tool_calls: merged.tool_calls,
                additional_kwargs: merged.additional_kwargs,
                response_metadata: merged.response_metadata,
            });
            const text = this.extractAiMessageText(aiMessage).trim();
            if (text && !streamedText) {
                this.emitThink(sessionId, runId, text, 'delta');
            }
            return aiMessage;
        }
        if (streamedText) {
            return new messages_1.AIMessage({ content: streamedText });
        }
        return new messages_1.AIMessage({ content: '' });
    }
    async summarizeMessageBlocks(messages, sessionId, runId, ruleBlocks, fallbackPlainText, _delivery, publishMode) {
        return this.streamSummarizeProseOnly(messages, sessionId, runId, ruleBlocks, fallbackPlainText, publishMode);
    }
    commitAssistantArtifact(sessionId, runId, blocks, phase = 'final') {
        var _a;
        const committed = this.assistantArtifact.commit(sessionId, runId, blocks, phase);
        return (_a = committed === null || committed === void 0 ? void 0 : committed.blocks) !== null && _a !== void 0 ? _a : [];
    }
    replayStaticProseBeforeFull(sessionId, runId, prose, turnId) {
        const trimmed = prose.trim();
        if (!trimmed) {
            return;
        }
        const proseSession = (0, summarize_prose_stream_util_1.createSummarizeProseStreamSession)({
            onProseDelta: (delta) => {
                this.emitMessageBlocks(sessionId, runId, [(0, message_blocks_util_1.textBlock)(delta)], {
                    action: 'stream',
                    mode: 'delta',
                    turnId,
                });
            },
        });
        proseSession.replayRoutedMessage(trimmed);
    }
    emitRuleBlockPlaceholders(runId, sessionId, ruleBlocks, turnId) {
        const { placeholders, patches } = (0, message_blocks_util_1.planStructuredBlockStreaming)(runId, ruleBlocks);
        for (const placeholder of placeholders) {
            this.emitMessageBlocks(sessionId, runId, [placeholder], {
                action: 'stream',
                mode: 'full',
                turnId,
            });
        }
        return patches;
    }
    finishSummarizeBlocks(sessionId, runId, ruleBlocks, llmBlocks, fallbackPlainText, patches, rawOutput, publishMode, turnId) {
        var _a;
        for (const patch of patches) {
            this.emitBlockPatch(sessionId, runId, patch);
        }
        const sanitizedMerged = (0, message_blocks_util_1.sanitizeMessageBlocks)((0, message_blocks_util_1.mergeSummarizeBlocksForStorage)(ruleBlocks, llmBlocks, fallbackPlainText));
        const artifactPhase = (_a = publishMode === null || publishMode === void 0 ? void 0 : publishMode.artifactPhase) !== null && _a !== void 0 ? _a : 'final';
        const emitAuthoritativeFull = (publishMode === null || publishMode === void 0 ? void 0 : publishMode.emitAuthoritativeFull) !== false;
        if (!emitAuthoritativeFull) {
            this.commitAssistantArtifact(sessionId, runId, sanitizedMerged, artifactPhase);
            return { blocks: sanitizedMerged, rawOutput };
        }
        const blocks = this.publishAssistantBlocks(sessionId, runId, sanitizedMerged, {
            turnId,
            phase: artifactPhase,
        });
        return { blocks, rawOutput };
    }
    emitAuthoritativeFullFromArtifact(sessionId, runId, options) {
        var _a, _b, _c;
        const artifact = this.assistantArtifact.peek(sessionId, runId);
        if (!(artifact === null || artifact === void 0 ? void 0 : artifact.blocks.length)) {
            return [];
        }
        const streamKey = this.thinkBufferKey(sessionId, runId);
        if (this.runAuthoritativeFullSerialized.get(streamKey) === artifact.serialized) {
            return artifact.blocks;
        }
        const turnId = (_b = (_a = options.turnId) !== null && _a !== void 0 ? _a : this.assistantArtifact.peekTurnId(sessionId, runId)) !== null && _b !== void 0 ? _b : undefined;
        if (options.replayProseIfNeeded) {
            const hadProseDelta = (_c = this.runProseDeltaEmitted.get(streamKey)) !== null && _c !== void 0 ? _c : false;
            if (!hadProseDelta) {
                this.replayStaticProseBeforeFull(sessionId, runId, (0, message_blocks_util_1.extractStreamableProseFromBlocks)(artifact.blocks), turnId);
            }
        }
        this.emitMessageBlocks(sessionId, runId, artifact.blocks, {
            action: 'stream',
            mode: 'full',
            turnId,
            code: options.code,
            debugSource: {
                origin: options.debugOrigin,
                artifactSerialized: artifact.serialized,
                artifactPhase: artifact.phase,
            },
        });
        this.runAuthoritativeFullSerialized.set(streamKey, artifact.serialized);
        return artifact.blocks;
    }
    async streamProseLlm(messages, sessionId, runId, options) {
        var _a, _b, _c, _d, _e, _f, _g;
        const turnId = (_b = (_a = options === null || options === void 0 ? void 0 : options.turnId) !== null && _a !== void 0 ? _a : this.assistantArtifact.peekTurnId(sessionId, runId)) !== null && _b !== void 0 ? _b : undefined;
        const boundGeneration = this.runSse.getBoundRunGeneration(sessionId, runId);
        if (boundGeneration != null) {
            this.runSse.throwIfAborted(sessionId, runId, boundGeneration);
        }
        const proseSession = (0, summarize_prose_stream_util_1.createSummarizeProseStreamSession)({
            onProseDelta: (delta) => {
                if (!this.shouldEmitForRun(sessionId, runId)) {
                    return;
                }
                this.emitMessageBlocks(sessionId, runId, [(0, message_blocks_util_1.textBlock)(delta)], {
                    mode: 'delta',
                    action: 'stream',
                    turnId,
                });
            },
            onThinkDelta: (think) => {
                if (!this.shouldEmitForRun(sessionId, runId)) {
                    return;
                }
                this.emitThink(sessionId, runId, think, 'delta');
            },
        });
        (_c = options === null || options === void 0 ? void 0 : options.beforeStream) === null || _c === void 0 ? void 0 : _c.call(options);
        const abortSignal = (_d = options === null || options === void 0 ? void 0 : options.abortSignal) !== null && _d !== void 0 ? _d : this.runSse.getRunAbortSignal(sessionId, runId);
        let streamed = '';
        try {
            const result = await this.llmService.streamChat({
                messages,
                tools: [],
                signal: abortSignal,
                messageTokenBudget: options === null || options === void 0 ? void 0 : options.messageTokenBudget,
                budgetHints: {
                    callKind: 'summarize',
                    sessionId,
                    runId,
                    phase: 'summarize',
                },
            }, {
                signal: abortSignal,
                onDelta: (delta) => {
                    if (!this.shouldEmitForRun(sessionId, runId)) {
                        return;
                    }
                    if (!delta.contentDelta) {
                        return;
                    }
                    streamed += delta.contentDelta;
                    proseSession.ingestLlmDelta(delta.contentDelta);
                },
            });
            const rawStreamedText = streamed.trim();
            const rawResultText = ((_e = result.content) !== null && _e !== void 0 ? _e : '').trim();
            const finalized = (0, summarize_prose_stream_util_1.finalizeSummarizeProseStreamAfterLlm)({
                session: proseSession,
                rawStreamedText,
                rawResultText,
                onReplay: (reason) => {
                    this.logger.warn(`prose stream replay reason=${reason} runId=${runId} model=${result.model}`);
                },
            });
            if (!rawStreamedText && rawResultText && !proseSession.messageDeltaEmitted) {
                this.logger.warn(`prose stream no delta runId=${runId} model=${result.model} emittedDeltaCount=${(_g = (_f = result.streamMeta) === null || _f === void 0 ? void 0 : _f.emittedDeltaCount) !== null && _g !== void 0 ? _g : 0}`);
            }
            return Object.assign(Object.assign({}, finalized), { proseSession, model: result.model, turnId });
        }
        catch (error) {
            if ((0, run_aborted_error_1.isAgentRunAbortedError)(error)) {
                throw error;
            }
            if ((abortSignal === null || abortSignal === void 0 ? void 0 : abortSignal.aborted) ||
                (error instanceof DOMException && error.name === 'AbortError')) {
                this.throwRunAborted(sessionId, runId);
            }
            throw error;
        }
    }
    async streamSummarizeProseOnly(messages, sessionId, runId, ruleBlocks, fallbackPlainText, publishMode) {
        var _a;
        const turnId = (_a = this.assistantArtifact.peekTurnId(sessionId, runId)) !== null && _a !== void 0 ? _a : undefined;
        const summarizeDebugFile = (0, llm_prompt_debug_util_1.emitLlmPromptDebug)((message) => this.logger.log(message), {
            runId,
            sessionId,
            phase: 'summarize',
            messages,
            meta: { ruleBlockCount: ruleBlocks.length, delivery: 'prose_stream' },
        });
        if (summarizeDebugFile) {
            this.logger.log(`LLM summarize stream file runId=${runId} path=${summarizeDebugFile}`);
        }
        const patches = this.emitRuleBlockPlaceholders(runId, sessionId, ruleBlocks, turnId);
        const { routedMessage, rawLlmSource, userMarkdown, proseSession } = await this.streamProseLlm(messages, sessionId, runId, { turnId });
        const rawSource = (routedMessage || rawLlmSource || '').trim();
        let llmBlocksForStorage = [];
        if (rawSource && (0, message_blocks_util_1.looksLikeBlocksJsonOutput)(rawSource)) {
            const disobeyed = (0, message_blocks_util_1.tryParseLlmBlocksFromSummarizeOutput)(rawSource);
            if (disobeyed === null || disobeyed === void 0 ? void 0 : disobeyed.length) {
                this.logger.warn(`summarize prose_stream: model returned blocks JSON instead of markdown runId=${runId}`);
                llmBlocksForStorage = (0, message_blocks_util_1.sanitizeMessageBlocks)((0, message_blocks_util_1.filterLlmBlocksAvoidDuplicatingRule)(ruleBlocks, disobeyed));
            }
            else {
                this.logger.warn(`summarize prose_stream: unparseable blocks JSON discarded runId=${runId}`);
                const coerced = (0, message_blocks_util_1.messageBlocksToPlainText)((0, message_blocks_util_1.mergeSummarizeBlocksForStorage)(ruleBlocks, [], fallbackPlainText));
                if (coerced.trim()) {
                    llmBlocksForStorage = (0, message_blocks_util_1.filterLlmBlocksAvoidDuplicatingRule)(ruleBlocks, [
                        (0, message_blocks_util_1.textBlock)(coerced, 'markdown'),
                    ]);
                }
            }
        }
        else {
            let proseForStorage = '';
            if (proseSession.messageDeltaEmitted &&
                proseSession.sanitizedEmitted.trim()) {
                proseForStorage = (0, message_blocks_util_1.sanitizeSummarizeUserFacingProse)(proseSession.sanitizedEmitted).trim();
            }
            if (!proseForStorage) {
                proseForStorage = (0, message_blocks_util_1.sanitizeSummarizeUserFacingProse)((0, llm_output_sanitize_util_1.sanitizeLlmFinalOutput)(userMarkdown || routedMessage || rawLlmSource || fallbackPlainText)).trim();
            }
            if (proseForStorage) {
                llmBlocksForStorage = (0, message_blocks_util_1.filterLlmBlocksAvoidDuplicatingRule)(ruleBlocks, [
                    (0, message_blocks_util_1.textBlock)(proseForStorage, 'markdown'),
                ]);
            }
            if (proseSession.proseStreamSuperseded) {
                this.logger.warn(`summarize prose stream superseded by blocks JSON runId=${runId}`);
            }
        }
        if (proseSession.messageDeltaEmitted &&
            proseSession.sanitizedEmitted.trim()) {
            llmBlocksForStorage = (0, message_blocks_util_1.mergeStreamedDeltaTextForStorage)(ruleBlocks, llmBlocksForStorage, proseSession.sanitizedEmitted);
        }
        return this.finishSummarizeBlocks(sessionId, runId, ruleBlocks, llmBlocksForStorage, fallbackPlainText, patches, routedMessage || rawLlmSource, publishMode, turnId);
    }
    publishAssistantBlocks(sessionId, runId, blocks, options) {
        var _a;
        if (!this.shouldEmitForRun(sessionId, runId)) {
            return [];
        }
        const sanitized = (0, message_blocks_util_1.sanitizeMessageBlocks)(blocks);
        if (sanitized.length === 0) {
            return [];
        }
        if ((options === null || options === void 0 ? void 0 : options.commitArtifact) !== false) {
            this.assistantArtifact.commit(sessionId, runId, sanitized, (_a = options === null || options === void 0 ? void 0 : options.phase) !== null && _a !== void 0 ? _a : 'final');
        }
        return this.emitAuthoritativeFullFromArtifact(sessionId, runId, {
            turnId: options === null || options === void 0 ? void 0 : options.turnId,
            code: options === null || options === void 0 ? void 0 : options.code,
            replayProseIfNeeded: true,
            debugOrigin: 'publishAssistantBlocks',
        });
    }
    throwRunAborted(sessionId, runId) {
        const bound = this.runSse.getBoundRunGeneration(sessionId, runId);
        if (bound != null) {
            this.runSse.throwIfAborted(sessionId, runId, bound);
        }
        throw new run_aborted_error_1.AgentRunAbortedError(sessionId, runId, 'superseded');
    }
    extractAiMessageText(message) {
        if (typeof message.content === 'string') {
            return message.content;
        }
        if (Array.isArray(message.content)) {
            return message.content
                .map((item) => {
                var _a;
                return item && typeof item === 'object' && 'text' in item
                    ? String((_a = item.text) !== null && _a !== void 0 ? _a : '')
                    : '';
            })
                .join('');
        }
        return '';
    }
};
AgentRunSseEmitter = AgentRunSseEmitter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [agent_run_sse_gateway_1.AgentRunSseGateway,
        llm_service_1.LlmService,
        run_assistant_artifact_store_1.RunAssistantArtifactStore])
], AgentRunSseEmitter);
exports.AgentRunSseEmitter = AgentRunSseEmitter;
//# sourceMappingURL=agent-run-sse.emitter.js.map