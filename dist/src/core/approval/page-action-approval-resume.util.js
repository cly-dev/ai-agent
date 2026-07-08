"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryPageActionFromApprovalSnapshot = exports.resumePageActionFromApprovalSnapshot = void 0;
const common_1 = require("@nestjs/common");
const page_workflow_orchestrator_1 = require("../page-action/page-workflow-orchestrator");
const page_workflow_tool_bundle_util_1 = require("../page-action/page-workflow-tool-bundle.util");
const page_action_run_steps_util_1 = require("../page-action/page-action-run-steps.util");
const load_workflow_definition_util_1 = require("../workflow/load-workflow-definition.util");
const page_action_host_tool_util_1 = require("../page-action/page-action-host-tool.util");
const page_action_prompt_util_1 = require("../page-action/page-action-prompt.util");
const host_tool_types_1 = require("../../modules/host-tool/host-tool.types");
const page_action_sse_sink_util_1 = require("../page-action/stream/page-action-sse-sink.util");
const draft_review_1 = require("../draft-review");
const page_action_run_audit_util_1 = require("../page-action/page-action-run-audit.util");
const validate_approval_edited_pending_write_util_1 = require("./validate-approval-edited-pending-write.util");
const page_action_run_terminal_sse_util_1 = require("../page-action/page-action-run-terminal-sse.util");
async function resumePageActionFromApprovalSnapshot(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
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
    const draft = (0, draft_review_1.resolveWriteDraftFromApprovalSnapshot)(snapshot);
    const editsAlreadyApplied = draft.provenance.lastEvent === 'user_edit' &&
        ((_a = input.decision) === null || _a === void 0 ? void 0 : _a.action) === 'confirm_with_edits';
    const effectiveSnapshot = editsAlreadyApplied
        ? snapshot
        : await (0, validate_approval_edited_pending_write_util_1.resolveApprovalSnapshotForDecision)({
            snapshot,
            decision: (_b = input.decision) !== null && _b !== void 0 ? _b : null,
            userId: run.userId,
            prisma: input.prisma,
            toolEngine: input.toolEngine,
        });
    const pageContext = ((_c = run.pageContext) !== null && _c !== void 0 ? _c : null);
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
        edited: ((_d = input.decision) === null || _d === void 0 ? void 0 : _d.action) === 'confirm_with_edits',
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
    (_e = input.runEventBus) === null || _e === void 0 ? void 0 : _e.prepareSession(run.id);
    const sseSink = (_g = (_f = input.runEventBus) === null || _f === void 0 ? void 0 : _f.openWriter(run.id)) !== null && _g !== void 0 ? _g : (0, page_action_sse_sink_util_1.createNullPageActionSseSink)();
    const toolBundle = await (0, page_workflow_tool_bundle_util_1.loadPageWorkflowToolBundle)({
        prisma: input.prisma,
        toolEngine: input.toolEngine,
        userId: run.userId,
        appClientId: run.appClientId,
        allowedToolIds: effectiveSnapshot.scopedToolIds,
    });
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
        sseSink,
        stepRecorder: recorder,
        allowedToolIds: effectiveSnapshot.scopedToolIds,
        toolBundle,
        approvalGate: input.approvalGate,
        pageActionKey: run.pageActionKey,
        resumeFrom: {
            workflowRun: effectiveSnapshot.workflowRun,
            nodeOutputs: effectiveSnapshot.workflowNodeOutputs,
            pendingWrite: effectiveSnapshot.pendingWrite,
            advancePastAwait: true,
        },
    });
    const terminal = (0, page_action_run_terminal_sse_util_1.resolvePageActionRunTerminalOutcome)({
        suspended: result.suspended === true,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        fillText: result.fillText,
    });
    (0, page_action_run_terminal_sse_util_1.emitPageActionRunTerminalSse)({
        sseSink,
        recorder,
        actionRunId: run.id,
        actionKey: run.pageAction.actionKey,
        generation: run.generation,
        clientActionId: run.clientActionId,
        streamId: run.streamId,
        outcome: terminal,
        dslOutcome: result.dslOutcome,
    });
    (_h = input.runEventBus) === null || _h === void 0 ? void 0 : _h.closeSession(run.id);
    await input.prisma.pageActionRun.update({
        where: { id: run.id },
        data: {
            status: (0, page_action_run_terminal_sse_util_1.mapTerminalPhaseToRunStatus)(terminal.phase),
            workflowRun: result.workflowRun,
            fillText: terminal.fillText,
            dslOutcome: result.dslOutcome,
            model: result.model,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            finishedAt: terminal.phase === 'awaiting_approval' ? null : new Date(),
            steps: recorder.toJson(),
            errorCode: terminal.errorCode,
            errorMessage: terminal.errorMessage,
        },
    });
}
exports.resumePageActionFromApprovalSnapshot = resumePageActionFromApprovalSnapshot;
async function retryPageActionFromApprovalSnapshot(input) {
    var _a, _b, _c, _d, _e, _f, _g;
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
    const previousWriteDraft = (0, draft_review_1.resolveWriteDraftFromApprovalSnapshot)(snapshot);
    recorder.recordLifecycle('approval_retry_requested', {
        approvalRequestId: input.approvalRequestId,
        retryInstruction: input.retryInstruction,
        retryNodeId: rewind.retryNodeId,
        clearedOutputKeys: rewind.clearedOutputKeys,
        draftRetryCount: (_c = snapshot.draftRetryCount) !== null && _c !== void 0 ? _c : 0,
        previousWriteDraft: (0, page_action_run_audit_util_1.buildWriteDraftStepDetail)(previousWriteDraft),
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
    (_d = input.runEventBus) === null || _d === void 0 ? void 0 : _d.prepareSession(run.id);
    const sseSink = (_f = (_e = input.runEventBus) === null || _e === void 0 ? void 0 : _e.openWriter(run.id)) !== null && _f !== void 0 ? _f : (0, page_action_sse_sink_util_1.createNullPageActionSseSink)();
    const toolBundle = await (0, page_workflow_tool_bundle_util_1.loadPageWorkflowToolBundle)({
        prisma: input.prisma,
        toolEngine: input.toolEngine,
        userId: run.userId,
        appClientId: run.appClientId,
        allowedToolIds: retrySnapshot.scopedToolIds,
    });
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
        sseSink,
        stepRecorder: recorder,
        allowedToolIds: retrySnapshot.scopedToolIds,
        toolBundle,
        approvalGate: input.approvalGate,
        existingApprovalRequestId: input.approvalRequestId,
        retryInstruction: input.retryInstruction,
        pageActionKey: run.pageActionKey,
        resumeFrom: {
            workflowRun: retrySnapshot.workflowRun,
            nodeOutputs: retrySnapshot.workflowNodeOutputs,
            advancePastAwait: false,
        },
    });
    const terminal = (0, page_action_run_terminal_sse_util_1.resolvePageActionRunTerminalOutcome)({
        suspended: result.suspended === true,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        fillText: result.fillText,
    });
    (0, page_action_run_terminal_sse_util_1.emitPageActionRunTerminalSse)({
        sseSink,
        recorder,
        actionRunId: run.id,
        actionKey: run.pageAction.actionKey,
        generation: run.generation,
        clientActionId: run.clientActionId,
        streamId: run.streamId,
        outcome: terminal,
        dslOutcome: result.dslOutcome,
    });
    (_g = input.runEventBus) === null || _g === void 0 ? void 0 : _g.closeSession(run.id);
    await input.prisma.pageActionRun.update({
        where: { id: run.id },
        data: {
            status: (0, page_action_run_terminal_sse_util_1.mapTerminalPhaseToRunStatus)(terminal.phase),
            workflowRun: result.workflowRun,
            fillText: terminal.fillText,
            dslOutcome: result.dslOutcome,
            model: result.model,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            finishedAt: terminal.phase === 'awaiting_approval' ? null : new Date(),
            steps: recorder.toJson(),
            errorCode: terminal.errorCode,
            errorMessage: terminal.errorMessage,
        },
    });
    return result.suspended === true;
}
exports.retryPageActionFromApprovalSnapshot = retryPageActionFromApprovalSnapshot;
//# sourceMappingURL=page-action-approval-resume.util.js.map