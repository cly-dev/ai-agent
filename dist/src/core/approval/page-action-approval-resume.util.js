"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryPageActionFromApprovalSnapshot = exports.resumePageActionFromApprovalSnapshot = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const page_workflow_orchestrator_1 = require("../page-action/page-workflow-orchestrator");
const page_action_run_steps_util_1 = require("../page-action/page-action-run-steps.util");
const load_workflow_definition_util_1 = require("../workflow/load-workflow-definition.util");
const page_action_host_tool_util_1 = require("../page-action/page-action-host-tool.util");
const page_action_prompt_util_1 = require("../page-action/page-action-prompt.util");
const host_tool_types_1 = require("../../modules/host-tool/host-tool.types");
const draft_review_1 = require("../draft-review");
const validate_approval_edited_pending_write_util_1 = require("./validate-approval-edited-pending-write.util");
async function resumePageActionFromApprovalSnapshot(input) {
    var _a, _b, _c, _d, _e;
    const { snapshot } = input;
    if (snapshot.channel.kind !== 'page_action') {
        return;
    }
    const run = await input.prisma.pageActionRun.findUnique({
        where: { id: snapshot.channel.pageActionRunId },
        include: {
            pageAction: {
                include: {
                    hostTool: { include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE },
                },
            },
        },
    });
    if (!(run === null || run === void 0 ? void 0 : run.pageAction)) {
        throw new common_1.NotFoundException('PageActionRun not found for resume');
    }
    const effectiveSnapshot = await (0, validate_approval_edited_pending_write_util_1.resolveApprovalSnapshotForDecision)({
        snapshot,
        decision: (_a = input.decision) !== null && _a !== void 0 ? _a : null,
        userId: run.userId,
        prisma: input.prisma,
        toolEngine: input.toolEngine,
    });
    const pageContext = ((_b = run.pageContext) !== null && _b !== void 0 ? _b : null);
    const hostTool = run.pageAction.hostTool
        ? (0, page_action_host_tool_util_1.resolvePageActionHostTool)(run.pageAction.hostTool, pageContext)
        : null;
    const messages = (0, page_action_prompt_util_1.buildPageActionLlmMessages)({
        systemPrompt: run.pageAction.systemPrompt,
        instruction: run.instruction,
        context: run.context,
        pageContext,
    });
    const recorder = page_action_run_steps_util_1.PageActionRunStepRecorder.fromJson(run.steps);
    recorder.recordLifecycle('approval_confirmed', {
        approvalRequestId: input.approvalRequestId,
        edited: ((_c = input.decision) === null || _c === void 0 ? void 0 : _c.action) === 'confirm_with_edits',
    });
    const loadResult = await (0, load_workflow_definition_util_1.loadWorkflowForRunDetailed)(input.prisma, {
        workflowId: effectiveSnapshot.workflowRun.workflowId,
        appClientId: run.appClientId,
        workflowVersion: effectiveSnapshot.workflowRun.version,
        workflowOverrides: (0, load_workflow_definition_util_1.parseWorkflowOverridesJson)(run.pageAction.workflowOverrides),
    });
    if (loadResult.status !== 'loaded') {
        throw new common_1.NotFoundException('Workflow not loadable for resume');
    }
    const noopRes = { write: () => undefined, end: () => undefined };
    const result = await (0, page_workflow_orchestrator_1.orchestratePageWorkflow)({
        workflowId: loadResult.workflowId,
        version: loadResult.version,
        nodes: loadResult.nodes,
        systemPrompt: run.pageAction.systemPrompt,
        objectivePrefix: run.instruction,
        messages,
        pageContext,
        hostTool,
        llmService: input.llmService,
        prisma: input.prisma,
        toolEngine: input.toolEngine,
        userId: run.userId,
        appClientId: run.appClientId,
        actionRunId: run.id,
        actionKey: run.pageAction.actionKey,
        generation: run.generation,
        clientActionId: run.clientActionId,
        res: noopRes,
        stepRecorder: recorder,
        allowedToolIds: effectiveSnapshot.scopedToolIds,
        approvalGate: input.approvalGate,
        resumeFrom: {
            workflowRun: effectiveSnapshot.workflowRun,
            nodeOutputs: effectiveSnapshot.workflowNodeOutputs,
            pendingWrite: effectiveSnapshot.pendingWrite,
            advancePastAwait: true,
        },
    });
    recorder.recordLifecycle(result.errorCode ? 'failed' : 'completed', {
        approvalRequestId: input.approvalRequestId,
        errorCode: (_d = result.errorCode) !== null && _d !== void 0 ? _d : null,
    }, result.errorCode ? 'failed' : 'ok');
    await input.prisma.pageActionRun.update({
        where: { id: run.id },
        data: Object.assign({ status: result.suspended
                ? client_1.PageActionRunStatus.awaiting_approval
                : result.errorCode
                    ? client_1.PageActionRunStatus.failed
                    : client_1.PageActionRunStatus.completed, workflowRun: result.workflowRun, fillText: result.fillText || null, dslOutcome: result.dslOutcome, model: result.model, promptTokens: result.promptTokens, completionTokens: result.completionTokens, finishedAt: result.suspended ? null : new Date(), steps: recorder.toJson() }, (result.errorCode
            ? {
                errorCode: result.errorCode,
                errorMessage: (_e = result.errorMessage) !== null && _e !== void 0 ? _e : result.errorCode,
            }
            : {})),
    });
}
exports.resumePageActionFromApprovalSnapshot = resumePageActionFromApprovalSnapshot;
async function retryPageActionFromApprovalSnapshot(input) {
    var _a, _b, _c;
    const { snapshot } = input;
    if (snapshot.channel.kind !== 'page_action') {
        return false;
    }
    const run = await input.prisma.pageActionRun.findUnique({
        where: { id: snapshot.channel.pageActionRunId },
        include: {
            pageAction: {
                include: {
                    hostTool: { include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE },
                },
            },
        },
    });
    if (!(run === null || run === void 0 ? void 0 : run.pageAction)) {
        throw new common_1.NotFoundException('PageActionRun not found for retry');
    }
    const rewind = (0, draft_review_1.rewindWorkflowForDraftRetry)({
        workflowRun: snapshot.workflowRun,
        workflowNodeDefs: snapshot.workflowNodeDefs,
        nodeOutputs: snapshot.workflowNodeOutputs,
    });
    const retrySnapshot = Object.assign(Object.assign({}, snapshot), { workflowRun: rewind.workflowRun, workflowNodeOutputs: (0, draft_review_1.stripNodeOutputsForRetry)(snapshot.workflowNodeOutputs, rewind.clearedOutputKeys), draftRetryCount: (_a = snapshot.draftRetryCount) !== null && _a !== void 0 ? _a : 0 });
    const pageContext = ((_b = run.pageContext) !== null && _b !== void 0 ? _b : null);
    const hostTool = run.pageAction.hostTool
        ? (0, page_action_host_tool_util_1.resolvePageActionHostTool)(run.pageAction.hostTool, pageContext)
        : null;
    const retryObjective = (0, draft_review_1.buildRetryUserMessage)({
        baseUserMessage: run.instruction,
        retryInstruction: input.retryInstruction,
    });
    const messages = (0, page_action_prompt_util_1.buildPageActionLlmMessages)({
        systemPrompt: run.pageAction.systemPrompt,
        instruction: retryObjective,
        context: run.context,
        pageContext,
    });
    const recorder = page_action_run_steps_util_1.PageActionRunStepRecorder.fromJson(run.steps);
    recorder.recordLifecycle('approval_retry_requested', {
        approvalRequestId: input.approvalRequestId,
        retryInstruction: input.retryInstruction,
        retryNodeId: rewind.retryNodeId,
    });
    const loadResult = await (0, load_workflow_definition_util_1.loadWorkflowForRunDetailed)(input.prisma, {
        workflowId: retrySnapshot.workflowRun.workflowId,
        appClientId: run.appClientId,
        workflowVersion: retrySnapshot.workflowRun.version,
        workflowOverrides: (0, load_workflow_definition_util_1.parseWorkflowOverridesJson)(run.pageAction.workflowOverrides),
    });
    if (loadResult.status !== 'loaded') {
        throw new common_1.NotFoundException('Workflow not loadable for retry');
    }
    const noopRes = { write: () => undefined, end: () => undefined };
    const result = await (0, page_workflow_orchestrator_1.orchestratePageWorkflow)({
        workflowId: loadResult.workflowId,
        version: loadResult.version,
        nodes: loadResult.nodes,
        systemPrompt: run.pageAction.systemPrompt,
        objectivePrefix: retryObjective,
        messages,
        pageContext,
        hostTool,
        llmService: input.llmService,
        prisma: input.prisma,
        toolEngine: input.toolEngine,
        userId: run.userId,
        appClientId: run.appClientId,
        actionRunId: run.id,
        actionKey: run.pageAction.actionKey,
        generation: run.generation,
        clientActionId: run.clientActionId,
        res: noopRes,
        stepRecorder: recorder,
        allowedToolIds: retrySnapshot.scopedToolIds,
        approvalGate: input.approvalGate,
        existingApprovalRequestId: input.approvalRequestId,
        retryInstruction: input.retryInstruction,
        resumeFrom: {
            workflowRun: retrySnapshot.workflowRun,
            nodeOutputs: retrySnapshot.workflowNodeOutputs,
            pendingWrite: retrySnapshot.pendingWrite,
            advancePastAwait: false,
        },
    });
    await input.prisma.pageActionRun.update({
        where: { id: run.id },
        data: Object.assign({ status: result.suspended
                ? client_1.PageActionRunStatus.awaiting_approval
                : result.errorCode
                    ? client_1.PageActionRunStatus.failed
                    : client_1.PageActionRunStatus.running, workflowRun: result.workflowRun, fillText: result.fillText || null, dslOutcome: result.dslOutcome, model: result.model, promptTokens: result.promptTokens, completionTokens: result.completionTokens, finishedAt: result.suspended || result.errorCode ? null : new Date(), steps: recorder.toJson() }, (result.errorCode
            ? {
                errorCode: result.errorCode,
                errorMessage: (_c = result.errorMessage) !== null && _c !== void 0 ? _c : result.errorCode,
            }
            : {})),
    });
    return result.suspended === true;
}
exports.retryPageActionFromApprovalSnapshot = retryPageActionFromApprovalSnapshot;
//# sourceMappingURL=page-action-approval-resume.util.js.map