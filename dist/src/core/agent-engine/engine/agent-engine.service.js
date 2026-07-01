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
var AgentEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentEngineService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../../generated/prisma/client");
const llm_service_1 = require("../../llm/llm.service");
const prompt_composer_service_1 = require("../../prompt/prompt-composer.service");
const tool_engine_service_1 = require("../../tool-engine/tool-engine.service");
const prisma_service_1 = require("../../../prisma/prisma.service");
const approval_request_service_1 = require("../../approval/approval-request.service");
const pending_write_confirmation_store_1 = require("../../../modules/chat/pending-write-confirmation.store");
const agent_service_1 = require("../../../modules/agent/agent.service");
const host_tool_service_1 = require("../../../modules/host-tool/host-tool.service");
const run_metrics_util_1 = require("./run-metrics.util");
const agent_run_user_messages_util_1 = require("./agent-run-user-messages.util");
const agent_lang_graph_runner_1 = require("./main/runner/agent-lang-graph.runner");
const agent_run_lifecycle_service_1 = require("./main/run/agent-run-lifecycle.service");
const session_goa_service_1 = require("../../memory/goa/session-goa.service");
const host_bridge_1 = require("../../host-bridge");
const agent_run_sse_emitter_1 = require("./main/run/agent-run-sse.emitter");
const run_assistant_artifact_store_1 = require("./main/run/run-assistant-artifact.store");
const run_assistant_message_persist_service_1 = require("./main/run/run-assistant-message-persist.service");
const agent_session_scope_service_1 = require("./main/session/agent-session-scope.service");
const requested_skill_run_service_1 = require("./main/skill/requested-skill-run.service");
const agent_tool_runtime_util_1 = require("./main/runtime/agent-tool-runtime.util");
const agent_run_steps_util_1 = require("./main/run/agent-run-steps.util");
const host_tool_run_step_util_1 = require("./main/host-tool/host-tool-run-step.util");
const run_aborted_error_1 = require("../../session-run/run-aborted.error");
const agent_run_sse_gateway_1 = require("../../session-run/agent-run-sse.gateway");
const prepare_write_confirm_resume_util_1 = require("./write-confirm/prepare-write-confirm-resume.util");
const run_write_confirm_resume_util_1 = require("./write-confirm/run-write-confirm-resume.util");
const chat_approval_run_audit_util_1 = require("../../approval/chat-approval-run-audit.util");
const chat_approval_run_audit_util_2 = require("../../approval/chat-approval-run-audit.util");
let AgentEngineService = AgentEngineService_1 = class AgentEngineService {
    constructor(prisma, llmService, promptComposer, toolEngine, hostToolService, agentService, pendingWriteConfirmationStore, sse, assistantArtifact, messagePersist, lifecycle, langGraphRunner, sessionScope, goaService, requestedSkillRun, runSse, approvalRequests) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.promptComposer = promptComposer;
        this.toolEngine = toolEngine;
        this.hostToolService = hostToolService;
        this.agentService = agentService;
        this.pendingWriteConfirmationStore = pendingWriteConfirmationStore;
        this.sse = sse;
        this.assistantArtifact = assistantArtifact;
        this.messagePersist = messagePersist;
        this.lifecycle = lifecycle;
        this.langGraphRunner = langGraphRunner;
        this.sessionScope = sessionScope;
        this.goaService = goaService;
        this.requestedSkillRun = requestedSkillRun;
        this.runSse = runSse;
        this.approvalRequests = approvalRequests;
        this.logger = new common_1.Logger(AgentEngineService_1.name);
    }
    async assertRequestedSkillRunnable(input) {
        const allowedRows = await this.sessionScope.getSessionAllowedTools(input.sessionId, input.agentId, input.userId, input.appClientId);
        const { tools } = (0, agent_tool_runtime_util_1.buildEngineToolsFromAllowed)(allowedRows, input.userId, this.toolEngine);
        await this.requestedSkillRun.assertRunnableForMessage({
            userId: input.userId,
            appClientId: input.appClientId,
            agentId: input.agentId,
            skillId: input.skillId,
            allowedTools: tools,
        });
    }
    async cancelPendingWriteConfirmation(userId, sessionId) {
        const pending = await this.pendingWriteConfirmationStore.get(sessionId, userId);
        await this.pendingWriteConfirmationStore.clear(sessionId);
        if (!pending) {
            return;
        }
        void this.approvalRequests
            .syncChatRealtimeDecision({
            appClientId: pending.appClientId,
            sessionId,
            runId: pending.runId,
            decidedByUserId: userId,
            decision: 'rejected',
            decisionNote: 'cancelled in chat',
        })
            .catch((error) => this.logger.warn(`chat approval sync on cancel failed sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`));
        const approvalRow = await this.approvalRequests.findChatBySessionPrimaryRun({
            appClientId: pending.appClientId,
            sessionId,
            runId: pending.runId,
        });
        if (approvalRow) {
            await (0, chat_approval_run_audit_util_2.appendChatApprovalRejectedAuditToPrimaryRun)({
                prisma: this.prisma,
                primaryRunId: pending.runId,
                approvalRequestId: approvalRow.id,
                rejectChannel: 'session_cancel',
                decidedByUserId: userId,
                decisionNote: 'cancelled in chat',
            });
        }
        this.runSse.purgeWriteConfirmationGate(sessionId, pending.runId);
        const message = '已取消操作。';
        this.runSse.emitWriteConfirmationCancelled(sessionId, {
            runId: pending.runId,
            turnId: pending.turnId,
            message,
        });
        if (pending.turnId != null) {
            await this.messagePersist.appendNoticeToTurnOutput({
                userId,
                sessionId,
                turnId: pending.turnId,
                noticeMarkdown: message,
            });
        }
    }
    emitAgentRunComplete(sessionId, result) {
        this.runSse.emitRunComplete(sessionId, {
            runId: result.runId,
            turnId: result.turnId,
            status: result.status,
        });
    }
    async emitRunCompletion(sessionId, result, graphState, pageContext, runtime) {
        var _a, _b, _c, _d, _e;
        const mutationSucceeded = result.status === client_1.AgentRunStatus.success &&
            !graphState.awaitingWriteConfirmation &&
            (0, host_bridge_1.hasSuccessfulMutationStep)(graphState.steps, graphState.scopedTools);
        if (mutationSucceeded) {
            const pageScope = (0, host_bridge_1.resolveHostToolPageScope)(pageContext);
            const pageAligned = (0, host_bridge_1.isPageContextAlignedWithSuccessfulMutations)({
                pageContext,
                steps: graphState.steps,
                scopedTools: graphState.scopedTools,
            });
            if (!pageAligned) {
                const mutationIds = [
                    ...(0, host_bridge_1.collectSuccessfulMutationIdentifierValues)({
                        steps: graphState.steps,
                        scopedTools: graphState.scopedTools,
                    }),
                ];
                this.logger.log(`completion host_tool skipped: pageContext entity not aligned with mutation runId=${result.runId} page=${pageContext.page} entityId=${String((_b = (_a = pageContext.entity) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : '')} entityType=${String((_d = (_c = pageContext.entity) === null || _c === void 0 ? void 0 : _c.type) !== null && _d !== void 0 ? _d : '')} mutationIds=${mutationIds.join(',') || 'none'}`);
                const completionHostToolStep = (0, host_tool_run_step_util_1.buildHostToolRunStep)({
                    existingSteps: graphState.steps,
                    status: 'completion_skipped',
                    reason: 'agent_mutation_success',
                    pageScope: pageScope !== null && pageScope !== void 0 ? pageScope : undefined,
                    skipReason: 'page_context_entity_not_aligned_with_mutation',
                    sseDispatched: false,
                });
                await this.lifecycle.updateRun(result.runId, [...graphState.steps, completionHostToolStep], result.status);
                this.emitAgentRunComplete(sessionId, result);
                return;
            }
            const hostTools = await this.hostToolService.resolveCompletionHostTools({
                appClientId: runtime.appClientId,
                agentId: runtime.agentId,
                skillId: graphState.activeSkillId,
                pageContext,
            });
            const sseDispatched = hostTools.length > 0;
            if (sseDispatched) {
                (0, host_bridge_1.dispatchHostActionInstant)((sid, envelope) => this.runSse.emitHostAction(sid, result.runId, envelope.payload), sessionId, {
                    pageContext,
                    runId: result.runId,
                    turnId: result.turnId,
                    hostTools,
                    streamId: (0, host_bridge_1.buildHostToolStreamId)({
                        runId: result.runId,
                        turnId: result.turnId,
                        stepId: 'completion',
                    }),
                    reason: 'agent_mutation_success',
                    generation: (_e = this.runSse.getBoundRunGeneration(sessionId, result.runId)) !== null && _e !== void 0 ? _e : undefined,
                });
            }
            const completionHostToolStep = (0, host_tool_run_step_util_1.buildCompletionHostToolRunStep)({
                existingSteps: graphState.steps,
                pageScope: pageScope !== null && pageScope !== void 0 ? pageScope : undefined,
                hostTools,
                sseDispatched,
            });
            const stepsWithHostTool = [...graphState.steps, completionHostToolStep];
            await this.lifecycle.updateRun(result.runId, stepsWithHostTool, result.status);
        }
        this.emitAgentRunComplete(sessionId, result);
    }
    emitWriteConfirmationExpired(sessionId) {
        this.runSse.emitWriteConfirmationExpired(sessionId);
    }
    async resumeAfterWriteConfirm(input, scope) {
        var _a, _b;
        scope.assertActive();
        const prepared = await (0, prepare_write_confirm_resume_util_1.prepareWriteConfirmFromRedis)({
            resumeInput: input,
            prisma: this.prisma,
            agentService: this.agentService,
            pendingWriteConfirmationStore: this.pendingWriteConfirmationStore,
            emitWriteConfirmationExpired: (sessionId) => this.emitWriteConfirmationExpired(sessionId),
        });
        if (!prepared) {
            this.emitWriteConfirmationExpired(input.sessionId);
            return null;
        }
        await (0, prepare_write_confirm_resume_util_1.releaseWriteConfirmGate)({
            sessionId: input.sessionId,
            userId: input.userId,
            runId: prepared.suspendedPrimaryRunId,
            appClientId: prepared.consumed.appClientId,
            pendingWriteConfirmationStore: this.pendingWriteConfirmationStore,
            runSse: this.runSse,
            approvalRequests: this.approvalRequests,
        });
        const approvalAudit = await (0, chat_approval_run_audit_util_1.resolveChatApprovalResumeAudit)({
            approvalRequests: this.approvalRequests,
            appClientId: prepared.consumed.appClientId,
            sessionId: input.sessionId,
            primaryRunId: prepared.suspendedPrimaryRunId,
            decidedByUserId: input.userId,
            resumeChannel: 'session_confirm',
            nodeId: (_b = (_a = prepared.consumed.resumeContext.workflowRun) === null || _a === void 0 ? void 0 : _a.currentNodeId) !== null && _b !== void 0 ? _b : null,
        });
        return (0, run_write_confirm_resume_util_1.runWriteConfirmResume)({
            resumeInput: input,
            prepared,
            scope,
            deps: this.buildWriteConfirmResumeDeps(),
            approvalAudit,
        });
    }
    async resumeChatFromApprovalInboxSnapshot(input, scope) {
        var _a, _b, _c;
        scope.assertActive();
        const prepared = await (0, prepare_write_confirm_resume_util_1.prepareWriteConfirmFromApprovalSnapshot)({
            resumeInput: input,
            snapshot: input.snapshot,
            prisma: this.prisma,
            agentService: this.agentService,
        });
        if (!prepared) {
            this.emitWriteConfirmationExpired(input.sessionId);
            return null;
        }
        await (0, prepare_write_confirm_resume_util_1.releaseWriteConfirmGate)({
            sessionId: input.sessionId,
            userId: input.userId,
            runId: prepared.suspendedPrimaryRunId,
            appClientId: prepared.consumed.appClientId,
            pendingWriteConfirmationStore: this.pendingWriteConfirmationStore,
            runSse: this.runSse,
            approvalRequests: this.approvalRequests,
            skipChatApprovalSync: true,
        });
        const approvalAudit = (_a = input.approvalAudit) !== null && _a !== void 0 ? _a : (await (0, chat_approval_run_audit_util_1.resolveChatApprovalResumeAudit)({
            approvalRequests: this.approvalRequests,
            appClientId: prepared.consumed.appClientId,
            sessionId: input.sessionId,
            primaryRunId: prepared.suspendedPrimaryRunId,
            decidedByUserId: input.userId,
            resumeChannel: 'inbox_confirm',
            approvalRequestId: input.approvalRequestId,
            nodeId: (_c = (_b = input.snapshot.workflowRun) === null || _b === void 0 ? void 0 : _b.currentNodeId) !== null && _c !== void 0 ? _c : null,
        }));
        return (0, run_write_confirm_resume_util_1.runWriteConfirmResume)({
            resumeInput: input,
            prepared,
            scope,
            deps: this.buildWriteConfirmResumeDeps(),
            approvalAudit,
        });
    }
    buildWriteConfirmResumeDeps() {
        return (0, run_write_confirm_resume_util_1.buildWriteConfirmResumeDeps)({
            emitWriteConfirmationExpired: (sessionId) => this.emitWriteConfirmationExpired(sessionId),
            emitAgentRunComplete: (sessionId, result) => this.emitAgentRunComplete(sessionId, result),
            emitRunCompletion: (...args) => this.emitRunCompletion(...args),
            handleRunAborted: (abortInput) => this.handleRunAborted(abortInput),
            handleRunFailure: (failureInput) => this.handleRunFailure(failureInput),
        }, {
            prisma: this.prisma,
            agentService: this.agentService,
            llmService: this.llmService,
            goaService: this.goaService,
            toolEngine: this.toolEngine,
            langGraphRunner: this.langGraphRunner,
            lifecycle: this.lifecycle,
            sse: this.sse,
            assistantArtifact: this.assistantArtifact,
            promptComposer: this.promptComposer,
            logger: this.logger,
        });
    }
    async run(input, scope) {
        var _a;
        const session = await this.prisma.session.findFirst({
            where: { id: input.sessionId, userId: input.userId },
            select: { id: true, agentId: true, appClientId: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('chat not found');
        }
        if (!session.agentId) {
            return null;
        }
        scope.assertActive();
        const startedAt = new Date();
        const [agent, messageTokenBudget] = await Promise.all([
            this.agentService.getRuntimeAgent(session.appClientId, session.agentId),
            this.llmService.getMessageTokenBudget(),
        ]);
        if (!agent) {
            throw new common_1.NotFoundException(`agent ${session.agentId} not found`);
        }
        const pageContext = await this.goaService.syncHostPageContext(input.sessionId, (_a = input.pageContext) !== null && _a !== void 0 ? _a : null);
        scope.assertActive();
        const prompt = await this.promptComposer.compose({
            userId: input.userId,
            sessionId: input.sessionId,
            latestUserMessage: input.input,
            agentSystemPrompt: agent.systemPrompt,
            sessionScope: {
                appClientId: session.appClientId,
                agentId: session.agentId,
            },
            pageContext,
        });
        scope.assertActive();
        const [allowedTools, turn] = await Promise.all([
            this.sessionScope.getSessionAllowedTools(input.sessionId, agent.id, input.userId, session.appClientId),
            this.prisma.messageTurn.create({
                data: {
                    messageId: input.userMessageId,
                    sessionId: session.id,
                    userId: input.userId,
                    appClientId: session.appClientId,
                    userInput: input.input,
                    primaryAgentId: agent.id,
                    agentRunCount: 1,
                    status: client_1.AgentRunStatus.running,
                    startedAt,
                },
            }),
        ]);
        const { tools, toolProfilesByName, allowedToolIds, langChainTools, toolBuildCtx, } = (0, agent_tool_runtime_util_1.buildEngineToolsFromAllowed)(allowedTools, input.userId, this.toolEngine);
        scope.assertActive();
        const run = await this.prisma.agentRun.create({
            data: {
                turnId: turn.id,
                agentId: agent.id,
                appClientId: session.appClientId,
                sessionId: session.id,
                userId: input.userId,
                role: client_1.AgentRunRole.primary,
                sequence: 1,
                input: input.input,
                status: client_1.AgentRunStatus.running,
                steps: [],
                currentStep: 0,
                maxSteps: agent.maxSteps,
                startedAt,
            },
        });
        const runMetrics = (0, run_metrics_util_1.createRunMetricsAccumulator)();
        this.assistantArtifact.reset(input.sessionId, run.id, turn.id);
        this.sse.clearThinkBuffer(input.sessionId, run.id);
        scope.startRun(run.id, turn.id);
        try {
            scope.assertActive(run.id);
            const graphState = await this.langGraphRunner.run({
                promptMessages: prompt.messages,
                latestUserMessage: input.input,
                sessionId: input.sessionId,
                runId: run.id,
                userId: input.userId,
                appClientId: session.appClientId,
                agentId: agent.id,
                maxSteps: agent.maxSteps,
                enableToolCall: agent.enableToolCall,
                tools,
                langChainTools,
                toolBuildCtx,
                allowedToolIds,
                messageTokenBudget,
                runMetrics,
                toolProfilesByName,
                turnId: turn.id,
                requestedSkillId: input.requestedSkillId,
                pageContext,
                runGeneration: scope.generation,
                abortSignal: scope.abortSignal,
            });
            const result = await this.lifecycle.completeAgentRunFromGraph({
                userId: input.userId,
                sessionId: input.sessionId,
                turnId: turn.id,
                runId: run.id,
                agent,
                latestUserMessage: input.input,
                graphState,
                runMetrics,
            });
            await this.emitRunCompletion(input.sessionId, result, graphState, pageContext, {
                appClientId: session.appClientId,
                agentId: agent.id,
            });
            return result;
        }
        catch (error) {
            if ((0, run_aborted_error_1.isAgentRunAbortedError)(error)) {
                const partial = await this.prisma.agentRun.findUnique({
                    where: { id: run.id },
                    select: { steps: true },
                });
                await this.handleRunAborted({
                    error,
                    sessionId: input.sessionId,
                    turnId: turn.id,
                    runId: run.id,
                    runMetrics,
                    scopedToolCount: tools.length,
                    steps: this.lifecycle.parseStepsFromRun(partial === null || partial === void 0 ? void 0 : partial.steps),
                });
                throw error;
            }
            const partial = await this.prisma.agentRun.findUnique({
                where: { id: run.id },
                select: { steps: true },
            });
            const partialSteps = this.lifecycle.parseStepsFromRun(partial === null || partial === void 0 ? void 0 : partial.steps);
            const result = await this.handleRunFailure({
                error,
                userId: input.userId,
                sessionId: input.sessionId,
                turnId: turn.id,
                runId: run.id,
                runMetrics,
                scopedToolCount: tools.length,
                scheduleMemory: this.lifecycle.buildFailureMemoryContext({
                    turnId: turn.id,
                    runId: run.id,
                    userInput: input.input,
                    finalOutput: '',
                    steps: partialSteps,
                }),
            });
            if (result) {
                this.emitAgentRunComplete(input.sessionId, result);
            }
            return result;
        }
        finally {
            scope.endRun(run.id);
            this.sse.clearThinkBuffer(input.sessionId, run.id);
            this.assistantArtifact.clear(input.sessionId, run.id);
        }
    }
    async handleRunAborted(input) {
        const finishReason = input.error.reason === 'superseded' ? 'superseded' : 'user_cancelled';
        await this.lifecycle.finalizeRunAndTurn({
            turnId: input.turnId,
            runId: input.runId,
            runMetrics: input.runMetrics,
            finalOutput: '',
            status: client_1.AgentRunStatus.failed,
            finishReason,
            error: input.error.message,
            scopedToolCount: input.scopedToolCount,
            steps: input.steps,
            currentStep: (0, agent_run_steps_util_1.maxRunStepNumber)(input.steps),
        });
        await this.prisma.messageTurn.update({
            where: { id: input.turnId },
            data: { status: client_1.AgentRunStatus.failed },
        });
    }
    async handleRunFailure(input) {
        const errorText = input.error instanceof Error ? input.error.message : String(input.error);
        const userFacing = (0, agent_run_user_messages_util_1.resolveAgentRunFailureUserMessage)(input.error);
        const errorCode = (0, agent_run_user_messages_util_1.resolveAgentRunFailureCode)(input.error);
        if (!userFacing) {
            const finishReason = (0, run_metrics_util_1.resolveFinishReason)({
                status: client_1.AgentRunStatus.failed,
                steps: [],
                finishedEarly: false,
                error: errorText,
            });
            await this.lifecycle.finalizeRunAndTurn({
                turnId: input.turnId,
                runId: input.runId,
                runMetrics: input.runMetrics,
                finalOutput: '',
                status: client_1.AgentRunStatus.failed,
                finishReason,
                error: errorText,
                scopedToolCount: input.scopedToolCount,
                steps: [],
                currentStep: 0,
            });
            throw input.error;
        }
        const sanitizedUserFacing = this.lifecycle.sanitizeFinalOutput(userFacing);
        (0, run_metrics_util_1.recordMachineCodeUsage)(input.runMetrics, errorCode);
        this.sse.publishAssistantBlocks(input.sessionId, input.runId, [
            { type: 'text', content: sanitizedUserFacing, format: 'markdown' },
        ]);
        const result = await this.lifecycle.finishAgentRun({
            userId: input.userId,
            sessionId: input.sessionId,
            turnId: input.turnId,
            runId: input.runId,
            status: client_1.AgentRunStatus.success,
            steps: [],
            scopedToolCount: input.scopedToolCount,
            runMetrics: input.runMetrics,
            error: errorText,
        });
        if (input.scheduleMemory) {
            await this.lifecycle.awaitPostRunMemoryTasks(input.sessionId, Object.assign(Object.assign({}, input.scheduleMemory), { turnId: input.turnId, runId: input.runId, finalOutput: this.lifecycle.finalOutputPlainText(result.output), runStatus: 'failed' }));
        }
        return result;
    }
};
AgentEngineService = AgentEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LlmService,
        prompt_composer_service_1.PromptComposerService,
        tool_engine_service_1.ToolEngineService,
        host_tool_service_1.HostToolService,
        agent_service_1.AgentService,
        pending_write_confirmation_store_1.PendingWriteConfirmationStore,
        agent_run_sse_emitter_1.AgentRunSseEmitter,
        run_assistant_artifact_store_1.RunAssistantArtifactStore,
        run_assistant_message_persist_service_1.RunAssistantMessagePersistService,
        agent_run_lifecycle_service_1.AgentRunLifecycleService,
        agent_lang_graph_runner_1.AgentLangGraphRunner,
        agent_session_scope_service_1.AgentSessionScopeService,
        session_goa_service_1.SessionGoaService,
        requested_skill_run_service_1.RequestedSkillRunService,
        agent_run_sse_gateway_1.AgentRunSseGateway,
        approval_request_service_1.ApprovalRequestService])
], AgentEngineService);
exports.AgentEngineService = AgentEngineService;
//# sourceMappingURL=agent-engine.service.js.map