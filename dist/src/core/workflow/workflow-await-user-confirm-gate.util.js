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
const mirror_chat_approval_util_1 = require("../approval/mirror-chat-approval.util");
const chat_approval_run_audit_util_1 = require("../approval/chat-approval-run-audit.util");
const workflow_debug_util_1 = require("./trace/workflow-debug.util");
async function applyWorkflowAwaitUserConfirmGate(bundle, state, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
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
    };
    await deps.pendingWriteConfirmationStore.set({
        runId: ctx.input.runId,
        turnId: ctx.input.turnId,
        sessionId: ctx.input.sessionId,
        userId: ctx.input.userId,
        appClientId: ctx.input.appClientId,
        agentId: ctx.input.agentId,
        latestUserMessage: ctx.input.latestUserMessage,
        toolCalls: [],
        resumeContext,
        createdAt: new Date().toISOString(),
    });
    let approvalRequestId = null;
    try {
        approvalRequestId = await (0, mirror_chat_approval_util_1.mirrorChatApprovalRequest)({
            approvalGate: deps.approvalGate,
            approvalRequests: deps.approvalRequests,
            appClientId: ctx.input.appClientId,
            userId: ctx.input.userId,
            sessionId: ctx.input.sessionId,
            runId: ctx.input.runId,
            turnId: ctx.input.turnId,
            nodeId: input.nodeId,
            workflowRun: input.workflowRun,
            workflowNodeDefs: (_h = state.workflowNodeDefs) !== null && _h !== void 0 ? _h : [],
            workflowNodeOutputs: (_j = state.workflowNodeOutputs) !== null && _j !== void 0 ? _j : {},
            observations,
            scopedTools: state.scopedTools,
            pageContext: (_k = state.pageContext) !== null && _k !== void 0 ? _k : null,
            resumeContext,
        });
    }
    catch (error) {
        deps.logger.warn(`chat approval mirror failed runId=${ctx.input.runId} nodeId=${input.nodeId}: ${error instanceof Error ? error.message : String(error)}`);
    }
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
    const gateOutputBase = runHelpers.normalizeJsonLike({
        status: 'awaiting_user',
        source: 'workflow_await_user_confirm',
        nodeId: input.nodeId,
        pendingToolCallCount: 0,
    });
    const gateStep = {
        step: (0, agent_run_steps_util_1.nextRunStepNumber)(input.steps),
        type: 'write_confirmation_gate',
        output: approvalRequestId != null
            ? (0, chat_approval_run_audit_util_1.enrichChatApprovalAwaitingGateOutput)(gateOutputBase, {
                approvalRequestId,
                nodeId: input.nodeId,
            })
            : gateOutputBase,
    };
    const nextSteps = [...input.steps, gateStep];
    await runHelpers.updateRun(ctx.input.runId, nextSteps, client_1.AgentRunStatus.success);
    return Object.assign(Object.assign({}, state), { steps: nextSteps, workflowRun: input.workflowRun, taskPlan: input.taskPlan, pendingToolCalls: [], awaitingWriteConfirmation: true, finalOutput: (_l = deps.assistantArtifact.peekSerialized(ctx.input.sessionId, ctx.input.runId)) !== null && _l !== void 0 ? _l : '', status: client_1.AgentRunStatus.success, finished: true });
}
exports.applyWorkflowAwaitUserConfirmGate = applyWorkflowAwaitUserConfirmGate;
//# sourceMappingURL=workflow-await-user-confirm-gate.util.js.map