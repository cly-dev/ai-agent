"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWriteGateRetry = void 0;
const client_1 = require("../../../../../generated/prisma/client");
const host_bridge_1 = require("../../../host-bridge");
const workflow_resume_util_1 = require("../../../workflow/workflow-resume.util");
const workflow_debug_util_1 = require("../../../workflow/trace/workflow-debug.util");
const agent_write_confirmation_util_1 = require("../agent-write-confirmation.util");
const run_metrics_util_1 = require("../run-metrics.util");
const agent_tool_runtime_util_1 = require("../main/runtime/agent-tool-runtime.util");
const agent_run_steps_util_1 = require("../main/run/agent-run-steps.util");
const run_aborted_error_1 = require("../../../session-run/run-aborted.error");
const draft_review_1 = require("../../../draft-review");
function buildChatWriteConfirmRetryRunStep(stepNumber, input) {
    var _a;
    return {
        step: stepNumber,
        type: 'write_confirmation_gate',
        output: {
            status: 'retry_requested',
            auditPhase: 'draft_retry',
            primaryRunId: input.primaryRunId,
            decidedByUserId: input.decidedByUserId,
            retryInstruction: input.retryInstruction,
            nodeId: (_a = input.nodeId) !== null && _a !== void 0 ? _a : null,
        },
    };
}
async function runWriteGateRetry(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const { resumeInput, prepared, scope, deps, decision } = input;
    const { session, consumed, primaryRun, suspendedPrimaryRunId } = prepared;
    const retryInstruction = (_b = (_a = decision.retryInstruction) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    if (!retryInstruction) {
        deps.host.emitWriteConfirmationExpired(resumeInput.sessionId);
        return null;
    }
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
    const retryUserMessage = (0, draft_review_1.buildRetryUserMessage)({
        baseUserMessage: consumed.latestUserMessage,
        retryInstruction,
    });
    const resumePageContext = (0, host_bridge_1.coalescePageContext)(resumeInput.pageContext, consumed.resumeContext.pageContext, goaPayload.lastPageContext);
    if (resumeInput.pageContext) {
        await deps.goaService.syncHostPageContext(resumeInput.sessionId, resumeInput.pageContext);
    }
    const prompt = await deps.promptComposer.compose({
        userId: resumeInput.userId,
        sessionId: resumeInput.sessionId,
        latestUserMessage: retryUserMessage,
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
        priorObservations = deps.goaService
            .buildPriorToolObservationsForGraph(goaPayload)
            .map((row) => ({
            name: row.name,
            output: row.output,
        }));
    }
    const priorSteps = ((_c = consumed.resumeContext.steps) !== null && _c !== void 0 ? _c : []);
    const retryAuditStep = buildChatWriteConfirmRetryRunStep(priorSteps.length > 0 ? (0, agent_run_steps_util_1.maxRunStepNumber)(priorSteps) + 1 : 1, {
        primaryRunId: suspendedPrimaryRunId,
        decidedByUserId: resumeInput.userId,
        retryInstruction,
        nodeId: (_e = (_d = consumed.resumeContext.workflowRun) === null || _d === void 0 ? void 0 : _d.currentNodeId) !== null && _e !== void 0 ? _e : null,
    });
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
            input: retryUserMessage,
            status: client_1.AgentRunStatus.running,
            steps: [],
            currentStep: 0,
            maxSteps: agent.maxSteps,
            startedAt,
        },
    });
    scope.startRun(resumeRun.id, primaryRun.turnId);
    scope.assertActive(resumeRun.id);
    await deps.lifecycle.updateRun(resumeRun.id, [retryAuditStep], client_1.AgentRunStatus.running);
    let workflowRun = (_f = consumed.resumeContext.workflowRun) !== null && _f !== void 0 ? _f : null;
    let workflowNodeOutputs = (_g = consumed.resumeContext.workflowNodeOutputs) !== null && _g !== void 0 ? _g : {};
    const workflowNodeDefs = consumed.resumeContext.workflowNodeDefs;
    if (workflowRun && (workflowNodeDefs === null || workflowNodeDefs === void 0 ? void 0 : workflowNodeDefs.length)) {
        const rewind = (0, draft_review_1.rewindWorkflowForDraftRetry)({
            workflowRun,
            workflowNodeDefs,
            nodeOutputs: workflowNodeOutputs,
        });
        workflowRun = rewind.workflowRun;
        workflowNodeOutputs = (0, draft_review_1.stripNodeOutputsForRetry)(workflowNodeOutputs, rewind.clearedOutputKeys);
        (0, workflow_debug_util_1.logWorkflowDebug)('write_gate_retry_rewind', {
            runId: resumeRun.id,
            sessionId: resumeInput.sessionId,
            retryNodeId: rewind.retryNodeId,
            workflowRun,
        });
    }
    let taskPlan = (_h = consumed.resumeContext.taskPlan) !== null && _h !== void 0 ? _h : null;
    if (taskPlan && (workflowNodeDefs === null || workflowNodeDefs === void 0 ? void 0 : workflowNodeDefs.length)) {
        taskPlan =
            (_j = (0, workflow_resume_util_1.hydrateTaskPlanWithWorkflowDefs)({
                taskPlan,
                workflowNodeDefs,
            })) !== null && _j !== void 0 ? _j : taskPlan;
    }
    const runMetrics = (0, run_metrics_util_1.createRunMetricsAccumulator)();
    deps.assistantArtifact.reset(resumeInput.sessionId, resumeRun.id, primaryRun.turnId);
    deps.sse.clearThinkBuffer(resumeInput.sessionId, resumeRun.id);
    scope.assertActive(resumeRun.id);
    const graphInitialState = Object.assign({ iteration: consumed.resumeContext.iteration, steps: [...priorSteps, retryAuditStep], preloadedToolObservations: priorObservations, toolObservations: [], pendingToolCalls: [], pendingRespond: null, lastToolRoundMeta: null, intentKind: consumed.resumeContext.intentKind, scopedTools: resolvedScopedTools, scopedLangChainTools: scopedToolBundle.tools, scopedToolBundle,
        scopedAllowedToolIds,
        toolProfilesByName, hasExpandedOnce: consumed.resumeContext.hasExpandedOnce, skillApplied: consumed.resumeContext.skillApplied === true, activeSkillId: (_k = consumed.resumeContext.activeSkillId) !== null && _k !== void 0 ? _k : null, activeSkillPrompt: (_l = consumed.resumeContext.activeSkillPrompt) !== null && _l !== void 0 ? _l : null, activeSkillName: (_m = consumed.resumeContext.activeSkillName) !== null && _m !== void 0 ? _m : null, activeSkillDescription: (_o = consumed.resumeContext.activeSkillDescription) !== null && _o !== void 0 ? _o : null, activeSkillConfig: (_p = consumed.resumeContext.activeSkillConfig) !== null && _p !== void 0 ? _p : null, activeSkillRiskLevel: (_q = consumed.resumeContext.activeSkillRiskLevel) !== null && _q !== void 0 ? _q : null, taskPlan, pagedListHttpUsed: (_r = consumed.resumeContext.pagedListHttpUsed) !== null && _r !== void 0 ? _r : 0, confirmedPreviewSerialized: null, pageContext: resumePageContext, draftRetryCount: (_s = consumed.resumeContext.draftRetryCount) !== null && _s !== void 0 ? _s : 0, planRunContext: 'resume' }, (workflowRun
        ? {
            workflowRun,
            workflowNodeDefs,
            workflowNodeOutputs,
            workflowAwaitingReact: false,
        }
        : {}));
    try {
        scope.assertActive(resumeRun.id);
        const graphState = await deps.langGraphRunner.run({
            promptMessages: prompt.messages,
            latestUserMessage: retryUserMessage,
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
            resumeFromWriteGateRetry: true,
            graphInitialState,
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
            latestUserMessage: retryUserMessage,
            graphState,
            runMetrics,
        });
        await deps.host.emitRunCompletion(resumeInput.sessionId, result, graphState, resumePageContext, { appClientId: session.appClientId, agentId: session.agentId });
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
                userInput: retryUserMessage,
                finalOutput: '',
                steps: partialSteps,
            }),
        });
        if (result) {
            deps.host.emitAgentRunComplete(resumeInput.sessionId, result);
        }
        return result;
    }
}
exports.runWriteGateRetry = runWriteGateRetry;
//# sourceMappingURL=run-write-gate-retry.util.js.map