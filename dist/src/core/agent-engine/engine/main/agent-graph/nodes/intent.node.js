"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIntentNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const intent_kind_util_1 = require("../../../../intent-kind.util");
const intent_scope_util_1 = require("../../../../../intent/intent-scope.util");
const smalltalk_hints_util_1 = require("../../../../../intent/smalltalk-hints.util");
const run_metrics_util_1 = require("../../../run-metrics.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const turn_scoped_tools_util_1 = require("../../../turn/turn-scoped-tools.util");
function createIntentNode(bundle) {
    const { deps, ctx, runHelpers } = bundle;
    const allowedToolsBundle = () => (0, turn_scoped_tools_util_1.bundleFromAllowedRunInput)({
        tools: ctx.input.tools,
        langChainTools: ctx.input.langChainTools,
        allowedToolIds: ctx.input.allowedToolIds,
    });
    const withIntentScopedTools = (state, bundle) => (Object.assign(Object.assign(Object.assign({}, state), { intentScopedToolsBundle: bundle }), (0, turn_scoped_tools_util_1.spreadScopedToolsBundle)(bundle)));
    return async (state) => {
        const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps);
        const skipRecognition = !ctx.input.enableToolCall || ctx.input.tools.length === 0;
        const intentKind = (0, intent_kind_util_1.detectIntentKind)(ctx.input.latestUserMessage, (0, smalltalk_hints_util_1.loadSmallTalkHints)());
        if (intentKind === 'smalltalk') {
            const intentStep = {
                step: stepNum,
                type: 'intent',
                output: runHelpers.normalizeJsonLike({
                    intentClear: true,
                    intentKind: 'smalltalk',
                    matchedCategoryIds: [],
                    intentMatched: false,
                    smalltalk: true,
                    deferToTurnRoute: true,
                    skipped: skipRecognition || undefined,
                }),
            };
            await runHelpers.updateRun(ctx.input.runId, [...state.steps, intentStep], client_1.AgentRunStatus.running);
            return withIntentScopedTools(Object.assign(Object.assign({}, state), { steps: [...state.steps, intentStep], intentKind: 'smalltalk' }), (0, turn_scoped_tools_util_1.emptyScopedToolsBundle)());
        }
        if (skipRecognition) {
            deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, '正在处理你的请求…\n', 'replace');
            const intentStep = {
                step: stepNum,
                type: 'intent',
                output: runHelpers.normalizeJsonLike({
                    skipped: true,
                    intentKind,
                    matchedCategoryIds: [],
                }),
            };
            await runHelpers.updateRun(ctx.input.runId, [...state.steps, intentStep], client_1.AgentRunStatus.running);
            return Object.assign(Object.assign({}, runHelpers.buildTurnRespondState(state, [...state.steps, intentStep], {
                kind: 'unsupported_scope',
                userMessage: ctx.input.latestUserMessage,
                payload: { readinessReason: 'tools_disabled' },
            })), { intentKind });
        }
        deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, '正在理解你的问题…\n', 'replace');
        const categoryIds = [
            ...new Set(ctx.input.tools
                .map((t) => t.toolCategoryId)
                .filter((id) => id != null)),
        ];
        const categories = await deps.sessionScope.fetchToolCategoriesForAllowedTools(categoryIds);
        const intentClear = (0, intent_scope_util_1.isUserIntentClear)(ctx.input.latestUserMessage);
        if (!intentClear) {
            const intentStep = {
                step: stepNum,
                type: 'intent',
                output: runHelpers.normalizeJsonLike({
                    intentClear: false,
                    recallSource: 'none',
                    matchedCategoryIds: [],
                }),
            };
            await runHelpers.updateRun(ctx.input.runId, [...state.steps, intentStep], client_1.AgentRunStatus.running);
            return runHelpers.buildTurnRespondState(state, [...state.steps, intentStep], {
                kind: 'message_unclear',
                userMessage: ctx.input.latestUserMessage,
            });
        }
        let recallResult;
        try {
            recallResult = await deps.categoryIntentRecall.recallTopCategories(categories, ctx.input.latestUserMessage);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            deps.logger.warn(`category intent recall failed: ${message}`);
            deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, '正在使用备用方式理解你的问题…\n', 'delta');
            const fallbackStep = {
                step: stepNum,
                type: 'intent',
                output: runHelpers.normalizeJsonLike({
                    error: message,
                    fallback: true,
                    fallbackReason: 'category_recall_error',
                }),
                meta: { code: 'INTENT_RECALL_FAILED' },
            };
            (0, run_metrics_util_1.recordMachineCodeUsage)(ctx.input.runMetrics, 'INTENT_RECALL_FAILED');
            fallbackStep.output = runHelpers.normalizeJsonLike({
                error: message,
                fallback: true,
                fallbackReason: 'category_recall_error',
                matchedCategoryIds: [],
            });
            await runHelpers.updateRun(ctx.input.runId, [...state.steps, fallbackStep], client_1.AgentRunStatus.running);
            return runHelpers.buildTurnRespondState(state, [...state.steps, fallbackStep], {
                kind: 'intent_recall_failed',
                userMessage: ctx.input.latestUserMessage,
            });
        }
        const validCategoryIdSet = new Set(categories.map((c) => c.id));
        const matchedCategoryIds = recallResult.matchedCategoryIds.filter((id) => validCategoryIdSet.has(id));
        const intentOutputBase = {
            intentClear: true,
            matchedCategoryIds,
            includeUncategorized: false,
            toolsBeforeIntentNarrow: ctx.input.tools.length,
            recallSource: recallResult.source,
            recallMatches: recallResult.matches.map((item) => ({
                id: item.id,
                label: item.label,
                score: Number(item.score.toFixed(4)),
                source: item.source,
            })),
        };
        if (matchedCategoryIds.length === 0) {
            const intentStep = {
                step: stepNum,
                type: 'intent',
                output: runHelpers.normalizeJsonLike(Object.assign(Object.assign({}, intentOutputBase), { intentMatched: false, deferToTurnRoute: true })),
            };
            await runHelpers.updateRun(ctx.input.runId, [...state.steps, intentStep], client_1.AgentRunStatus.running);
            return withIntentScopedTools(Object.assign(Object.assign({}, state), { steps: [...state.steps, intentStep], intentKind }), allowedToolsBundle());
        }
        const parsed = {
            intentClear: true,
            guidance: '',
            matchedCategoryIds,
            includeUncategorized: false,
        };
        const narrowed = deps.sessionScope.filterToolsByIntent(ctx.input.tools, parsed);
        if (narrowed.length === 0) {
            const intentStep = {
                step: stepNum,
                type: 'intent',
                output: runHelpers.normalizeJsonLike(Object.assign(Object.assign({}, intentOutputBase), { toolsAfterIntentNarrow: 0, intentMatched: false, deferToTurnRoute: true })),
            };
            await runHelpers.updateRun(ctx.input.runId, [...state.steps, intentStep], client_1.AgentRunStatus.running);
            return Object.assign(Object.assign({}, state), { steps: [...state.steps, intentStep], intentKind });
        }
        const scoped = await deps.sessionScope.resolveScopedToolsForIntent({
            sessionId: ctx.input.sessionId,
            userMessage: ctx.input.latestUserMessage,
            tools: narrowed,
            toolBuildCtx: ctx.input.toolBuildCtx,
            matchedCategoryIds,
        });
        const intentOutput = Object.assign(Object.assign({}, intentOutputBase), { intentMatched: true, toolsAfterIntentNarrow: narrowed.length, toolsAfterBindCap: scoped.scopedTools.length, scopeFromCache: scoped.fromCache });
        if (scoped.fallbackReason) {
            intentOutput.fallback = true;
            intentOutput.fallbackReason = scoped.fallbackReason;
        }
        if (scoped.bindCap) {
            intentOutput.bindToolsCap = scoped.bindCap;
        }
        const intentStep = {
            step: stepNum,
            type: 'intent',
            output: runHelpers.normalizeJsonLike(intentOutput),
        };
        await runHelpers.updateRun(ctx.input.runId, [...state.steps, intentStep], client_1.AgentRunStatus.running);
        return withIntentScopedTools(Object.assign(Object.assign({}, state), { steps: [...state.steps, intentStep], intentKind }), {
            scopedTools: scoped.scopedTools,
            scopedLangChainTools: scoped.scopedLangChainTools,
            scopedToolBundle: scoped.scopedToolBundle,
            scopedAllowedToolIds: scoped.scopedAllowedToolIds,
        });
    };
}
exports.createIntentNode = createIntentNode;
//# sourceMappingURL=intent.node.js.map