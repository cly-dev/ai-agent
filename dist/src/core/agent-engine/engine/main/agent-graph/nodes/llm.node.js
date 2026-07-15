"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLlmNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const agent_run_user_messages_util_1 = require("../../../agent-run-user-messages.util");
const graph_tool_observations_util_1 = require("../../../graph-tool-observations.util");
const llm_output_sanitize_util_1 = require("../../../llm-output-sanitize.util");
const llm_prompt_debug_util_1 = require("../../../llm-prompt-debug.util");
const run_metrics_util_1 = require("../../../run-metrics.util");
const turn_respond_util_1 = require("../../../turn/turn-respond.util");
const plan_tool_candidates_util_1 = require("../../plan/plan-tool-candidates.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const agent_run_audit_util_1 = require("../../run/agent-run-audit.util");
const workflow_run_util_1 = require("../../../../../workflow/workflow-run.util");
const host_tool_plan_util_1 = require("../../host-tool/host-tool-plan.util");
const plan_draft_reply_util_1 = require("../../plan-present/plan-draft-reply.util");
const plan_host_fill_util_1 = require("../../plan-present/plan-host-fill.util");
const turn_execution_contract_util_1 = require("../../../turn/turn-execution-contract.util");
const plan_draft_summarize_util_1 = require("../../plan-present/plan-draft-summarize.util");
const plan_compose_write_util_1 = require("../../plan-present/plan-compose-write.util");
const plan_observation_scope_util_1 = require("../../plan/plan-observation-scope.util");
const plan_summarize_gate_util_1 = require("../../plan/plan-summarize-gate.util");
const task_plan_util_1 = require("../../plan/task-plan.util");
const workflow_graph_routing_util_1 = require("../../../../../workflow/workflow-graph-routing.util");
const workflow_plan_transition_util_1 = require("../../../../../workflow/workflow-plan-transition.util");
const turn_execution_contract_util_2 = require("../../../turn/turn-execution-contract.util");
function resolveCurrentWorkflowNodeAction(state) {
    var _a, _b, _c;
    return ((_c = (_b = (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(state.workflowNodeDefs, (_a = state.workflowRun) === null || _a === void 0 ? void 0 : _a.currentNodeId)) === null || _b === void 0 ? void 0 : _b.action) !== null && _c !== void 0 ? _c : null);
}
function createLlmNode(bundle) {
    const { deps, ctx, runHelpers, skillFrame, hostToolHandle, decision, summarize, } = bundle;
    return async (state) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
        const prepared = await skillFrame.prepareReActPlanState(state);
        const graphState = skillFrame.withPlanSyncStep(prepared.state, prepared.planAdvance, prepared.fromStepId, 'llm');
        if ((0, turn_respond_util_1.hasPendingRespond)(graphState.pendingRespond)) {
            return graphState;
        }
        if (!graphState.skillApplied &&
            graphState.toolObservations.length === 0 &&
            graphState.pendingToolCalls.length === 0 &&
            !runHelpers.isIntentMatched(graphState)) {
            return runHelpers.buildTurnRespondState(graphState, graphState.steps, {
                kind: 'unsupported_scope',
                userMessage: ctx.input.latestUserMessage,
            });
        }
        const graphStateForLlm = graphState;
        const observationSplit = (0, graph_tool_observations_util_1.splitToolObservationsFromState)(graphStateForLlm);
        const observationsForLlm = (0, graph_tool_observations_util_1.allToolObservations)(graphStateForLlm);
        const observationBuckets = (0, plan_observation_scope_util_1.planObservationBucketsFromState)(graphStateForLlm);
        const observationsForPlanSatisfaction = (0, plan_observation_scope_util_1.selectObservationsForPlanToolSatisfaction)(observationBuckets);
        const planAnswerStep = (0, task_plan_util_1.isPendingPlanAnswerStep)(graphStateForLlm.taskPlan, graphStateForLlm.workflowRun, graphStateForLlm.workflowNodeDefs);
        if (planAnswerStep) {
            const summarizeGate = (0, plan_summarize_gate_util_1.assessPlanSummarizeGate)({
                plan: graphStateForLlm.taskPlan,
                observationBuckets: observationBuckets,
                scopedTools: graphStateForLlm.scopedTools,
                workflowRun: graphStateForLlm.workflowRun,
                workflowNodeDefs: graphStateForLlm.workflowNodeDefs,
            });
            if (summarizeGate.status === 'rewind_gather') {
                return (0, plan_summarize_gate_util_1.applyPlanSummarizeRewind)(graphStateForLlm, summarizeGate);
            }
            if (summarizeGate.status === 'allowed') {
                deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, '正在按任务计划生成结果…\n', 'delta');
                return Object.assign(Object.assign({}, graphStateForLlm), { pendingRespond: (0, turn_respond_util_1.pendingRespondFromObservation)((0, task_plan_util_1.buildPlanSummarizeObservation)({
                        userMessage: ctx.input.latestUserMessage,
                        summarizeObservation: summarize.buildSummarizeObservationFromState(graphStateForLlm, {
                            taskPlan: graphStateForLlm.taskPlan,
                            scopedTools: graphStateForLlm.scopedTools,
                        }),
                    })) });
            }
        }
        const llmStepNumber = (0, agent_run_steps_util_1.nextRunStepNumber)(graphStateForLlm.steps);
        const nextIteration = graphStateForLlm.iteration + 1;
        const pendingToolStepEarly = (0, task_plan_util_1.getPendingPlanToolStep)(graphStateForLlm.taskPlan, graphStateForLlm.workflowRun);
        const workflowNodeAction = resolveCurrentWorkflowNodeAction(graphStateForLlm);
        if ((0, task_plan_util_1.isPlanWriteExecutionStep)(pendingToolStepEarly, workflowNodeAction)) {
            const reuse = (0, plan_draft_summarize_util_1.resolvePendingWriteForPlanWriteStepResult)({
                observations: (0, graph_tool_observations_util_1.allToolObservations)(graphStateForLlm),
                taskPlan: graphStateForLlm.taskPlan,
                scopedTools: graphStateForLlm.scopedTools,
                pageContext: (_a = graphStateForLlm.pageContext) !== null && _a !== void 0 ? _a : null,
            });
            if (reuse.call) {
                deps.logger.log(`write fallback: reuse plan_compose_write pending call runId=${ctx.input.runId} tool=${reuse.call.name} source=${(_b = reuse.source) !== null && _b !== void 0 ? _b : 'unknown'}`);
                return Object.assign(Object.assign({}, graphStateForLlm), { iteration: nextIteration, pendingToolCalls: [reuse.call], pendingRespond: null });
            }
            const diagnosticDetail = reuse.gateDiagnostic
                ? (0, plan_draft_summarize_util_1.formatComposedWriteGateDiagnosticForLog)({
                    call: reuse.call,
                    failureReason: reuse.failureReason,
                    diagnostic: reuse.gateDiagnostic,
                })
                : `failureReason=${(_c = reuse.failureReason) !== null && _c !== void 0 ? _c : 'none'}`;
            deps.logger.warn(`write fallback: compose reuse failed runId=${ctx.input.runId} step=${(_d = pendingToolStepEarly === null || pendingToolStepEarly === void 0 ? void 0 : pendingToolStepEarly.id) !== null && _d !== void 0 ? _d : 'unknown'} source=${(_e = reuse.source) !== null && _e !== void 0 ? _e : 'none'} ${diagnosticDetail}`);
        }
        try {
            const pendingHostStep = (0, task_plan_util_1.getPendingPlanHostToolStep)(graphStateForLlm.taskPlan, graphStateForLlm.workflowRun);
            const pendingToolStep = (0, task_plan_util_1.getPendingPlanToolStep)(graphStateForLlm.taskPlan, graphStateForLlm.workflowRun);
            const decisionEnableToolCall = ctx.input.enableToolCall && !planAnswerStep;
            const candidateResolve = (0, plan_tool_candidates_util_1.resolvePlanStepToolCandidatesFromState)(graphStateForLlm);
            let toolsForPrompt = candidateResolve.candidates;
            const hostToolsForPrompt = (0, host_tool_plan_util_1.filterHostToolsForPlanStep)((_f = graphStateForLlm.scopedHostTools) !== null && _f !== void 0 ? _f : [], graphStateForLlm.taskPlan, {
                workflowRun: graphStateForLlm.workflowRun,
                workflowNodeDefs: graphStateForLlm.workflowNodeDefs,
            });
            let candidateRecallLangChainTools = null;
            let candidateRecallStep = null;
            const beforeStructuralResolve = toolsForPrompt.length;
            if ((pendingToolStep === null || pendingToolStep === void 0 ? void 0 : pendingToolStep.kind) === 'tool' && beforeStructuralResolve > 1) {
                const scoped = await deps.sessionScope.scopeToolsForMainLoop(toolsForPrompt, ctx.input.latestUserMessage, ctx.input.toolBuildCtx);
                if (scoped.scopedTools.length > 0) {
                    toolsForPrompt = scoped.scopedTools;
                }
                if (scoped.scopedLangChainTools.length > 0) {
                    candidateRecallLangChainTools = scoped.scopedLangChainTools;
                }
                candidateRecallStep = {
                    step: llmStepNumber,
                    type: 'intent',
                    output: runHelpers.normalizeJsonLike({
                        stage: 'candidate_recall',
                        domain: 'tool',
                        strategy: candidateResolve.strategy,
                        beforeStructuralResolve,
                        afterStructuralResolve: beforeStructuralResolve,
                        afterRecall: toolsForPrompt.length,
                        bindToolsCap: scoped.bindCap,
                        fallbackReason: scoped.fallbackReason,
                        planStepId: (_h = (_g = graphStateForLlm.taskPlan) === null || _g === void 0 ? void 0 : _g.currentStepId) !== null && _h !== void 0 ? _h : null,
                    }),
                };
            }
            const allowedDecisionToolNames = new Set(toolsForPrompt.map((tool) => tool.name));
            const allowedHostToolNames = new Set(hostToolsForPrompt.map((tool) => tool.name));
            if (pendingHostStep) {
                const preSkipState = hostToolHandle.handleHostToolPreLlmSkip({
                    graphState: graphStateForLlm,
                    pendingHostStep,
                    hostToolsForPrompt,
                    llmStepNumber,
                    nextIteration,
                });
                if (preSkipState) {
                    return preSkipState;
                }
            }
            if (pendingHostStep &&
                hostToolsForPrompt.length > 0 &&
                graphStateForLlm.taskPlan) {
                const contract = (0, turn_execution_contract_util_1.resolveTurnExecutionContract)(graphStateForLlm, undefined, deps.logger);
                const canAutoDispatch = contract.plan.allowHostToolAutoDispatch &&
                    (0, plan_host_fill_util_1.hasPlanHostFillForDispatch)({
                        taskPlan: graphStateForLlm.taskPlan,
                        observations: observationsForLlm,
                        pendingHostStep,
                        hostToolsForPrompt,
                    });
                if (canAutoDispatch) {
                    const dispatched = hostToolHandle.tryDispatchHostToolFromPlanDraft({
                        graphState: graphStateForLlm,
                        pendingHostStep,
                        hostToolsForPrompt,
                        observationsForLlm,
                        llmStepNumber,
                        nextIteration,
                        steps: graphStateForLlm.steps,
                    });
                    if (dispatched) {
                        return dispatched;
                    }
                }
            }
            let langChainToolsForDecision = [];
            if (!planAnswerStep) {
                if (pendingHostStep) {
                    langChainToolsForDecision = ((_j = graphStateForLlm.scopedHostLangChainTools) !== null && _j !== void 0 ? _j : []).filter((tool) => allowedHostToolNames.has(tool.name));
                }
                else {
                    langChainToolsForDecision =
                        candidateRecallLangChainTools !== null && candidateRecallLangChainTools !== void 0 ? candidateRecallLangChainTools : graphStateForLlm.scopedLangChainTools.filter((tool) => allowedDecisionToolNames.has(tool.name));
                    if (langChainToolsForDecision.length === 0 &&
                        toolsForPrompt.length > 0) {
                        deps.logger.warn(`llm tool decision bind mismatch runId=${ctx.input.runId} candidates=${toolsForPrompt.length} bound=0 planStep=${(_k = pendingToolStep === null || pendingToolStep === void 0 ? void 0 : pendingToolStep.id) !== null && _k !== void 0 ? _k : 'none'}`);
                    }
                }
            }
            const decisionResult = await decision.buildDecisionPrompt(ctx.input.promptMessages, toolsForPrompt, observationSplit, decisionEnableToolCall, ctx.promptScope, graphStateForLlm.activeSkillPrompt, graphStateForLlm.taskPlan, hostToolsForPrompt);
            const { messages: invokeMessages, trimMeta } = decision.buildLlmInvokeMessages(ctx.input.promptMessages, observationSplit, ctx.input.latestUserMessage, decisionResult.toolSchemaJson, decisionResult.hostToolSchemaJson, decisionResult.toolDecisionPrompt, ctx.input.messageTokenBudget, graphStateForLlm.taskPlan, ((_l = graphStateForLlm.workflowRun) === null || _l === void 0 ? void 0 : _l.status) === 'running'
                ? graphStateForLlm.workflowNodeOutputs
                : undefined);
            const llmStartedAt = Date.now();
            const fitted = await deps.llmService.fitMessagesToBudget(invokeMessages.map((message) => ({
                role: message.role,
                content: message.content,
                toolCallId: message.toolCallId,
            })), {
                callKind: 'decision',
                sessionId: ctx.input.sessionId,
                runId: ctx.input.runId,
                phase: 'decision',
            }, ctx.input.messageTokenBudget);
            const fittedMessages = fitted.messages;
            trimMeta.estimatedTokensAfter = fitted.report.tokensAfter;
            trimMeta.trimmed = fitted.report.degradations.length > 0;
            trimMeta.truncatedMessageIndexes = [
                ...new Set(fitted.report.degradations.map((row) => row.sourceMessageIndex)),
            ].sort((left, right) => left - right);
            const promptDebugFile = (0, llm_prompt_debug_util_1.emitLlmPromptDebug)((message) => deps.logger.log(message), {
                runId: ctx.input.runId,
                sessionId: ctx.input.sessionId,
                phase: 'decision',
                step: llmStepNumber,
                iteration: graphStateForLlm.iteration,
                messageTokenBudget: ctx.input.messageTokenBudget,
                meta: {
                    enableToolCall: decisionEnableToolCall,
                    scopedToolCount: graphStateForLlm.scopedTools.length,
                    decisionToolCount: toolsForPrompt.length,
                    planAnswerStep: planAnswerStep,
                    planToolRoleFilter: (_o = (_m = (0, task_plan_util_1.getPendingPlanToolStep)(graphStateForLlm.taskPlan, graphStateForLlm.workflowRun)) === null || _m === void 0 ? void 0 : _m.toolRole) !== null && _o !== void 0 ? _o : null,
                    observationCount: observationsForLlm.length,
                    estimatedTokens: trimMeta.estimatedTokensAfter,
                    promptBudgetFitted: fitted.report.fitted,
                    promptBudgetDegradations: fitted.report.degradations.length,
                    taskPlanStep: (_q = (_p = graphStateForLlm.taskPlan) === null || _p === void 0 ? void 0 : _p.currentStepId) !== null && _q !== void 0 ? _q : null,
                    taskPlanPhase: (_s = (_r = graphStateForLlm.taskPlan) === null || _r === void 0 ? void 0 : _r.taskPhase) !== null && _s !== void 0 ? _s : null,
                    currentObjective: (_u = (_t = graphStateForLlm.taskPlan) === null || _t === void 0 ? void 0 : _t.currentObjective) !== null && _u !== void 0 ? _u : null,
                },
                messages: fittedMessages,
            });
            if (promptDebugFile) {
                deps.logger.log(`LLM decision prompt file runId=${ctx.input.runId} step=${llmStepNumber} path=${promptDebugFile}`);
            }
            else if ((0, llm_prompt_debug_util_1.isLlmPromptDebugEnabled)()) {
                deps.logger.warn(`LLM decision prompt debug file write failed runId=${ctx.input.runId} step=${llmStepNumber}`);
            }
            const langChainInvokeMessages = fittedMessages.map((message) => decision.toLangChainInvokeMessage(message));
            const { model } = await deps.llmService.createLangChainChatModelForMessages(fittedMessages, {
                messageTokenBudget: ctx.input.messageTokenBudget,
                budgetHints: {
                    skipFit: true,
                    callKind: 'decision',
                    sessionId: ctx.input.sessionId,
                    runId: ctx.input.runId,
                    phase: 'decision',
                },
            });
            const runnable = decisionEnableToolCall
                ? model.bindTools(langChainToolsForDecision)
                : model.bindTools([]);
            const aiMessage = await deps.sse.streamRunnableMessages(runnable, langChainInvokeMessages, ctx.input.sessionId, ctx.input.runId, ctx.input.abortSignal);
            const responseMeta = aiMessage.response_metadata;
            const toolCalls = decisionEnableToolCall
                ? decision.extractToolCalls(aiMessage)
                : [];
            const llmText = (0, llm_output_sanitize_util_1.extractLlmUserFacingText)(decision.extractAiMessageText(aiMessage));
            (0, run_metrics_util_1.recordLlmUsage)(ctx.input.runMetrics, {
                messages: invokeMessages.map((message) => ({
                    role: message.role,
                    content: message.content,
                })),
                outputText: llmText,
                durationMs: Date.now() - llmStartedAt,
                model: typeof (responseMeta === null || responseMeta === void 0 ? void 0 : responseMeta.model_name) === 'string'
                    ? responseMeta.model_name
                    : undefined,
                responseMeta,
            });
            const steps = [
                ...graphStateForLlm.steps,
                ...(candidateRecallStep ? [candidateRecallStep] : []),
                (0, agent_run_audit_util_1.maybeTagWorkflowReactInternalStep)({
                    step: candidateRecallStep ? llmStepNumber + 1 : llmStepNumber,
                    type: 'llm',
                    output: runHelpers.normalizeJsonLike({
                        content: llmText,
                        toolCalls,
                        taskPlanTrace: decision.buildTaskPlanTraceForLlmStep(graphStateForLlm.taskPlan),
                    }),
                    meta: {
                        model: typeof (responseMeta === null || responseMeta === void 0 ? void 0 : responseMeta.model_name) === 'string'
                            ? responseMeta.model_name
                            : undefined,
                        prompt: decisionResult.toolDecisionPrompt,
                        toolSchema: decisionResult.toolSchemaJson,
                        observations: decisionResult.observationsJson,
                        agentPrompt: (_v = decisionResult.agentPrompt) !== null && _v !== void 0 ? _v : undefined,
                        userRequest: (_x = (_w = graphStateForLlm.taskPlan) === null || _w === void 0 ? void 0 : _w.currentObjective) !== null && _x !== void 0 ? _x : ctx.input.latestUserMessage,
                    },
                }, graphStateForLlm),
            ];
            await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
            const { httpCalls, hostCalls } = (0, host_tool_plan_util_1.partitionDecisionToolCalls)(toolCalls, pendingHostStep, allowedHostToolNames);
            const hostToolOutcome = hostToolHandle.processHostToolAfterLlmDecision({
                graphState: graphStateForLlm,
                pendingHostStep,
                hostToolsForPrompt,
                observationsForLlm,
                llmStepNumber,
                nextIteration,
                steps,
                httpCalls,
                hostCalls,
                toolCallsFromLlm: toolCalls,
            });
            if (hostToolOutcome.kind === 'state') {
                return hostToolOutcome.state;
            }
            const httpToolCalls = httpCalls;
            const pageContextEntityId = (0, turn_execution_contract_util_2.pageContextEntityIdFromGraphState)(graphStateForLlm);
            if (httpToolCalls.length === 0 && hostCalls.length === 0) {
                const planRequiresToolCall = (pendingToolStep === null || pendingToolStep === void 0 ? void 0 : pendingToolStep.kind) === 'tool' &&
                    !(0, task_plan_util_1.isPlanToolStepSatisfiedByObservations)({
                        step: pendingToolStep,
                        observations: observationsForPlanSatisfaction,
                        scopedTools: graphStateForLlm.scopedTools,
                        taskPlan: graphStateForLlm.taskPlan,
                        skillConfig: graphStateForLlm.activeSkillConfig,
                        purpose: 'pre_tools_advance',
                        pageContextEntityId,
                    });
                if (planRequiresToolCall) {
                    if (!llmText) {
                        deps.logger.warn(`llm plan tool step skipped without toolCalls runId=${ctx.input.runId} step=${llmStepNumber} planStep=${pendingToolStep.id}`);
                    }
                    return Object.assign(Object.assign({}, graphStateForLlm), { iteration: nextIteration, steps, pendingToolCalls: [], pendingRespond: null });
                }
                if (graphStateForLlm.taskPlan &&
                    (pendingToolStep === null || pendingToolStep === void 0 ? void 0 : pendingToolStep.kind) === 'tool' &&
                    (0, task_plan_util_1.isPlanToolStepSatisfiedByObservations)({
                        step: pendingToolStep,
                        observations: observationsForPlanSatisfaction,
                        scopedTools: graphStateForLlm.scopedTools,
                        taskPlan: graphStateForLlm.taskPlan,
                        skillConfig: graphStateForLlm.activeSkillConfig,
                        purpose: 'pre_tools_advance',
                        pageContextEntityId,
                    })) {
                    return Object.assign(Object.assign({}, graphStateForLlm), { iteration: nextIteration, steps, pendingToolCalls: [], pendingRespond: null });
                }
                const emptyReply = '我这次没有拿到有效结果，请你换个问法，或补充更具体的条件后我再试一次。';
                if (!llmText) {
                    deps.logger.warn(`llm returned empty content and no toolCalls runId=${ctx.input.runId} step=${llmStepNumber} model=${typeof (responseMeta === null || responseMeta === void 0 ? void 0 : responseMeta.model_name) === 'string'
                        ? responseMeta.model_name
                        : 'unknown'}`);
                }
                const completion = summarize.resolveLlmCompletionAfterTools(ctx.input.latestUserMessage, llmText || emptyReply, graphStateForLlm, {
                    taskPlan: graphStateForLlm.taskPlan,
                    scopedTools: graphStateForLlm.scopedTools,
                });
                return Object.assign(Object.assign({}, graphStateForLlm), { iteration: nextIteration, steps, pendingToolCalls: [], pendingRespond: (0, turn_respond_util_1.pendingRespondFromObservation)((_y = completion === null || completion === void 0 ? void 0 : completion.observation) !== null && _y !== void 0 ? _y : summarize.buildDirectReplyObservation(ctx.input.latestUserMessage, emptyReply)) });
            }
            if ((0, task_plan_util_1.isComposeMutationParameterStep)(pendingToolStep, workflowNodeAction) &&
                graphStateForLlm.taskPlan) {
                const intercept = (0, plan_compose_write_util_1.tryInterceptComposeMutationToolCalls)({
                    toolCalls: httpToolCalls,
                    taskPlan: graphStateForLlm.taskPlan,
                    scopedTools: graphStateForLlm.scopedTools,
                    observations: (0, graph_tool_observations_util_1.allToolObservations)(graphStateForLlm),
                    pageContext: (_z = graphStateForLlm.pageContext) !== null && _z !== void 0 ? _z : null,
                    planStepId: pendingToolStep.id,
                    workflowRun: graphStateForLlm.workflowRun,
                    workflowNodeDefs: graphStateForLlm.workflowNodeDefs,
                });
                if (intercept.kind === 'applied') {
                    const preparedCall = intercept.preparedCall;
                    const composeObs = intercept.composeObservation;
                    const pageContextEntityId = typeof ((_1 = (_0 = graphStateForLlm.pageContext) === null || _0 === void 0 ? void 0 : _0.entity) === null || _1 === void 0 ? void 0 : _1.id) === 'string'
                        ? graphStateForLlm.pageContext.entity.id.trim() || null
                        : null;
                    const pageContextEntityType = typeof ((_3 = (_2 = graphStateForLlm.pageContext) === null || _2 === void 0 ? void 0 : _2.entity) === null || _3 === void 0 ? void 0 : _3.type) === 'string'
                        ? graphStateForLlm.pageContext.entity.type.trim() || null
                        : null;
                    deps.logger.log(`compose_write observation stored runId=${ctx.input.runId} tool=${preparedCall.name} planStep=${pendingToolStep.id} pageContextEntityType=${pageContextEntityType !== null && pageContextEntityType !== void 0 ? pageContextEntityType : 'null'} pageContextEntityId=${pageContextEntityId !== null && pageContextEntityId !== void 0 ? pageContextEntityId : 'null'} llmArgs=${(0, plan_draft_summarize_util_1.summarizeWriteArgsForGateLog)(preparedCall.arguments)} preparedArgs=${(0, plan_draft_summarize_util_1.summarizeWriteArgsForGateLog)(preparedCall.arguments)}`);
                    const progressed = (0, workflow_plan_transition_util_1.applyComposeMutationProgress)({
                        taskPlan: graphStateForLlm.taskPlan,
                        workflowRun: graphStateForLlm.workflowRun,
                        workflowNodeDefs: graphStateForLlm.workflowNodeDefs,
                        workflowAwaitingReact: graphStateForLlm.workflowAwaitingReact,
                        planStepId: pendingToolStep.id,
                        composeObservation: composeObs,
                    });
                    const toolObservations = [
                        ...graphStateForLlm.toolObservations,
                        composeObs,
                    ];
                    deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, '参数已生成，正在整理写操作草稿…\n', 'delta');
                    return Object.assign(Object.assign({}, graphStateForLlm), { iteration: nextIteration, steps,
                        toolObservations, taskPlan: progressed.taskPlan, workflowRun: (_4 = progressed.workflowRun) !== null && _4 !== void 0 ? _4 : graphStateForLlm.workflowRun, workflowAwaitingReact: (_5 = progressed.workflowAwaitingReact) !== null && _5 !== void 0 ? _5 : graphStateForLlm.workflowAwaitingReact, pendingToolCalls: [], pendingRespond: (0, turn_respond_util_1.pendingRespondFromObservation)((0, task_plan_util_1.buildPlanSummarizeObservation)({
                            userMessage: ctx.input.latestUserMessage,
                            summarizeObservation: summarize.buildSummarizeObservationFromState({
                                preloadedToolObservations: graphStateForLlm.preloadedToolObservations,
                                toolObservations,
                            }, {
                                taskPlan: progressed.taskPlan,
                                scopedTools: graphStateForLlm.scopedTools,
                            }),
                        })) });
                }
                if (intercept.kind === 'no_allowed_call') {
                    deps.logger.warn(`compose_write step: no allowed write tool in tool_calls runId=${ctx.input.runId} count=${httpToolCalls.length}`);
                    return Object.assign(Object.assign({}, graphStateForLlm), { iteration: nextIteration, steps, pendingToolCalls: [], pendingRespond: null });
                }
            }
            return Object.assign(Object.assign({}, graphStateForLlm), { iteration: nextIteration, steps, pendingToolCalls: (0, plan_draft_reply_util_1.applyPlanDraftToWriteToolCalls)(httpToolCalls, graphStateForLlm.taskPlan, graphStateForLlm.scopedTools, (0, plan_draft_reply_util_1.resolvePlanSubmitTextForWrite)({
                    observations: (0, graph_tool_observations_util_1.allToolObservations)(graphStateForLlm),
                    artifactBlocks: (_6 = deps.assistantArtifact.peekBlocks(ctx.input.sessionId, ctx.input.runId)) !== null && _6 !== void 0 ? _6 : null,
                    scopedTools: graphStateForLlm.scopedTools,
                })) });
        }
        catch (error) {
            const userMessage = (0, agent_run_user_messages_util_1.buildLlmFailureUserMessage)(error);
            const code = (0, agent_run_user_messages_util_1.resolveLlmFailureCode)(error);
            const failedLlmStepNumber = (0, agent_run_steps_util_1.nextRunStepNumber)(graphState.steps);
            deps.logger.warn(`llm node failed runId=${ctx.input.runId} step=${failedLlmStepNumber}: ${error instanceof Error ? error.message : String(error)}`);
            const steps = [
                ...graphState.steps,
                graphState.workflowAwaitingReact === true
                    ? {
                        step: failedLlmStepNumber,
                        type: 'llm',
                        output: runHelpers.normalizeJsonLike({
                            error: true,
                            content: userMessage,
                        }),
                        meta: { code },
                    }
                    : (0, agent_run_audit_util_1.maybeTagWorkflowReactInternalStep)({
                        step: failedLlmStepNumber,
                        type: 'llm',
                        output: runHelpers.normalizeJsonLike({
                            error: true,
                            content: userMessage,
                        }),
                        meta: { code },
                    }, graphState),
            ];
            await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.success);
            (0, run_metrics_util_1.recordMachineCodeUsage)(ctx.input.runMetrics, code);
            const failedWorkflowRun = graphState.workflowAwaitingReact === true &&
                ((_7 = graphState.workflowRun) === null || _7 === void 0 ? void 0 : _7.currentNodeId)
                ? (0, workflow_run_util_1.failWorkflowNode)(graphState.workflowRun, graphState.workflowRun.currentNodeId, {
                    code,
                    message: userMessage,
                })
                : graphState.workflowRun;
            return Object.assign(Object.assign({}, graphState), { iteration: graphState.iteration + 1, steps, workflowRun: failedWorkflowRun, workflowAwaitingReact: false, pendingToolCalls: [], pendingRespond: (0, turn_respond_util_1.pendingRespondFromObservation)(summarize.buildDirectReplyObservation(ctx.input.latestUserMessage, userMessage)) });
        }
    };
}
exports.createLlmNode = createLlmNode;
//# sourceMappingURL=llm.node.js.map