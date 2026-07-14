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
var PageActionRunExecutor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageActionRunExecutor = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../../generated/prisma/client");
const approval_gate_service_1 = require("../../approval/approval-gate.service");
const approval_trigger_permission_service_1 = require("../../approval/approval-trigger-permission.service");
const resolve_approval_parties_util_1 = require("../../approval/resolve-approval-parties.util");
const load_workflow_definition_util_1 = require("../../workflow/load-workflow-definition.util");
const tool_engine_service_1 = require("../../tool-engine/tool-engine.service");
const llm_service_1 = require("../../llm/llm.service");
const prisma_service_1 = require("../../../prisma/prisma.service");
const page_action_host_fill_executor_1 = require("../page-action-host-fill.executor");
const page_workflow_summarize_util_1 = require("../page-workflow-summarize.util");
const page_workflow_orchestrator_1 = require("../page-workflow-orchestrator");
const page_action_workflow_load_util_1 = require("../page-action-workflow-load.util");
const page_action_inline_sse_util_1 = require("../page-action-inline-sse.util");
const page_action_run_completion_util_1 = require("../page-action-run-completion.util");
const page_action_run_terminal_sse_util_1 = require("../page-action-run-terminal-sse.util");
const page_action_run_steps_util_1 = require("../page-action-run-steps.util");
const page_action_prompt_util_1 = require("../page-action-prompt.util");
const page_action_constants_1 = require("../page-action.constants");
const page_workflow_tool_bundle_util_1 = require("../page-workflow-tool-bundle.util");
const page_action_summarize_host_tool_util_1 = require("../page-action-summarize-host-tool.util");
const resolve_page_action_run_output_text_util_1 = require("../resolve-page-action-run-output-text.util");
const page_action_run_stream_hub_1 = require("../stream/page-action-run-stream.hub");
const page_action_run_debug_util_1 = require("../page-action-run-debug.util");
let PageActionRunExecutor = PageActionRunExecutor_1 = class PageActionRunExecutor {
    constructor(prisma, llmService, toolEngine, approvalGate, triggerPermission, runStreamHub) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.toolEngine = toolEngine;
        this.approvalGate = approvalGate;
        this.triggerPermission = triggerPermission;
        this.runStreamHub = runStreamHub;
        this.logger = new common_1.Logger(PageActionRunExecutor_1.name);
    }
    executeInBackground(input) {
        void this.execute(input).catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`page action run ${input.runId} failed: ${message}`, error instanceof Error ? error.stack : undefined);
        });
    }
    async execute(input) {
        var _a, _b, _c;
        const sseSink = this.runStreamHub.openWriter(input.runId);
        const startedAt = Date.now();
        const stepRecorder = new page_action_run_steps_util_1.PageActionRunStepRecorder();
        const streamId = (0, page_action_constants_1.buildPageActionStreamId)({
            actionRunId: input.runId,
            actionKey: input.actionKey,
        });
        const lifecycleBase = {
            actionRunId: input.runId,
            actionKey: input.actionKey,
            delivery: client_1.PageActionDelivery.inline_stream,
            generation: input.generation,
            clientActionId: input.clientActionId,
            streamId,
        };
        const emitInitialStarted = Boolean(input.workflowId) || !input.hostToolResolved;
        if (emitInitialStarted) {
            (0, page_action_inline_sse_util_1.writePageActionLifecycle)(sseSink, Object.assign({ phase: 'started' }, lifecycleBase), stepRecorder);
        }
        const messages = (0, page_action_prompt_util_1.buildPageActionLlmMessages)({
            systemPrompt: input.systemPrompt,
            instruction: input.instruction,
            context: (_a = input.context) !== null && _a !== void 0 ? _a : null,
            pageContext: input.pageContext,
        });
        (0, page_action_run_debug_util_1.logPageActionRunDebug)('invoke', {
            actionRunId: input.runId,
            actionKey: input.actionKey,
            generation: input.generation,
            workflowId: input.workflowId,
            hostTool: input.hostToolResolved
                ? {
                    id: input.hostToolResolved.definition.id,
                    name: input.hostToolResolved.definition.name,
                    delivery: input.hostToolResolved.delivery,
                    produceMode: input.hostToolResolved.produceMode,
                    argsSchema: input.hostToolResolved.definition.argsSchema,
                }
                : null,
            instruction: input.instruction,
            pageContext: input.pageContext,
            context: (_b = input.context) !== null && _b !== void 0 ? _b : null,
            systemPromptLength: input.systemPrompt.length,
        });
        (0, page_action_run_debug_util_1.logPageActionLlmPrompt)({
            actionRunId: input.runId,
            actionKey: input.actionKey,
            phase: 'initial_messages',
            messages,
            meta: {
                hasWorkflow: Boolean(input.workflowId),
                hasHostTool: Boolean(input.hostToolResolved),
            },
        });
        try {
            if (input.workflowId) {
                await this.executeWorkflow({
                    input,
                    messages,
                    sseSink,
                    stepRecorder,
                    startedAt,
                    lifecycleBase,
                });
                return;
            }
            if (input.hostToolResolved) {
                const result = await (0, page_action_host_fill_executor_1.executePageActionHostFill)(this.llmService, {
                    actionRunId: input.runId,
                    actionKey: input.actionKey,
                    generation: input.generation,
                    clientActionId: input.clientActionId,
                    systemPrompt: input.systemPrompt,
                    messages,
                    pageContext: input.pageContext,
                    actionContext: (_c = input.context) !== null && _c !== void 0 ? _c : null,
                    hostTool: input.hostToolResolved,
                    sseSink,
                    stepRecorder,
                });
                const completion = (0, page_action_run_completion_util_1.completionFromHostFill)({
                    fillText: result.fillText,
                    dslOutcome: result.dslOutcome,
                });
                const terminal = (0, page_action_run_terminal_sse_util_1.resolvePageActionRunTerminalOutcome)(completion);
                await this.prisma.pageActionRun.update({
                    where: { id: input.runId },
                    data: {
                        status: (0, page_action_run_terminal_sse_util_1.mapTerminalPhaseToRunStatus)(terminal.phase),
                        fillText: terminal.fillText,
                        dslOutcome: result.dslOutcome,
                        streamId: result.streamId,
                        model: result.model,
                        promptTokens: result.promptTokens,
                        completionTokens: result.completionTokens,
                        durationMs: Date.now() - startedAt,
                        finishedAt: new Date(),
                        steps: result.steps,
                        errorCode: terminal.errorCode,
                        errorMessage: terminal.errorMessage,
                    },
                });
                (0, page_action_run_debug_util_1.logPageActionRunDebug)('result', {
                    actionRunId: input.runId,
                    actionKey: input.actionKey,
                    path: 'host_fill',
                    terminalPhase: terminal.phase,
                    dslOutcome: result.dslOutcome,
                    streamId: result.streamId,
                    model: result.model,
                    promptTokens: result.promptTokens,
                    completionTokens: result.completionTokens,
                    llmCallCount: result.llmCallCount,
                    appendCount: result.appendCount,
                    fillText: result.fillText,
                    errorCode: terminal.errorCode,
                    errorMessage: terminal.errorMessage,
                    durationMs: Date.now() - startedAt,
                    steps: result.steps,
                });
                return;
            }
            const summarizeHostTool = await (0, page_action_summarize_host_tool_util_1.resolvePageActionSummarizeHostTool)(this.prisma, {
                appClientId: input.appClientId,
                pageContext: input.pageContext,
                fallbackHostTool: input.hostToolResolved,
            });
            const summary = await (0, page_workflow_summarize_util_1.executePageWorkflowSummarize)({
                llmService: this.llmService,
                messages,
                nodeInput: { mode: 'final' },
                sseSink,
                actionRunId: input.runId,
                actionKey: input.actionKey,
                generation: input.generation,
                clientActionId: input.clientActionId,
                existingFillText: '',
                pageContext: input.pageContext,
                summarizeHostTool,
                stepRecorder,
                systemPrompt: input.systemPrompt,
                objectivePrefix: input.instruction,
            });
            const completion = (0, page_action_run_completion_util_1.completionFromSummarizeText)(summary.summaryText, summary.dslOutcome);
            const terminal = (0, page_action_run_terminal_sse_util_1.resolvePageActionRunTerminalOutcome)(completion);
            (0, page_action_run_terminal_sse_util_1.emitPageActionRunTerminalSse)({
                sseSink,
                recorder: stepRecorder,
                actionRunId: input.runId,
                actionKey: input.actionKey,
                generation: input.generation,
                clientActionId: input.clientActionId,
                streamId,
                outcome: terminal,
                dslOutcome: summary.dslOutcome,
            });
            await this.prisma.pageActionRun.update({
                where: { id: input.runId },
                data: {
                    status: (0, page_action_run_terminal_sse_util_1.mapTerminalPhaseToRunStatus)(terminal.phase),
                    fillText: terminal.fillText,
                    dslOutcome: summary.dslOutcome,
                    streamId,
                    model: summary.model,
                    promptTokens: summary.promptTokens,
                    completionTokens: summary.completionTokens,
                    durationMs: Date.now() - startedAt,
                    finishedAt: new Date(),
                    steps: stepRecorder.toJson(),
                    errorCode: terminal.errorCode,
                    errorMessage: terminal.errorMessage,
                },
            });
            (0, page_action_run_debug_util_1.logPageActionRunDebug)('result', {
                actionRunId: input.runId,
                actionKey: input.actionKey,
                path: 'summarize',
                terminalPhase: terminal.phase,
                dslOutcome: summary.dslOutcome,
                streamId,
                model: summary.model,
                promptTokens: summary.promptTokens,
                completionTokens: summary.completionTokens,
                fillText: terminal.fillText,
                errorCode: terminal.errorCode,
                errorMessage: terminal.errorMessage,
                durationMs: Date.now() - startedAt,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const errorCode = error instanceof common_1.BadRequestException &&
                typeof error.getResponse() === 'object' &&
                error.getResponse() != null &&
                'code' in error.getResponse()
                ? String(error.getResponse().code)
                : 'LLM_FAILED';
            (0, page_action_run_debug_util_1.logPageActionRunDebug)('error', {
                actionRunId: input.runId,
                actionKey: input.actionKey,
                errorCode,
                errorMessage: message,
                durationMs: Date.now() - startedAt,
            });
            (0, page_action_inline_sse_util_1.writePageActionLifecycle)(sseSink, Object.assign(Object.assign({ phase: 'failed' }, lifecycleBase), { errorCode, errorMessage: message }), stepRecorder);
            await this.prisma.pageActionRun.update({
                where: { id: input.runId },
                data: {
                    status: client_1.PageActionRunStatus.failed,
                    errorCode,
                    errorMessage: message,
                    durationMs: Date.now() - startedAt,
                    finishedAt: new Date(),
                    steps: stepRecorder.toJson(),
                },
            });
        }
        finally {
            if (!sseSink.writableEnded) {
                (0, page_action_inline_sse_util_1.endInlineSseResponse)(sseSink);
            }
            this.runStreamHub.closeSession(input.runId);
        }
    }
    async executeWorkflow(input) {
        var _a;
        const { input: run, messages, sseSink, stepRecorder, startedAt, lifecycleBase } = input;
        const [loadResult, allowedToolIds] = await Promise.all([
            (0, load_workflow_definition_util_1.loadWorkflowForRunDetailed)(this.prisma, {
                workflowId: run.workflowId,
                appClientId: run.appClientId,
                workflowVersion: run.workflowVersion,
                workflowOverrides: (0, load_workflow_definition_util_1.parseWorkflowOverridesJson)(run.workflowOverrides),
            }),
            this.triggerPermission.resolveUserAllowedToolIdsForApp({
                userId: run.userId,
                appClientId: run.appClientId,
            }),
        ]);
        if (loadResult.status === 'failed') {
            const errorCode = (0, page_action_workflow_load_util_1.pageActionWorkflowLoadErrorCode)(loadResult.reason);
            const errorMessage = (0, page_action_workflow_load_util_1.pageActionWorkflowLoadFailureMessage)(loadResult.reason);
            (0, page_action_inline_sse_util_1.writePageActionLifecycle)(sseSink, Object.assign(Object.assign({ phase: 'failed' }, lifecycleBase), { errorCode,
                errorMessage }), stepRecorder);
            await this.prisma.pageActionRun.update({
                where: { id: run.runId },
                data: {
                    status: client_1.PageActionRunStatus.failed,
                    workflowId: loadResult.workflowId,
                    errorCode,
                    errorMessage,
                    durationMs: Date.now() - startedAt,
                    finishedAt: new Date(),
                    steps: stepRecorder.toJson(),
                },
            });
            return;
        }
        const permission = this.triggerPermission.evaluateForNodes({
            nodes: loadResult.nodes,
            allowedToolIds,
        });
        if (permission.allowed === false) {
            const errorCode = 'WORKFLOW_TRIGGER_PERMISSION_DENIED';
            const errorMessage = `Missing write tool permission: ${permission.missingToolIds.join(',')}`;
            (0, page_action_inline_sse_util_1.writePageActionLifecycle)(sseSink, Object.assign(Object.assign({ phase: 'failed' }, lifecycleBase), { errorCode,
                errorMessage }), stepRecorder);
            await this.prisma.pageActionRun.update({
                where: { id: run.runId },
                data: {
                    status: client_1.PageActionRunStatus.failed,
                    workflowId: loadResult.workflowId,
                    errorCode,
                    errorMessage,
                    durationMs: Date.now() - startedAt,
                    finishedAt: new Date(),
                    steps: stepRecorder.toJson(),
                },
            });
            return;
        }
        const toolBundle = await (0, page_workflow_tool_bundle_util_1.loadPageWorkflowToolBundle)({
            prisma: this.prisma,
            toolEngine: this.toolEngine,
            userId: run.userId,
            appClientId: run.appClientId,
            allowedToolIds,
        });
        const result = await (0, page_workflow_orchestrator_1.orchestratePageWorkflow)({
            workflowId: loadResult.workflowId,
            version: loadResult.version,
            nodes: loadResult.nodes,
            systemPrompt: run.systemPrompt,
            objectivePrefix: run.instruction,
            messages,
            pageContext: run.pageContext,
            actionContext: (_a = run.context) !== null && _a !== void 0 ? _a : null,
            hostTool: run.hostToolResolved,
            llmService: this.llmService,
            prisma: this.prisma,
            toolEngine: this.toolEngine,
            userId: run.userId,
            appClientId: run.appClientId,
            actionRunId: run.runId,
            actionKey: run.actionKey,
            generation: run.generation,
            clientActionId: run.clientActionId,
            sseSink,
            stepRecorder,
            allowedToolIds,
            toolBundle,
            approvalGate: this.approvalGate,
            approvalTriggerBinding: (0, resolve_approval_parties_util_1.parseApprovalTriggerBinding)(run.pageActionConfig),
            pageActionKey: run.pageActionKey,
        });
        const terminal = (0, page_action_run_terminal_sse_util_1.resolvePageActionRunTerminalOutcome)(result.completion);
        const persistedFillText = (0, resolve_page_action_run_output_text_util_1.resolvePageActionRunOutputText)({
            fillText: terminal.fillText,
            errorMessage: terminal.errorMessage,
            steps: result.steps,
        });
        const terminalOutcome = Object.assign(Object.assign({}, terminal), { fillText: persistedFillText });
        (0, page_action_run_terminal_sse_util_1.emitPageActionRunTerminalSse)({
            sseSink,
            recorder: stepRecorder,
            actionRunId: run.runId,
            actionKey: run.actionKey,
            generation: run.generation,
            clientActionId: run.clientActionId,
            streamId: input.lifecycleBase.streamId,
            outcome: terminalOutcome,
            dslOutcome: result.dslOutcome,
        });
        await this.prisma.pageActionRun.update({
            where: { id: run.runId },
            data: {
                workflowId: loadResult.workflowId,
                workflowVersion: loadResult.version,
                workflowRun: result.workflowRun,
                status: (0, page_action_run_terminal_sse_util_1.mapTerminalPhaseToRunStatus)(terminalOutcome.phase),
                fillText: persistedFillText,
                dslOutcome: result.dslOutcome,
                model: result.model,
                promptTokens: result.promptTokens,
                completionTokens: result.completionTokens,
                durationMs: Date.now() - startedAt,
                finishedAt: terminalOutcome.phase === 'awaiting_approval' ? null : new Date(),
                steps: result.steps,
                errorCode: terminalOutcome.errorCode,
                errorMessage: terminalOutcome.errorMessage,
            },
        });
        (0, page_action_run_debug_util_1.logPageActionRunDebug)('result', {
            actionRunId: run.runId,
            actionKey: run.actionKey,
            path: 'workflow',
            workflowId: loadResult.workflowId,
            workflowVersion: loadResult.version,
            terminalPhase: terminalOutcome.phase,
            dslOutcome: result.dslOutcome,
            model: result.model,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            fillText: persistedFillText,
            errorCode: terminalOutcome.errorCode,
            errorMessage: terminalOutcome.errorMessage,
            durationMs: Date.now() - startedAt,
            steps: result.steps,
            workflowRun: result.workflowRun,
        });
    }
};
PageActionRunExecutor = PageActionRunExecutor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LlmService,
        tool_engine_service_1.ToolEngineService,
        approval_gate_service_1.ApprovalGateService,
        approval_trigger_permission_service_1.ApprovalTriggerPermissionService,
        page_action_run_stream_hub_1.PageActionRunStreamHub])
], PageActionRunExecutor);
exports.PageActionRunExecutor = PageActionRunExecutor;
//# sourceMappingURL=page-action-run.executor.js.map