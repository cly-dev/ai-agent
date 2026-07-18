"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryPageActionFromApprovalSnapshot = exports.resumePageActionFromApprovalSnapshot = void 0;
const common_1 = require("@nestjs/common");
const page_workflow_orchestrator_1 = require("../page-action/page-workflow-orchestrator");
const page_workflow_tool_bundle_util_1 = require("../page-action/page-workflow-tool-bundle.util");
const page_action_run_steps_util_1 = require("../page-action/page-action-run-steps.util");
const approval_resume_snapshot_types_1 = require("./approval-resume-snapshot.types");
const load_workflow_definition_util_1 = require("../workflow/load-workflow-definition.util");
const load_flow_for_run_util_1 = require("../workflow/load-flow-for-run.util");
const page_action_host_tool_util_1 = require("../page-action/page-action-host-tool.util");
const page_action_prompt_util_1 = require("../page-action/page-action-prompt.util");
const host_tool_types_1 = require("../../modules/host-tool/host-tool.types");
const page_action_sse_sink_util_1 = require("../page-action/stream/page-action-sse-sink.util");
const draft_review_1 = require("../draft-review");
const page_action_run_audit_util_1 = require("../page-action/page-action-run-audit.util");
const validate_approval_edited_pending_write_util_1 = require("./validate-approval-edited-pending-write.util");
const page_action_run_terminal_sse_util_1 = require("../page-action/page-action-run-terminal-sse.util");
const resolve_page_action_run_output_text_util_1 = require("../page-action/resolve-page-action-run-output-text.util");
async function resumePageActionFromApprovalSnapshot(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
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
    const approvalRow = await input.prisma.approvalRequest.findUnique({
        where: { id: input.approvalRequestId },
        select: { flowId: true, flowVersion: true },
    });
    const resumeFlowId = (_h = (_g = (_f = (_e = ((0, approval_resume_snapshot_types_1.isApprovalResumeSnapshotV2)(effectiveSnapshot)
        ? effectiveSnapshot.flow.id
        : null)) !== null && _e !== void 0 ? _e : run.flowId) !== null && _f !== void 0 ? _f : approvalRow === null || approvalRow === void 0 ? void 0 : approvalRow.flowId) !== null && _g !== void 0 ? _g : run.pageAction.flowId) !== null && _h !== void 0 ? _h : (effectiveSnapshot.workflowRun.compiledFrom === 'flow_db'
        ? effectiveSnapshot.workflowRun.workflowId
        : null);
    const resumeFlowVersion = (_m = (_l = (_k = (_j = ((0, approval_resume_snapshot_types_1.isApprovalResumeSnapshotV2)(effectiveSnapshot)
        ? effectiveSnapshot.flow.version
        : null)) !== null && _j !== void 0 ? _j : run.flowVersion) !== null && _k !== void 0 ? _k : approvalRow === null || approvalRow === void 0 ? void 0 : approvalRow.flowVersion) !== null && _l !== void 0 ? _l : run.pageAction.flowVersion) !== null && _m !== void 0 ? _m : (resumeFlowId != null ? effectiveSnapshot.workflowRun.version : null);
    if (resumeFlowId == null || resumeFlowId <= 0) {
        throw new common_1.NotFoundException('Flow required for approval resume; legacy Workflow path removed');
    }
    const loadResult = await (0, load_flow_for_run_util_1.loadFlowForRunDetailed)(input.prisma, {
        flowId: resumeFlowId,
        appClientId: run.appClientId,
        flowVersion: resumeFlowVersion !== null && resumeFlowVersion !== void 0 ? resumeFlowVersion : effectiveSnapshot.workflowRun.version,
        workflowOverrides: (0, load_workflow_definition_util_1.parseWorkflowOverridesJson)(run.pageAction.workflowOverrides),
    });
    if (loadResult.status !== 'loaded') {
        throw new common_1.NotFoundException('Flow not loadable for resume');
    }
    (_o = input.runEventBus) === null || _o === void 0 ? void 0 : _o.prepareSession(run.id);
    const sseSink = (_q = (_p = input.runEventBus) === null || _p === void 0 ? void 0 : _p.openWriter(run.id)) !== null && _q !== void 0 ? _q : (0, page_action_sse_sink_util_1.createNullPageActionSseSink)();
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
        flowId: resumeFlowId,
        flowVersion: resumeFlowVersion !== null && resumeFlowVersion !== void 0 ? resumeFlowVersion : loadResult.version,
        nodes: loadResult.nodes,
        edges: loadResult.edges,
        entryNodeId: loadResult.entryNodeId,
        ir: loadResult.ir,
        executionMode: loadResult.executionMode,
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
    const terminal = (0, page_action_run_terminal_sse_util_1.resolvePageActionRunTerminalOutcome)(result.completion);
    const persistedFillText = (0, resolve_page_action_run_output_text_util_1.resolvePageActionRunOutputText)({
        fillText: terminal.fillText,
        errorMessage: terminal.errorMessage,
        steps: recorder.toJson(),
    });
    const terminalOutcome = Object.assign(Object.assign({}, terminal), { fillText: persistedFillText });
    (0, page_action_run_terminal_sse_util_1.emitPageActionRunTerminalSse)({
        sseSink,
        recorder,
        actionRunId: run.id,
        actionKey: run.pageAction.actionKey,
        generation: run.generation,
        clientActionId: run.clientActionId,
        streamId: run.streamId,
        outcome: terminalOutcome,
        dslOutcome: result.dslOutcome,
    });
    (_r = input.runEventBus) === null || _r === void 0 ? void 0 : _r.closeSession(run.id);
    await input.prisma.pageActionRun.update({
        where: { id: run.id },
        data: {
            status: (0, page_action_run_terminal_sse_util_1.mapTerminalPhaseToRunStatus)(terminalOutcome.phase),
            workflowRun: result.workflowRun,
            fillText: persistedFillText,
            dslOutcome: result.dslOutcome,
            model: result.model,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            finishedAt: terminalOutcome.phase === 'awaiting_approval' ? null : new Date(),
            steps: recorder.toJson(),
            errorCode: terminalOutcome.errorCode,
            errorMessage: terminalOutcome.errorMessage,
        },
    });
}
exports.resumePageActionFromApprovalSnapshot = resumePageActionFromApprovalSnapshot;
async function retryPageActionFromApprovalSnapshot(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
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
    const pageContext = ((_a = run.pageContext) !== null && _a !== void 0 ? _a : null);
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
    const approvalRow = await input.prisma.approvalRequest.findUnique({
        where: { id: input.approvalRequestId },
        select: { flowId: true, flowVersion: true },
    });
    const retryFlowId = (_e = (_d = (_c = (_b = ((0, approval_resume_snapshot_types_1.isApprovalResumeSnapshotV2)(snapshot) ? snapshot.flow.id : null)) !== null && _b !== void 0 ? _b : run.flowId) !== null && _c !== void 0 ? _c : approvalRow === null || approvalRow === void 0 ? void 0 : approvalRow.flowId) !== null && _d !== void 0 ? _d : run.pageAction.flowId) !== null && _e !== void 0 ? _e : (snapshot.workflowRun.compiledFrom === 'flow_db'
        ? snapshot.workflowRun.workflowId
        : null);
    const retryFlowVersion = (_j = (_h = (_g = (_f = ((0, approval_resume_snapshot_types_1.isApprovalResumeSnapshotV2)(snapshot) ? snapshot.flow.version : null)) !== null && _f !== void 0 ? _f : run.flowVersion) !== null && _g !== void 0 ? _g : approvalRow === null || approvalRow === void 0 ? void 0 : approvalRow.flowVersion) !== null && _h !== void 0 ? _h : run.pageAction.flowVersion) !== null && _j !== void 0 ? _j : (retryFlowId != null ? snapshot.workflowRun.version : null);
    if (retryFlowId == null || retryFlowId <= 0) {
        throw new common_1.NotFoundException('Flow required for approval retry; legacy Workflow path removed');
    }
    const loadResult = await (0, load_flow_for_run_util_1.loadFlowForRunDetailed)(input.prisma, {
        flowId: retryFlowId,
        appClientId: run.appClientId,
        flowVersion: retryFlowVersion !== null && retryFlowVersion !== void 0 ? retryFlowVersion : snapshot.workflowRun.version,
        workflowOverrides: (0, load_workflow_definition_util_1.parseWorkflowOverridesJson)(run.pageAction.workflowOverrides),
    });
    if (loadResult.status !== 'loaded') {
        throw new common_1.NotFoundException('Flow not loadable for retry');
    }
    const rewind = (0, draft_review_1.rewindWorkflowForDraftRetry)({
        workflowRun: snapshot.workflowRun,
        workflowNodeDefs: (0, approval_resume_snapshot_types_1.resolveApprovalResumeNodeDefs)(snapshot, loadResult.nodes),
        nodeOutputs: snapshot.workflowNodeOutputs,
        ir: loadResult.ir,
    });
    const retrySnapshot = Object.assign(Object.assign(Object.assign({}, snapshot), { workflowRun: rewind.workflowRun, workflowNodeOutputs: (0, draft_review_1.stripNodeOutputsForRetry)(snapshot.workflowNodeOutputs, rewind.clearedOutputKeys), draftRetryCount: (_k = snapshot.draftRetryCount) !== null && _k !== void 0 ? _k : 0 }), ((0, approval_resume_snapshot_types_1.isApprovalResumeSnapshotV2)(snapshot) && rewind.retryNodeId
        ? {
            suspended: Object.assign(Object.assign({}, snapshot.suspended), { irNodeId: rewind.retryNodeId, phase: (_m = (_l = rewind.workflowRun.nodes.find((n) => n.nodeId === rewind.retryNodeId)) === null || _l === void 0 ? void 0 : _l.phase) !== null && _m !== void 0 ? _m : snapshot.suspended.phase }),
        }
        : {}));
    const recorder = page_action_run_steps_util_1.PageActionRunStepRecorder.fromJson(run.steps);
    const previousWriteDraft = (0, draft_review_1.resolveWriteDraftFromApprovalSnapshot)(snapshot);
    recorder.recordLifecycle('approval_retry_requested', {
        approvalRequestId: input.approvalRequestId,
        retryInstruction: input.retryInstruction,
        retryNodeId: rewind.retryNodeId,
        clearedOutputKeys: rewind.clearedOutputKeys,
        draftRetryCount: (_o = snapshot.draftRetryCount) !== null && _o !== void 0 ? _o : 0,
        previousWriteDraft: (0, page_action_run_audit_util_1.buildWriteDraftStepDetail)(previousWriteDraft),
    });
    (_p = input.runEventBus) === null || _p === void 0 ? void 0 : _p.prepareSession(run.id);
    const sseSink = (_r = (_q = input.runEventBus) === null || _q === void 0 ? void 0 : _q.openWriter(run.id)) !== null && _r !== void 0 ? _r : (0, page_action_sse_sink_util_1.createNullPageActionSseSink)();
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
        flowId: retryFlowId,
        flowVersion: retryFlowVersion !== null && retryFlowVersion !== void 0 ? retryFlowVersion : loadResult.version,
        nodes: loadResult.nodes,
        edges: loadResult.edges,
        entryNodeId: loadResult.entryNodeId,
        ir: loadResult.ir,
        executionMode: loadResult.executionMode,
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
    const terminal = (0, page_action_run_terminal_sse_util_1.resolvePageActionRunTerminalOutcome)(result.completion);
    const persistedFillText = (0, resolve_page_action_run_output_text_util_1.resolvePageActionRunOutputText)({
        fillText: terminal.fillText,
        errorMessage: terminal.errorMessage,
        steps: recorder.toJson(),
    });
    const terminalOutcome = Object.assign(Object.assign({}, terminal), { fillText: persistedFillText });
    (0, page_action_run_terminal_sse_util_1.emitPageActionRunTerminalSse)({
        sseSink,
        recorder,
        actionRunId: run.id,
        actionKey: run.pageAction.actionKey,
        generation: run.generation,
        clientActionId: run.clientActionId,
        streamId: run.streamId,
        outcome: terminalOutcome,
        dslOutcome: result.dslOutcome,
    });
    (_s = input.runEventBus) === null || _s === void 0 ? void 0 : _s.closeSession(run.id);
    await input.prisma.pageActionRun.update({
        where: { id: run.id },
        data: {
            status: (0, page_action_run_terminal_sse_util_1.mapTerminalPhaseToRunStatus)(terminalOutcome.phase),
            workflowRun: result.workflowRun,
            fillText: persistedFillText,
            dslOutcome: result.dslOutcome,
            model: result.model,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            finishedAt: terminalOutcome.phase === 'awaiting_approval' ? null : new Date(),
            steps: recorder.toJson(),
            errorCode: terminalOutcome.errorCode,
            errorMessage: terminalOutcome.errorMessage,
        },
    });
    return result.suspended === true;
}
exports.retryPageActionFromApprovalSnapshot = retryPageActionFromApprovalSnapshot;
//# sourceMappingURL=page-action-approval-resume.util.js.map