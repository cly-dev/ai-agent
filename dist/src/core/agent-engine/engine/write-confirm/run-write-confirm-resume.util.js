"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWriteConfirmResumeDeps = exports.runWriteConfirmResume = void 0;
const client_1 = require("../../../../../generated/prisma/client");
const host_bridge_1 = require("../../../host-bridge");
const workflow_plan_transition_util_1 = require("../../../workflow/workflow-plan-transition.util");
const workflow_resume_util_1 = require("../../../workflow/workflow-resume.util");
const workflow_mutation_write_gate_util_1 = require("../../../workflow/workflow-mutation-write-gate.util");
const workflow_debug_util_1 = require("../../../workflow/trace/workflow-debug.util");
const agent_write_confirmation_util_1 = require("../agent-write-confirmation.util");
const write_confirm_resume_summary_util_1 = require("../write-confirm-resume-summary.util");
const run_metrics_util_1 = require("../run-metrics.util");
const agent_tool_runtime_util_1 = require("../main/runtime/agent-tool-runtime.util");
const agent_run_steps_util_1 = require("../main/run/agent-run-steps.util");
const task_plan_util_1 = require("../main/plan/task-plan.util");
const turn_respond_util_1 = require("../turn/turn-respond.util");
const run_aborted_error_1 = require("../../../session-run/run-aborted.error");
const chat_approval_run_audit_util_1 = require("../../../approval/chat-approval-run-audit.util");
async function runWriteConfirmResume(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    const { resumeInput, prepared, scope, deps } = input;
    const { session, consumed, primaryRun, suspendedPrimaryRunId } = prepared;
    const agent = await deps.agentService.getRuntimeAgent(session.appClientId, session.agentId);
    if (!agent) {
        deps.host.emitWriteConfirmationExpired(resumeInput.sessionId);
        return null;
    }
    const [allowedTools, messageTokenBudget, goaPayload, runCount] = await Promise.all([
        deps.agentService.getAllowedTools(session.agentId, resumeInput.userId, session.appClientId),
        deps.llmService.getMessageTokenBudget(),
        deps.goaService.ensurePayload(resumeInput.sessionId),
        deps.prisma.agentRun.count({ where: { turnId: primaryRun.turnId } }),
    ]);
    const resumePageContext = (0, host_bridge_1.coalescePageContext)(resumeInput.pageContext, consumed.resumeContext.pageContext, goaPayload.lastPageContext);
    if (resumeInput.pageContext) {
        await deps.goaService.syncHostPageContext(resumeInput.sessionId, resumeInput.pageContext);
    }
    const prompt = await deps.promptComposer.compose({
        userId: resumeInput.userId,
        sessionId: resumeInput.sessionId,
        latestUserMessage: consumed.latestUserMessage,
        agentSystemPrompt: agent.systemPrompt,
        sessionScope: {
            appClientId: session.appClientId,
            agentId: session.agentId,
        },
        pageContext: resumePageContext,
    });
    const { tools, toolProfilesByName, allowedToolIds, langChainTools, toolBuildCtx, } = (0, agent_tool_runtime_util_1.buildEngineToolsFromAllowed)(allowedTools, resumeInput.userId, deps.toolEngine);
    const scopedIdSet = new Set(consumed.resumeContext.scopedToolIds);
    const resolvedScopedTools = tools.filter((tool) => scopedIdSet.has(tool.id)).length > 0
        ? tools.filter((tool) => scopedIdSet.has(tool.id))
        : tools;
    const scopedAllowedToolIds = resolvedScopedTools.map((tool) => tool.id);
    const scopedToolBundle = deps.toolEngine.buildLangChainTools(resolvedScopedTools, Object.assign(Object.assign({}, toolBuildCtx), { allowedToolIds: scopedAllowedToolIds }));
    let priorObservations = (0, agent_write_confirmation_util_1.deserializePendingObservations)(consumed.resumeContext.toolObservations);
    if (priorObservations.length === 0) {
        const goa = await deps.goaService.ensurePayload(resumeInput.sessionId);
        priorObservations = deps.goaService
            .buildPriorToolObservationsForGraph(goa)
            .map((row) => ({
            name: row.name,
            output: row.output,
        }));
    }
    const startedAt = new Date();
    scope.assertActive();
    const resumeRun = await deps.prisma.agentRun.create({
        data: {
            turnId: primaryRun.turnId,
            agentId: agent.id,
            appClientId: session.appClientId,
            sessionId: session.id,
            userId: resumeInput.userId,
            role: client_1.AgentRunRole.worker,
            sequence: runCount + 1,
            input: consumed.latestUserMessage,
            status: client_1.AgentRunStatus.running,
            steps: [],
            currentStep: 0,
            maxSteps: agent.maxSteps,
            startedAt,
        },
    });
    scope.startRun(resumeRun.id, primaryRun.turnId);
    scope.assertActive(resumeRun.id);
    let workerLeadSteps = [];
    if (input.approvalAudit) {
        workerLeadSteps = [
            (0, chat_approval_run_audit_util_1.buildChatApprovalConfirmedRunStep)(1, {
                approvalRequestId: input.approvalAudit.approvalRequestId,
                primaryRunId: suspendedPrimaryRunId,
                resumeChannel: input.approvalAudit.resumeChannel,
                decidedByUserId: input.approvalAudit.decidedByUserId,
                nodeId: input.approvalAudit.nodeId,
            }),
        ];
    }
    const approvedWriteToolNamesFromPending = consumed.toolCalls.map((call) => call.name);
    const isWorkflowAwaitResume = (0, workflow_mutation_write_gate_util_1.isWorkflowAwaitUserConfirmResume)({
        pendingToolCalls: consumed.toolCalls,
        workflowRun: (_a = consumed.resumeContext.workflowRun) !== null && _a !== void 0 ? _a : null,
    });
    let writeObservations = [];
    let writeSteps = [];
    let writeRoundMeta = {
        toolCalls: [],
        executionStatuses: [],
        roundObservationIndices: [],
        errorDispositions: [],
    };
    if (!isWorkflowAwaitResume) {
        const writeResult = await (0, agent_tool_runtime_util_1.executePendingWriteToolCalls)({
            latestUserMessage: consumed.latestUserMessage,
            toolCalls: consumed.toolCalls,
            tools: resolvedScopedTools,
            langChainBundle: scopedToolBundle,
            priorSteps: [],
            priorObservations,
            toolEngine: deps.toolEngine,
            assessObservationQuality: (output, agentMetadata) => deps.langGraphRunner.assessObservationQualityForResume(output, agentMetadata),
            runId: resumeRun.id,
            sessionId: resumeInput.sessionId,
            onToolDebugLog: (message) => deps.logger.log(message),
            assertContinue: () => scope.assertActive(resumeRun.id),
        });
        writeObservations = writeResult.observations;
        writeSteps = writeResult.steps;
        writeRoundMeta = writeResult.lastToolRoundMeta;
        if (writeObservations.length === 0) {
            if (workerLeadSteps.length > 0) {
                await deps.lifecycle.updateRun(resumeRun.id, workerLeadSteps, client_1.AgentRunStatus.failed);
            }
            else {
                await deps.lifecycle.updateRun(resumeRun.id, [], client_1.AgentRunStatus.failed);
            }
            deps.host.emitWriteConfirmationExpired(resumeInput.sessionId);
            return null;
        }
        writeSteps = (0, chat_approval_run_audit_util_1.offsetRunSteps)(writeSteps, workerLeadSteps.length + 1);
        await deps.lifecycle.updateRun(resumeRun.id, [...workerLeadSteps, ...writeSteps], client_1.AgentRunStatus.running);
    }
    else if (workerLeadSteps.length > 0) {
        await deps.lifecycle.updateRun(resumeRun.id, workerLeadSteps, client_1.AgentRunStatus.running);
    }
    const combinedWorkerSteps = [...workerLeadSteps, ...writeSteps];
    const approvedWriteToolNames = isWorkflowAwaitResume
        ? (0, workflow_mutation_write_gate_util_1.resolveApprovedWriteToolNamesAfterWorkflowAwait)({
            observations: priorObservations,
            scopedTools: resolvedScopedTools,
            workflowNodeDefs: consumed.resumeContext.workflowNodeDefs,
        })
        : approvedWriteToolNamesFromPending;
    const runMetrics = (0, run_metrics_util_1.createRunMetricsAccumulator)();
    deps.assistantArtifact.reset(resumeInput.sessionId, resumeRun.id, primaryRun.turnId);
    deps.sse.clearThinkBuffer(resumeInput.sessionId, resumeRun.id);
    scope.assertActive(resumeRun.id);
    const iterationAfterWrites = isWorkflowAwaitResume
        ? (0, agent_run_steps_util_1.maxRunStepNumber)((_b = consumed.resumeContext.steps) !== null && _b !== void 0 ? _b : [])
        : (0, agent_run_steps_util_1.maxRunStepNumber)(combinedWorkerSteps);
    const allObservations = [
        ...priorObservations,
        ...writeObservations,
    ];
    let taskPlan = (_c = consumed.resumeContext.taskPlan) !== null && _c !== void 0 ? _c : null;
    if (taskPlan && ((_d = consumed.resumeContext.workflowNodeDefs) === null || _d === void 0 ? void 0 : _d.length)) {
        taskPlan =
            (_e = (0, workflow_resume_util_1.hydrateTaskPlanWithWorkflowDefs)({
                taskPlan,
                workflowNodeDefs: consumed.resumeContext.workflowNodeDefs,
            })) !== null && _e !== void 0 ? _e : taskPlan;
    }
    let pendingRespond = null;
    let workflowRun = (_f = consumed.resumeContext.workflowRun) !== null && _f !== void 0 ? _f : null;
    const workflowRunBeforeAdvance = workflowRun;
    if (workflowRun) {
        workflowRun = (0, workflow_resume_util_1.advanceWorkflowRunAfterWriteConfirm)(workflowRun);
    }
    if (taskPlan && isWorkflowAwaitResume && workflowRunBeforeAdvance) {
        taskPlan =
            (_g = (0, workflow_resume_util_1.prepareTaskPlanForWorkflowWriteConfirmResume)({
                taskPlan,
                workflowRunBeforeAdvance,
                workflowNodeDefs: consumed.resumeContext.workflowNodeDefs,
                workflowRunAfterAdvance: workflowRun,
            })) !== null && _g !== void 0 ? _g : taskPlan;
    }
    const workflowContinues = (0, workflow_resume_util_1.workflowRunHasPendingNodes)(workflowRun);
    (0, workflow_debug_util_1.logWorkflowDebug)('write_confirm_resume', {
        runId: resumeRun.id,
        sessionId: resumeInput.sessionId,
        turnId: primaryRun.turnId,
        primaryRunId: suspendedPrimaryRunId,
        workflowContinues,
        workflowRun,
        writeToolCount: writeRoundMeta.toolCalls.length,
    });
    if (writeRoundMeta.toolCalls.length > 0) {
        if (taskPlan) {
            const planAdvance = (0, task_plan_util_1.resolveTaskPlanAdvance)({
                phase: 'post_tools',
                plan: taskPlan,
                observations: allObservations,
                executionStatuses: writeRoundMeta.executionStatuses,
                roundObservationIndices: writeRoundMeta.roundObservationIndices,
                scopedTools: resolvedScopedTools,
                toolCalls: writeRoundMeta.toolCalls,
            });
            if (planAdvance) {
                const progressed = (0, workflow_plan_transition_util_1.applyPlanAdvanceAsWorkflowProgress)({
                    taskPlan,
                    workflowRun,
                    workflowNodeDefs: consumed.resumeContext.workflowNodeDefs,
                    planBefore: taskPlan,
                    planAdvance,
                });
                taskPlan = (_h = progressed.taskPlan) !== null && _h !== void 0 ? _h : taskPlan;
                if (progressed.workflowRun) {
                    workflowRun = progressed.workflowRun;
                }
            }
        }
        if (!workflowContinues) {
            const resumeSummaryObservation = (0, write_confirm_resume_summary_util_1.buildWriteConfirmResumeSummaryObservation)({
                userMessage: consumed.latestUserMessage,
                writeRoundMeta,
                observations: allObservations,
                scopedTools: resolvedScopedTools,
            });
            pendingRespond = resumeSummaryObservation
                ? (0, turn_respond_util_1.pendingRespondFromObservation)(resumeSummaryObservation)
                : null;
        }
    }
    const graphInitialState = Object.assign({ iteration: iterationAfterWrites, steps: combinedWorkerSteps, preloadedToolObservations: priorObservations, toolObservations: writeObservations, pendingToolCalls: [], pendingRespond, lastToolRoundMeta: writeRoundMeta, intentKind: consumed.resumeContext.intentKind, scopedTools: resolvedScopedTools, scopedLangChainTools: scopedToolBundle.tools, scopedToolBundle,
        scopedAllowedToolIds,
        toolProfilesByName, hasExpandedOnce: consumed.resumeContext.hasExpandedOnce, skillApplied: consumed.resumeContext.skillApplied === true, activeSkillId: (_j = consumed.resumeContext.activeSkillId) !== null && _j !== void 0 ? _j : null, activeSkillPrompt: (_k = consumed.resumeContext.activeSkillPrompt) !== null && _k !== void 0 ? _k : null, activeSkillName: (_l = consumed.resumeContext.activeSkillName) !== null && _l !== void 0 ? _l : null, activeSkillDescription: (_m = consumed.resumeContext.activeSkillDescription) !== null && _m !== void 0 ? _m : null, activeSkillConfig: (_o = consumed.resumeContext.activeSkillConfig) !== null && _o !== void 0 ? _o : null, activeSkillRiskLevel: (_p = consumed.resumeContext.activeSkillRiskLevel) !== null && _p !== void 0 ? _p : null, taskPlan, pagedListHttpUsed: (_q = consumed.resumeContext.pagedListHttpUsed) !== null && _q !== void 0 ? _q : 0, confirmedPreviewSerialized: ((_r = consumed.resumeContext.confirmedPreviewSerialized) === null || _r === void 0 ? void 0 : _r.trim()) ||
            ((_s = (await deps.prisma.agentRun.findUnique({
                where: { id: primaryRun.id },
                select: { output: true },
            }))) === null || _s === void 0 ? void 0 : _s.output) ||
            null, pageContext: resumePageContext }, (workflowRun
        ? {
            workflowRun,
            workflowNodeDefs: consumed.resumeContext.workflowNodeDefs,
            workflowNodeOutputs: (_t = consumed.resumeContext.workflowNodeOutputs) !== null && _t !== void 0 ? _t : {},
            workflowAwaitingReact: isWorkflowAwaitResume
                ? (0, workflow_resume_util_1.shouldAwaitReactOnWorkflowResume)(workflowRun, (_u = consumed.resumeContext.workflowNodeDefs) !== null && _u !== void 0 ? _u : [])
                : consumed.resumeContext.workflowAwaitingReact === true,
        }
        : {}));
    try {
        scope.assertActive(resumeRun.id);
        const graphState = await deps.langGraphRunner.run({
            promptMessages: prompt.messages,
            latestUserMessage: consumed.latestUserMessage,
            sessionId: resumeInput.sessionId,
            runId: resumeRun.id,
            userId: resumeInput.userId,
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
            turnId: primaryRun.turnId,
            resumeFromWriteConfirm: true,
            graphInitialState,
            approvedWriteToolNames,
            pageContext: resumePageContext,
            runGeneration: scope.generation,
            abortSignal: scope.abortSignal,
        });
        const result = await deps.lifecycle.completeAgentRunFromGraph({
            userId: resumeInput.userId,
            sessionId: resumeInput.sessionId,
            turnId: primaryRun.turnId,
            runId: resumeRun.id,
            agent,
            latestUserMessage: consumed.latestUserMessage,
            graphState,
            runMetrics,
        });
        await deps.host.emitRunCompletion(resumeInput.sessionId, result, graphState, resumePageContext, {
            appClientId: session.appClientId,
            agentId: agent.id,
        });
        return result;
    }
    catch (error) {
        if ((0, run_aborted_error_1.isAgentRunAbortedError)(error)) {
            const partial = await deps.prisma.agentRun.findUnique({
                where: { id: resumeRun.id },
                select: { steps: true },
            });
            await deps.host.handleRunAborted({
                error,
                sessionId: resumeInput.sessionId,
                turnId: primaryRun.turnId,
                runId: resumeRun.id,
                runMetrics,
                scopedToolCount: tools.length,
                steps: deps.lifecycle.parseStepsFromRun(partial === null || partial === void 0 ? void 0 : partial.steps),
            });
            throw error;
        }
        const partial = await deps.prisma.agentRun.findUnique({
            where: { id: resumeRun.id },
            select: { steps: true },
        });
        const partialSteps = deps.lifecycle.parseStepsFromRun(partial === null || partial === void 0 ? void 0 : partial.steps);
        const result = await deps.host.handleRunFailure({
            error,
            userId: resumeInput.userId,
            sessionId: resumeInput.sessionId,
            turnId: primaryRun.turnId,
            runId: resumeRun.id,
            runMetrics,
            scopedToolCount: tools.length,
            scheduleMemory: deps.lifecycle.buildFailureMemoryContext({
                turnId: primaryRun.turnId,
                runId: resumeRun.id,
                userInput: consumed.latestUserMessage,
                finalOutput: '',
                steps: partialSteps,
            }),
        });
        if (result) {
            deps.host.emitAgentRunComplete(resumeInput.sessionId, result);
        }
        return result;
    }
    finally {
        scope.endRun(resumeRun.id);
        deps.sse.clearThinkBuffer(resumeInput.sessionId, resumeRun.id);
        deps.assistantArtifact.clear(resumeInput.sessionId, resumeRun.id);
    }
}
exports.runWriteConfirmResume = runWriteConfirmResume;
function buildWriteConfirmResumeDeps(host, services) {
    return Object.assign({ host }, services);
}
exports.buildWriteConfirmResumeDeps = buildWriteConfirmResumeDeps;
//# sourceMappingURL=run-write-confirm-resume.util.js.map