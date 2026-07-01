"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentGraphHostToolHandleHelpers = exports.processHostToolAfterLlmDecision = exports.handleHostToolPreLlmSkip = exports.tryDispatchHostToolFromPlanDraft = exports.applyHostToolPlanStepHandle = void 0;
const host_bridge_1 = require("../../../../../host-bridge");
const host_tool_stream_observation_util_1 = require("../../../../../host-bridge/host-tool-stream-observation.util");
const host_tool_plan_util_1 = require("../../host-tool/host-tool-plan.util");
const host_tool_run_step_util_1 = require("../../host-tool/host-tool-run-step.util");
const host_tool_llm_util_1 = require("../../host-tool/host-tool-llm.util");
const plan_draft_reply_util_1 = require("../../plan-present/plan-draft-reply.util");
const plan_host_fill_util_1 = require("../../plan-present/plan-host-fill.util");
const turn_execution_contract_util_1 = require("../../../turn/turn-execution-contract.util");
const graph_tool_observations_util_1 = require("../../../graph-tool-observations.util");
function applyHostToolPlanStepHandle(deps, skillFrame, graphState, input, withPlanSyncStep) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (input.warnMessage) {
        deps.logger.warn(input.warnMessage);
    }
    if ((_b = (_a = input.handle.ssePayload) === null || _a === void 0 ? void 0 : _a.hostTools) === null || _b === void 0 ? void 0 : _b.length) {
        const payload = input.handle.ssePayload;
        (0, host_bridge_1.dispatchHostActionInstant)((sessionId, envelope) => deps.runSseGateway.emitHostAction(sessionId, input.runId, envelope.payload), input.sessionId, {
            pageContext: graphState.pageContext,
            runId: (_c = payload.runId) !== null && _c !== void 0 ? _c : input.runId,
            turnId: (_d = payload.turnId) !== null && _d !== void 0 ? _d : input.turnId,
            hostTools: payload.hostTools,
            planStepId: (_e = payload.planStepId) !== null && _e !== void 0 ? _e : input.planStepId,
            reason: payload.reason,
            generation: (_f = deps.runSseGateway.getBoundRunGeneration(input.sessionId, input.runId)) !== null && _f !== void 0 ? _f : undefined,
        });
    }
    const hostToolRunStep = (0, host_tool_run_step_util_1.buildHostToolRunStepFromPlanHandle)({
        existingSteps: input.steps,
        handle: input.handle,
        planStepId: input.planStepId,
        pageScope: (_h = (_g = graphState.pageContext) === null || _g === void 0 ? void 0 : _g.page) !== null && _h !== void 0 ? _h : null,
    });
    const stepsWithHostTool = [...input.steps, hostToolRunStep];
    let nextState = Object.assign(Object.assign({}, graphState), { iteration: input.nextIteration, steps: stepsWithHostTool, toolObservations: [
            ...graphState.toolObservations,
            ...input.handle.observations,
        ], taskPlan: input.handle.planAdvance.updatedPlan, pendingToolCalls: input.httpCalls, pendingRespond: null });
    nextState = withPlanSyncStep(nextState, input.handle.planAdvance, input.planStepId, 'llm');
    return nextState;
}
exports.applyHostToolPlanStepHandle = applyHostToolPlanStepHandle;
function tryDispatchHostToolFromPlanDraft(deps, runHelpers, hostToolHandle, skillFrame, decision, ctx, input) {
    var _a, _b;
    const { graphState, pendingHostStep, hostToolsForPrompt, observationsForLlm, llmStepNumber, nextIteration, steps, httpCalls = [], reason = 'plan_host_tool_from_draft', } = input;
    if (!graphState.taskPlan) {
        return null;
    }
    const contract = (0, turn_execution_contract_util_1.resolveTurnExecutionContract)(graphState, undefined, deps.logger);
    if (!contract.plan.allowHostToolAutoDispatch) {
        return null;
    }
    const hostCalls = (0, plan_host_fill_util_1.resolvePlanHostFillCalls)({
        taskPlan: graphState.taskPlan,
        observations: observationsForLlm,
        pendingHostStep,
        hostToolsForPrompt,
    });
    if (hostCalls.length === 0) {
        return null;
    }
    const postLlmOutcome = (0, host_tool_llm_util_1.evaluateHostToolPostLlm)({
        pendingHostStep,
        taskPlan: graphState.taskPlan,
        hostCalls,
        httpCalls,
        hasToolCalls: hostCalls.length > 0,
        scopedHostTools: (_a = graphState.scopedHostTools) !== null && _a !== void 0 ? _a : [],
        pageContext: graphState.pageContext,
    });
    if (postLlmOutcome.action !== 'dispatch') {
        return null;
    }
    const streamAlreadyDispatched = (0, host_tool_stream_observation_util_1.isHostToolStreamAlreadyDispatched)(observationsForLlm, postLlmOutcome.planStepId);
    const handled = (0, host_tool_llm_util_1.finalizeHostToolPlanStep)({
        taskPlan: graphState.taskPlan,
        planStepId: postLlmOutcome.planStepId,
        hostCalls,
        pageContext: graphState.pageContext,
        scopedHostTools: (_b = graphState.scopedHostTools) !== null && _b !== void 0 ? _b : [],
        runId: ctx.input.runId,
        turnId: ctx.input.turnId,
        streamReconciled: streamAlreadyDispatched,
    });
    if (!handled) {
        return null;
    }
    const draftStep = {
        step: llmStepNumber,
        type: 'llm',
        output: runHelpers.normalizeJsonLike({
            reason: streamAlreadyDispatched
                ? 'plan_host_tool_from_draft_stream_reconciled'
                : reason,
            toolCalls: hostCalls,
            taskPlanTrace: decision.buildTaskPlanTraceForLlmStep(graphState.taskPlan),
        }),
    };
    return hostToolHandle.applyHostToolPlanStepHandle(graphState, {
        handle: handled,
        planStepId: postLlmOutcome.planStepId,
        steps: [...steps, draftStep],
        nextIteration,
        httpCalls,
        sessionId: ctx.input.sessionId,
        runId: ctx.input.runId,
        turnId: ctx.input.turnId,
    }, skillFrame.withPlanSyncStep);
}
exports.tryDispatchHostToolFromPlanDraft = tryDispatchHostToolFromPlanDraft;
function hostToolPostLlmWarnMessage(input) {
    var _a, _b, _c, _d;
    if (input.action !== 'skip') {
        return undefined;
    }
    if (input.reason === 'no_host_tool_calls') {
        return `llm plan host_tool step skipped without toolCalls runId=${input.runId} step=${input.llmStepNumber} planStep=${input.planStepId}`;
    }
    if (input.reason === 'unexpected_http_tool_calls') {
        return `host_tool plan step skipped: unexpected HTTP tool calls runId=${input.runId} step=${input.llmStepNumber} planStep=${input.planStepId} httpTools=${(_b = (_a = input.httpCalls) === null || _a === void 0 ? void 0 : _a.map((call) => call.name).join(',')) !== null && _b !== void 0 ? _b : ''}`;
    }
    return `host_tool calls not dispatched runId=${input.runId} step=${input.llmStepNumber} planStep=${input.planStepId} reason=${input.reason} calls=${(_d = (_c = input.hostCalls) === null || _c === void 0 ? void 0 : _c.map((call) => call.name).join(',')) !== null && _d !== void 0 ? _d : ''}`;
}
function handleHostToolPreLlmSkip(deps, runHelpers, hostToolHandle, skillFrame, ctx, input) {
    var _a, _b, _c;
    const { graphState, pendingHostStep, hostToolsForPrompt, llmStepNumber, nextIteration } = input;
    if (!graphState.taskPlan) {
        return null;
    }
    const contract = (0, turn_execution_contract_util_1.resolveTurnExecutionContract)(graphState, undefined, deps.logger);
    if (pendingHostStep && !contract.plan.allowHostToolLlmDispatch) {
        const handled = (0, host_tool_llm_util_1.finalizeHostToolPlanStep)({
            taskPlan: graphState.taskPlan,
            planStepId: pendingHostStep.id,
            skipReason: 'turn_contract_host_tool_blocked',
            pageContext: graphState.pageContext,
            runId: ctx.input.runId,
            turnId: ctx.input.turnId,
        });
        if (!handled) {
            return null;
        }
        const skipStep = {
            step: llmStepNumber,
            type: 'llm',
            output: runHelpers.normalizeJsonLike({
                skipped: true,
                reason: 'turn_contract_host_tool_blocked',
                planStepId: pendingHostStep.id,
            }),
        };
        return hostToolHandle.applyHostToolPlanStepHandle(graphState, {
            handle: handled,
            planStepId: pendingHostStep.id,
            steps: [...graphState.steps, skipStep],
            nextIteration,
            httpCalls: [],
            sessionId: ctx.input.sessionId,
            runId: ctx.input.runId,
            turnId: ctx.input.turnId,
            warnMessage: `host_tool blocked by turn contract runId=${ctx.input.runId} planStep=${pendingHostStep.id}`,
        }, skillFrame.withPlanSyncStep);
    }
    const preLlmSkipReason = (0, host_tool_llm_util_1.evaluateHostToolPreLlmSkip)({
        pendingHostStep,
        taskPlan: graphState.taskPlan,
        hostToolsForPrompt,
        scopedHostTools: (_a = graphState.scopedHostTools) !== null && _a !== void 0 ? _a : [],
    });
    if (!preLlmSkipReason) {
        return null;
    }
    if (preLlmSkipReason === 'required_host_tool_missed') {
        const skipStep = {
            step: llmStepNumber,
            type: 'llm',
            output: runHelpers.normalizeJsonLike({
                reason: preLlmSkipReason,
                planStepId: pendingHostStep.id,
            }),
        };
        const hostToolStep = (0, host_tool_run_step_util_1.buildHostToolRequiredMissedStep)({
            existingSteps: [...graphState.steps, skipStep],
            planStepId: pendingHostStep.id,
            pageScope: (_c = (_b = graphState.pageContext) === null || _b === void 0 ? void 0 : _b.page) !== null && _c !== void 0 ? _c : null,
            skipReason: preLlmSkipReason,
        });
        return Object.assign(Object.assign({}, graphState), { iteration: nextIteration, steps: [...graphState.steps, skipStep, hostToolStep], toolObservations: [
                ...graphState.toolObservations,
                (0, host_tool_plan_util_1.buildHostToolSkippedObservation)({
                    planStepId: pendingHostStep.id,
                    reason: preLlmSkipReason,
                }),
            ], pendingToolCalls: [], pendingRespond: null });
    }
    const handled = (0, host_tool_llm_util_1.finalizeHostToolPlanStep)({
        taskPlan: graphState.taskPlan,
        planStepId: pendingHostStep.id,
        skipReason: preLlmSkipReason,
        pageContext: graphState.pageContext,
        runId: ctx.input.runId,
        turnId: ctx.input.turnId,
    });
    if (!handled) {
        return null;
    }
    const skipStep = {
        step: llmStepNumber,
        type: 'llm',
        output: runHelpers.normalizeJsonLike({
            skipped: true,
            reason: preLlmSkipReason,
            planStepId: pendingHostStep.id,
        }),
    };
    return hostToolHandle.applyHostToolPlanStepHandle(graphState, {
        handle: handled,
        planStepId: pendingHostStep.id,
        steps: [...graphState.steps, skipStep],
        nextIteration,
        httpCalls: [],
        sessionId: ctx.input.sessionId,
        runId: ctx.input.runId,
        turnId: ctx.input.turnId,
        warnMessage: `host_tool plan step skipped before llm runId=${ctx.input.runId} planStep=${pendingHostStep.id} reason=${preLlmSkipReason}`,
    }, skillFrame.withPlanSyncStep);
}
exports.handleHostToolPreLlmSkip = handleHostToolPreLlmSkip;
function processHostToolAfterLlmDecision(deps, hostToolHandle, skillFrame, ctx, input) {
    var _a, _b, _c, _d, _e;
    const { graphState, pendingHostStep, hostToolsForPrompt, observationsForLlm, llmStepNumber, nextIteration, steps, httpCalls, hostCalls: initialHostCalls, toolCallsFromLlm, } = input;
    let hostCalls = initialHostCalls;
    if (pendingHostStep && graphState.taskPlan) {
        const fromPlanHostFill = (0, plan_host_fill_util_1.resolvePlanHostFillCalls)({
            taskPlan: graphState.taskPlan,
            observations: observationsForLlm,
            pendingHostStep,
            hostToolsForPrompt,
        });
        if (fromPlanHostFill.length > 0) {
            hostCalls = fromPlanHostFill;
        }
    }
    const postLlmOutcome = (0, host_tool_llm_util_1.evaluateHostToolPostLlm)({
        pendingHostStep,
        taskPlan: graphState.taskPlan,
        hostCalls,
        httpCalls,
        hasToolCalls: toolCallsFromLlm.length > 0,
        scopedHostTools: (_a = graphState.scopedHostTools) !== null && _a !== void 0 ? _a : [],
        pageContext: graphState.pageContext,
    });
    if (postLlmOutcome.action === 'required_missed') {
        const hostToolStep = (0, host_tool_run_step_util_1.buildHostToolRequiredMissedStep)({
            existingSteps: steps,
            planStepId: postLlmOutcome.planStepId,
            pageScope: (_c = (_b = graphState.pageContext) === null || _b === void 0 ? void 0 : _b.page) !== null && _c !== void 0 ? _c : null,
            skipReason: postLlmOutcome.reason,
            hostCalls: postLlmOutcome.hostCalls,
        });
        return {
            kind: 'state',
            state: Object.assign(Object.assign({}, graphState), { iteration: nextIteration, steps: [...steps, hostToolStep], toolObservations: [
                    ...graphState.toolObservations,
                    (0, host_tool_plan_util_1.buildHostToolSkippedObservation)({
                        planStepId: postLlmOutcome.planStepId,
                        reason: postLlmOutcome.reason,
                        hostCalls: postLlmOutcome.hostCalls,
                        httpCalls: postLlmOutcome.httpCalls,
                    }),
                ], pendingToolCalls: httpCalls, pendingRespond: null }),
        };
    }
    if (postLlmOutcome.action === 'none' || !graphState.taskPlan) {
        return { kind: 'continue' };
    }
    const streamAlreadyDispatched = postLlmOutcome.action === 'dispatch'
        ? (0, host_tool_stream_observation_util_1.isHostToolStreamAlreadyDispatched)(observationsForLlm, postLlmOutcome.planStepId)
        : false;
    const handled = postLlmOutcome.action === 'dispatch'
        ? (0, host_tool_llm_util_1.finalizeHostToolPlanStep)({
            taskPlan: graphState.taskPlan,
            planStepId: postLlmOutcome.planStepId,
            hostCalls: postLlmOutcome.hostCalls,
            pageContext: graphState.pageContext,
            scopedHostTools: (_d = graphState.scopedHostTools) !== null && _d !== void 0 ? _d : [],
            runId: ctx.input.runId,
            turnId: ctx.input.turnId,
            streamReconciled: streamAlreadyDispatched,
        })
        : (0, host_tool_llm_util_1.finalizeHostToolPlanStep)({
            taskPlan: graphState.taskPlan,
            planStepId: postLlmOutcome.planStepId,
            skipReason: postLlmOutcome.reason,
            hostCalls: postLlmOutcome.hostCalls,
            httpCalls: postLlmOutcome.httpCalls,
            pageContext: graphState.pageContext,
            runId: ctx.input.runId,
            turnId: ctx.input.turnId,
        });
    if (!handled) {
        return { kind: 'continue' };
    }
    const stateAfterHost = hostToolHandle.applyHostToolPlanStepHandle(graphState, {
        handle: handled,
        planStepId: postLlmOutcome.planStepId,
        steps,
        nextIteration,
        httpCalls,
        sessionId: ctx.input.sessionId,
        runId: ctx.input.runId,
        turnId: ctx.input.turnId,
        warnMessage: postLlmOutcome.action === 'skip'
            ? hostToolPostLlmWarnMessage({
                action: 'skip',
                reason: postLlmOutcome.reason,
                runId: ctx.input.runId,
                llmStepNumber,
                planStepId: postLlmOutcome.planStepId,
                hostCalls: postLlmOutcome.hostCalls,
                httpCalls: postLlmOutcome.httpCalls,
            })
            : undefined,
    }, skillFrame.withPlanSyncStep);
    if (httpCalls.length === 0) {
        return { kind: 'state', state: stateAfterHost };
    }
    return {
        kind: 'state',
        state: Object.assign(Object.assign({}, stateAfterHost), { pendingToolCalls: (0, plan_draft_reply_util_1.applyPlanDraftToWriteToolCalls)(httpCalls, stateAfterHost.taskPlan, stateAfterHost.scopedTools, (0, plan_draft_reply_util_1.resolvePlanSubmitTextForWrite)({
                observations: (0, graph_tool_observations_util_1.allToolObservations)(stateAfterHost),
                artifactBlocks: (_e = deps.assistantArtifact.peekBlocks(ctx.input.sessionId, ctx.input.runId)) !== null && _e !== void 0 ? _e : null,
                scopedTools: stateAfterHost.scopedTools,
            })) }),
    };
}
exports.processHostToolAfterLlmDecision = processHostToolAfterLlmDecision;
function createAgentGraphHostToolHandleHelpers(deps, runHelpers, skillFrame, decision, ctx) {
    const apply = (graphState, handleInput, withPlanSyncStep) => applyHostToolPlanStepHandle(deps, skillFrame, graphState, handleInput, withPlanSyncStep);
    return {
        handleHostToolPreLlmSkip: (input) => handleHostToolPreLlmSkip(deps, runHelpers, { applyHostToolPlanStepHandle: apply }, skillFrame, ctx, input),
        processHostToolAfterLlmDecision: (input) => processHostToolAfterLlmDecision(deps, { applyHostToolPlanStepHandle: apply }, skillFrame, ctx, input),
        applyHostToolPlanStepHandle: apply,
        tryDispatchHostToolFromPlanDraft: (input) => tryDispatchHostToolFromPlanDraft(deps, runHelpers, { applyHostToolPlanStepHandle: apply }, skillFrame, decision, ctx, input),
    };
}
exports.createAgentGraphHostToolHandleHelpers = createAgentGraphHostToolHandleHelpers;
//# sourceMappingURL=host-tool.handle.js.map