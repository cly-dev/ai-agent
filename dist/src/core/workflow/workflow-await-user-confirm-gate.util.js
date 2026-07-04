"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyWorkflowAwaitUserConfirmGate = void 0;
const client_1 = require("../../../generated/prisma/client");
const agent_write_confirmation_util_1 = require("../agent-engine/engine/agent-write-confirmation.util");
const message_blocks_debug_util_1 = require("../agent-engine/engine/message/message-blocks-debug.util");
const mutation_preview_before_gate_util_1 = require("../agent-engine/engine/mutation-preview-before-gate.util");
const write_confirmation_gate_util_1 = require("../agent-engine/engine/write-confirmation-gate.util");
const agent_run_steps_util_1 = require("../agent-engine/engine/main/run/agent-run-steps.util");
const graph_tool_observations_util_1 = require("../agent-engine/engine/graph-tool-observations.util");
const workflow_debug_util_1 = require("./trace/workflow-debug.util");
const draft_review_1 = require("../draft-review");
async function applyWorkflowAwaitUserConfirmGate(bundle, state, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const { deps, ctx, runHelpers } = bundle;
    const observations = (0, graph_tool_observations_util_1.allToolObservations)(state);
    const previewReady = (0, mutation_preview_before_gate_util_1.hasUserVisibleMutationPreview)({
        artifact: deps.assistantArtifact.peek(ctx.input.sessionId, ctx.input.runId),
        observations,
    });
    if (!previewReady) {
        deps.logger.warn(`workflow await_user_confirm blocked: no preview runId=${ctx.input.runId} nodeId=${input.nodeId}`);
        runHelpers.publishMutationGateBlockedDraft(ctx.input.sessionId, ctx.input.runId, ctx.input.turnId, (0, mutation_preview_before_gate_util_1.buildMutationPreviewUnavailableUserMessage)());
        return Object.assign(Object.assign({}, state), { steps: input.steps, workflowRun: input.workflowRun, taskPlan: input.taskPlan, pendingToolCalls: [] });
    }
    const message = (0, write_confirmation_gate_util_1.buildWriteConfirmationUserMessage)();
    const confirmedPreviewSerialized = deps.assistantArtifact.peekSerialized(ctx.input.sessionId, ctx.input.runId);
    const draftRetryCount = (0, draft_review_1.resolveDraftRetryCountAfterRegeneration)({
        previousCount: state.draftRetryCount,
        regeneratedFromRetry: ctx.input.resumeFromWriteGateRetry === true,
    });
    const draftRetryBudget = (0, draft_review_1.resolveDraftRetryBudget)(draftRetryCount);
    const existingPending = await deps.pendingWriteConfirmationStore.get(ctx.input.sessionId, ctx.input.userId);
    if (existingPending && existingPending.runId !== ctx.input.runId) {
        deps.runSseGateway.purgeWriteConfirmationGate(ctx.input.sessionId, existingPending.runId);
    }
    const resumeContext = {
        steps: input.steps,
        iteration: state.iteration,
        toolObservations: (0, agent_write_confirmation_util_1.serializeObservationsForPending)(observations),
        scopedToolIds: state.scopedTools.map((tool) => tool.id),
        intentKind: state.intentKind,
        hasExpandedOnce: state.hasExpandedOnce,
        skillApplied: state.skillApplied === true,
        activeSkillId: (_a = state.activeSkillId) !== null && _a !== void 0 ? _a : null,
        activeSkillPrompt: (_b = state.activeSkillPrompt) !== null && _b !== void 0 ? _b : null,
        activeSkillName: (_c = state.activeSkillName) !== null && _c !== void 0 ? _c : null,
        activeSkillDescription: (_d = state.activeSkillDescription) !== null && _d !== void 0 ? _d : null,
        activeSkillConfig: (_e = state.activeSkillConfig) !== null && _e !== void 0 ? _e : null,
        activeSkillRiskLevel: (_f = state.activeSkillRiskLevel) !== null && _f !== void 0 ? _f : null,
        taskPlan: input.taskPlan,
        pagedListHttpUsed: state.pagedListHttpUsed,
        confirmedPreviewSerialized,
        pageContext: (_g = state.pageContext) !== null && _g !== void 0 ? _g : null,
        workflowRun: input.workflowRun,
        workflowNodeDefs: state.workflowNodeDefs,
        workflowNodeOutputs: state.workflowNodeOutputs,
        workflowAwaitingReact: false,
        draftRetryCount,
    };
    const serializedObservations = (0, agent_write_confirmation_util_1.serializeObservationsForPending)(observations);
    const writeDraft = (0, draft_review_1.resolveWriteDraftFromChatGate)({
        toolCalls: [],
        observations: serializedObservations,
        confirmedPreviewSerialized,
        draftRetryCount,
    });
    const toolCallsForGate = (0, draft_review_1.syncChatGateToolCallsFromWriteDraft)({
        toolCalls: [],
        writeDraft,
    });
    const writeDraftList = (0, draft_review_1.buildWriteDraftListFromChatGate)({
        toolCalls: [],
        writeDraft,
        observations: serializedObservations,
        confirmedPreviewSerialized,
        draftRetryCount,
    });
    const primaryWriteDraft = (_h = writeDraftList[0]) !== null && _h !== void 0 ? _h : writeDraft;
    const publicDraftList = writeDraftList.map((draft) => (0, draft_review_1.toWriteDraftPublic)(draft));
    await deps.pendingWriteConfirmationStore.set({
        runId: ctx.input.runId,
        turnId: ctx.input.turnId,
        sessionId: ctx.input.sessionId,
        userId: ctx.input.userId,
        appClientId: ctx.input.appClientId,
        agentId: ctx.input.agentId,
        latestUserMessage: ctx.input.latestUserMessage,
        toolCalls: toolCallsForGate,
        writeDraft: primaryWriteDraft,
        writeDrafts: writeDraftList.length > 1 ? writeDraftList : undefined,
        resumeContext,
        createdAt: new Date().toISOString(),
    });
    (0, workflow_debug_util_1.logWorkflowDebug)('workflow_await_user_confirm_gate', {
        runId: ctx.input.runId,
        sessionId: ctx.input.sessionId,
        turnId: ctx.input.turnId,
        nodeId: input.nodeId,
        workflowRun: input.workflowRun,
    });
    const confirmationPayload = {
        source: 'agent-run',
        action: 'confirmation_required',
        runId: ctx.input.runId,
        turnId: ctx.input.turnId,
        message,
    };
    const published = deps.runSseGateway.emitConfirmationRequired(ctx.input.sessionId, {
        runId: ctx.input.runId,
        turnId: ctx.input.turnId,
        message,
        draftRetryCount: draftRetryBudget.used,
        draftRetryMax: draftRetryBudget.max,
        canRetry: draftRetryBudget.canRetry,
        writeDraft: publicDraftList[0],
        writeDrafts: publicDraftList.length > 1 ? publicDraftList : undefined,
    });
    (0, message_blocks_debug_util_1.emitAgentMessageSseDebug)({
        tag: published ? 'confirmation_required' : 'confirmation_required_suppressed',
        sessionId: ctx.input.sessionId,
        runId: ctx.input.runId,
        turnId: ctx.input.turnId,
        ssePayload: confirmationPayload,
        source: published
            ? { confirmedPreviewSerialized }
            : { reason: 'run_not_publishable' },
    });
    const gateStep = {
        step: (0, agent_run_steps_util_1.nextRunStepNumber)(input.steps),
        type: 'write_confirmation_gate',
        output: runHelpers.normalizeJsonLike({
            status: 'awaiting_user',
            source: 'workflow_await_user_confirm',
            nodeId: input.nodeId,
            pendingToolCallCount: toolCallsForGate.length,
        }),
    };
    const nextSteps = [...input.steps, gateStep];
    await runHelpers.updateRun(ctx.input.runId, nextSteps, client_1.AgentRunStatus.success);
    return Object.assign(Object.assign({}, state), { steps: nextSteps, workflowRun: input.workflowRun, taskPlan: input.taskPlan, pendingToolCalls: [], draftRetryCount, awaitingWriteConfirmation: true, finalOutput: (_j = deps.assistantArtifact.peekSerialized(ctx.input.sessionId, ctx.input.runId)) !== null && _j !== void 0 ? _j : '', status: client_1.AgentRunStatus.success, finished: true });
}
exports.applyWorkflowAwaitUserConfirmGate = applyWorkflowAwaitUserConfirmGate;
//# sourceMappingURL=workflow-await-user-confirm-gate.util.js.map