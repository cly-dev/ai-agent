"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumePageActionFromApprovalSnapshot = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const page_workflow_orchestrator_1 = require("../page-action/page-workflow-orchestrator");
const page_action_run_steps_util_1 = require("../page-action/page-action-run-steps.util");
const load_workflow_definition_util_1 = require("../workflow/load-workflow-definition.util");
const page_action_host_tool_util_1 = require("../page-action/page-action-host-tool.util");
const page_action_prompt_util_1 = require("../page-action/page-action-prompt.util");
const host_tool_types_1 = require("../../modules/host-tool/host-tool.types");
async function resumePageActionFromApprovalSnapshot(input) {
    var _a, _b, _c;
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
    const pageContext = ((_a = run.pageContext) !== null && _a !== void 0 ? _a : null);
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
    });
    const loadResult = await (0, load_workflow_definition_util_1.loadWorkflowForRunDetailed)(input.prisma, {
        workflowId: snapshot.workflowRun.workflowId,
        appClientId: run.appClientId,
        workflowVersion: snapshot.workflowRun.version,
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
        allowedToolIds: snapshot.scopedToolIds,
        approvalGate: input.approvalGate,
        resumeFrom: {
            workflowRun: snapshot.workflowRun,
            nodeOutputs: snapshot.workflowNodeOutputs,
            pendingWrite: snapshot.pendingWrite,
            advancePastAwait: true,
        },
    });
    recorder.recordLifecycle(result.errorCode ? 'failed' : 'completed', {
        approvalRequestId: input.approvalRequestId,
        errorCode: (_b = result.errorCode) !== null && _b !== void 0 ? _b : null,
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
                errorMessage: (_c = result.errorMessage) !== null && _c !== void 0 ? _c : result.errorCode,
            }
            : {})),
    });
}
exports.resumePageActionFromApprovalSnapshot = resumePageActionFromApprovalSnapshot;
//# sourceMappingURL=page-action-approval-resume.util.js.map