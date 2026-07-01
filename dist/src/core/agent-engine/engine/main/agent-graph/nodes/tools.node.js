"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToolsNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const write_tool_draft_injection_util_1 = require("../../../../../tool-engine/write-tool-draft-injection.util");
const pagination_1 = require("../../../../../mcp-utils/pagination");
const agent_write_confirmation_util_1 = require("../../../agent-write-confirmation.util");
const plan_paged_gather_util_1 = require("../../../gather/plan-paged-gather.util");
const paged_list_gather_util_1 = require("../../../gather/paged-list-gather.util");
const graph_tool_observations_util_1 = require("../../../graph-tool-observations.util");
const message_blocks_util_1 = require("../../../message/message-blocks.util");
const message_blocks_debug_util_1 = require("../../../message/message-blocks-debug.util");
const mutation_preview_before_gate_util_1 = require("../../../mutation-preview-before-gate.util");
const tool_execution_status_util_1 = require("../../../tool/tool-execution-status.util");
const write_confirmation_gate_util_1 = require("../../../write-confirmation-gate.util");
const agent_tool_runtime_util_1 = require("../../runtime/agent-tool-runtime.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const plan_draft_reply_util_1 = require("../../plan-present/plan-draft-reply.util");
const plan_compose_write_util_1 = require("../../plan-present/plan-compose-write.util");
const task_plan_util_1 = require("../../plan/task-plan.util");
const workflow_plan_transition_util_1 = require("../../../../../workflow/workflow-plan-transition.util");
const workflow_mutation_write_gate_util_1 = require("../../../../../workflow/workflow-mutation-write-gate.util");
const risk_level_util_1 = require("../../../../../risk/risk-level.util");
const workflow_debug_util_1 = require("../../../../../workflow/trace/workflow-debug.util");
function createToolsNode(bundle) {
    const { deps, ctx, runHelpers, summarize } = bundle;
    return async (state) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
        const pagedGatherHttpBudget = {
            used: (_a = state.pagedListHttpUsed) !== null && _a !== void 0 ? _a : 0,
            max: (0, pagination_1.resolveMaxListHttpPerTurn)(),
        };
        const gatherLlm = {
            llmService: deps.llmService,
            promptRegistry: deps.promptRegistry,
            scope: {
                appClientId: ctx.input.appClientId,
                agentId: ctx.input.agentId,
            },
            currentObjective: (_d = (_b = (0, plan_paged_gather_util_1.resolvePagedGatherAnalyzeObjective)(state.taskPlan)) !== null && _b !== void 0 ? _b : (_c = state.taskPlan) === null || _c === void 0 ? void 0 : _c.currentObjective) !== null && _d !== void 0 ? _d : undefined,
            runMetrics: ctx.input.runMetrics,
            runId: ctx.input.runId,
            sessionId: ctx.input.sessionId,
            iteration: state.iteration,
            onDebugLog: (message) => deps.logger.warn(message),
        };
        const langChainBundleForResume = (_e = state.scopedToolBundle) !== null && _e !== void 0 ? _e : deps.toolEngine.buildLangChainTools(state.scopedTools, {
            userId: ctx.input.userId,
            allowedToolIds: state.scopedAllowedToolIds,
        });
        const runRoundForGather = async (toolCalls, observations, steps) => (0, agent_tool_runtime_util_1.executeToolCallsRound)({
            latestUserMessage: ctx.input.latestUserMessage,
            toolCalls,
            scopedTools: state.scopedTools,
            toolProfilesByName: state.toolProfilesByName,
            langChainBundle: langChainBundleForResume,
            toolEngine: deps.toolEngine,
            observations,
            steps,
            iteration: state.iteration,
            assessObservationQuality: (output, agentMetadata) => summarize.assessObservationQuality(output, agentMetadata),
            resolveToolStepCode: (quality, output, agentMetadata) => summarize.resolveToolStepCode(quality, output, agentMetadata),
            runMetrics: ctx.input.runMetrics,
            runId: ctx.input.runId,
            sessionId: ctx.input.sessionId,
            onThink: (message) => deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, message, 'delta'),
            onToolDebugLog: (message) => deps.logger.log(message),
        });
        if (state.pendingToolCalls.length === 0 &&
            (0, paged_list_gather_util_1.shouldResumePagedGather)({
                taskPlan: state.taskPlan,
                scopedTools: state.scopedTools,
                observations: (0, graph_tool_observations_util_1.allToolObservations)(state),
            })) {
            const resumed = await (0, paged_list_gather_util_1.resumeIncompletePagedGather)({
                taskPlan: state.taskPlan,
                scopedTools: state.scopedTools,
                observations: (0, graph_tool_observations_util_1.allToolObservations)(state),
                steps: state.steps,
                runRound: runRoundForGather,
                gatherLlm,
                httpBudget: pagedGatherHttpBudget,
                onProgress: (message) => deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, message, 'delta'),
            });
            if (resumed) {
                const nextSteps = resumed.steps.map((row) => (Object.assign(Object.assign({}, row), { output: runHelpers.normalizeJsonLike(row.output) })));
                await runHelpers.updateRun(ctx.input.runId, nextSteps, client_1.AgentRunStatus.running);
                return Object.assign(Object.assign({}, state), { steps: nextSteps, toolObservations: (0, graph_tool_observations_util_1.mergeRunRoundObservations)(state, resumed.toolObservations), pendingToolCalls: [], pagedListHttpUsed: pagedGatherHttpBudget.used, lastToolRoundMeta: resumed.lastToolRoundMeta });
            }
        }
        if (state.pendingToolCalls.length === 0) {
            return Object.assign(Object.assign({}, state), { lastToolRoundMeta: null, pagedListHttpUsed: pagedGatherHttpBudget.used });
        }
        const pendingToolCalls = (0, plan_draft_reply_util_1.applyPlanDraftToWriteToolCalls)(state.pendingToolCalls, state.taskPlan, state.scopedTools, (0, plan_draft_reply_util_1.resolvePlanSubmitTextForWrite)({
            observations: (0, graph_tool_observations_util_1.allToolObservations)(state),
            artifactBlocks: (_f = deps.assistantArtifact.peekBlocks(ctx.input.sessionId, ctx.input.runId)) !== null && _f !== void 0 ? _f : null,
            scopedTools: state.scopedTools,
        })).map((call) => {
            var _a;
            const def = state.scopedTools.find((tool) => tool.name === call.name);
            if (!def || !(0, tool_execution_status_util_1.isMutationTool)(def.agentMetadata)) {
                return call;
            }
            const isReadToolObservation = (0, plan_compose_write_util_1.buildReadToolObservationMatcher)(state.scopedTools);
            return Object.assign(Object.assign({}, call), { arguments: (0, write_tool_draft_injection_util_1.normalizeWriteToolArguments)(call.arguments, def, (0, graph_tool_observations_util_1.allToolObservations)(state), {
                    isReadToolObservation,
                    pageContext: (_a = state.pageContext) !== null && _a !== void 0 ? _a : null,
                }) });
        });
        const langChainBundle = (_g = state.scopedToolBundle) !== null && _g !== void 0 ? _g : deps.toolEngine.buildLangChainTools(state.scopedTools, {
            userId: ctx.input.userId,
            allowedToolIds: state.scopedAllowedToolIds,
        });
        const runRound = async (toolCalls, observations, steps) => (0, agent_tool_runtime_util_1.executeToolCallsRound)({
            latestUserMessage: ctx.input.latestUserMessage,
            toolCalls,
            scopedTools: state.scopedTools,
            toolProfilesByName: state.toolProfilesByName,
            langChainBundle,
            toolEngine: deps.toolEngine,
            observations,
            steps,
            iteration: state.iteration,
            assessObservationQuality: (output, agentMetadata) => summarize.assessObservationQuality(output, agentMetadata),
            resolveToolStepCode: (quality, output, agentMetadata) => summarize.resolveToolStepCode(quality, output, agentMetadata),
            runMetrics: ctx.input.runMetrics,
            runId: ctx.input.runId,
            sessionId: ctx.input.sessionId,
            onThink: (message) => deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, message, 'delta'),
            onToolDebugLog: (message) => deps.logger.log(message),
        });
        const writePolicy = (0, workflow_mutation_write_gate_util_1.resolveWriteConfirmationPolicy)({
            workflowRun: state.workflowRun,
            workflowNodeDefs: state.workflowNodeDefs,
            taskPlan: state.taskPlan,
            approvedWriteToolNames: ctx.input.approvedWriteToolNames,
        });
        const bypassApprovedNames = writePolicy.kind === 'bypass_after_workflow_await'
            ? state.scopedTools
                .filter((tool) => (0, risk_level_util_1.toolRequiresWriteConfirmation)({
                riskLevel: tool.riskLevel,
                agentMetadata: tool.agentMetadata,
            }))
                .map((tool) => tool.name)
            : ctx.input.approvedWriteToolNames;
        const { safeCalls, writeCallsNeedingConfirm } = (0, write_confirmation_gate_util_1.partitionToolCallsByWriteConfirmation)(pendingToolCalls, state.scopedTools, bypassApprovedNames);
        const writeCallsForGate = (0, write_confirmation_gate_util_1.filterSchemaValidWriteConfirmationCalls)(writeCallsNeedingConfirm, state.scopedTools);
        if (writeCallsNeedingConfirm.length > 0 &&
            writeCallsForGate.length === 0) {
            deps.logger.warn(`write confirmation blocked: pending tool_calls fail schema validation runId=${ctx.input.runId} tools=${writeCallsNeedingConfirm.map((call) => call.name).join(',')}`);
            runHelpers.publishMutationGateBlockedDraft(ctx.input.sessionId, ctx.input.runId, ctx.input.turnId, (0, mutation_preview_before_gate_util_1.buildMutationArgsInvalidUserMessage)());
            return Object.assign(Object.assign({}, state), { pendingToolCalls: [], lastToolRoundMeta: null, pagedListHttpUsed: pagedGatherHttpBudget.used });
        }
        if (writePolicy.kind === 'defer_to_workflow_await' &&
            writeCallsNeedingConfirm.length > 0) {
            const { step: executionStep, workflowNodeAction } = (0, task_plan_util_1.resolvePlanExecutionStep)({
                taskPlan: state.taskPlan,
                workflowRun: state.workflowRun,
                workflowNodeDefs: state.workflowNodeDefs,
            });
            if (state.taskPlan &&
                executionStep &&
                (0, task_plan_util_1.isComposeMutationParameterStep)(executionStep, workflowNodeAction)) {
                const intercept = (0, plan_compose_write_util_1.tryInterceptComposeMutationToolCalls)({
                    toolCalls: pendingToolCalls,
                    taskPlan: state.taskPlan,
                    scopedTools: state.scopedTools,
                    observations: (0, graph_tool_observations_util_1.allToolObservations)(state),
                    pageContext: (_h = state.pageContext) !== null && _h !== void 0 ? _h : null,
                    planStepId: executionStep.id,
                    workflowRun: state.workflowRun,
                    workflowNodeDefs: state.workflowNodeDefs,
                });
                if (intercept.kind === 'applied') {
                    const progressed = (0, workflow_plan_transition_util_1.applyComposeMutationProgress)({
                        taskPlan: state.taskPlan,
                        workflowRun: state.workflowRun,
                        workflowNodeDefs: state.workflowNodeDefs,
                        workflowAwaitingReact: state.workflowAwaitingReact,
                        planStepId: executionStep.id,
                        composeObservation: intercept.composeObservation,
                    });
                    deps.logger.log(`compose_mutation intercept in tools.node runId=${ctx.input.runId} tool=${intercept.preparedCall.name}`);
                    return Object.assign(Object.assign({}, state), { workflowRun: (_j = progressed.workflowRun) !== null && _j !== void 0 ? _j : state.workflowRun, workflowAwaitingReact: (_k = progressed.workflowAwaitingReact) !== null && _k !== void 0 ? _k : state.workflowAwaitingReact, toolObservations: (0, graph_tool_observations_util_1.mergeRunRoundObservations)(state, [
                            intercept.composeObservation,
                        ]), taskPlan: progressed.taskPlan, pendingToolCalls: [], lastToolRoundMeta: null, pagedListHttpUsed: pagedGatherHttpBudget.used });
                }
            }
            deps.logger.warn(`write gate deferred: premature write before await_user_confirm runId=${ctx.input.runId} tools=${writeCallsNeedingConfirm.map((call) => call.name).join(',')}`);
            return Object.assign(Object.assign({}, state), { pendingToolCalls: [], lastToolRoundMeta: null, pagedListHttpUsed: pagedGatherHttpBudget.used });
        }
        if (writeCallsForGate.length > 0) {
            let nextSteps = [...state.steps];
            let observations = [...(0, graph_tool_observations_util_1.allToolObservations)(state)];
            let taskPlan = (_l = state.taskPlan) !== null && _l !== void 0 ? _l : null;
            let workflowRunForContext = state.workflowRun;
            let workflowAwaitingReactForContext = state.workflowAwaitingReact;
            if (safeCalls.length > 0) {
                const safeRound = await (0, paged_list_gather_util_1.expandPagedListGather)({
                    round: await runRound(safeCalls, observations, nextSteps),
                    taskPlan: state.taskPlan,
                    scopedTools: state.scopedTools,
                    runRound,
                    gatherLlm,
                    httpBudget: pagedGatherHttpBudget,
                    onProgress: (message) => deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, message, 'delta'),
                });
                nextSteps = safeRound.steps.map((row) => (Object.assign(Object.assign({}, row), { output: runHelpers.normalizeJsonLike(row.output) })));
                observations = safeRound.toolObservations;
                if (taskPlan && safeRound.lastToolRoundMeta.toolCalls.length > 0) {
                    const advance = (0, task_plan_util_1.resolveTaskPlanAdvance)({
                        phase: 'post_tools',
                        plan: taskPlan,
                        observations,
                        executionStatuses: safeRound.lastToolRoundMeta.executionStatuses,
                        roundObservationIndices: safeRound.lastToolRoundMeta.roundObservationIndices,
                        scopedTools: state.scopedTools,
                        toolCalls: safeCalls,
                        skillConfig: state.activeSkillConfig,
                    });
                    if (advance && taskPlan) {
                        const planBefore = taskPlan;
                        const progressed = (0, workflow_plan_transition_util_1.applyPlanAdvanceAsWorkflowProgress)({
                            taskPlan,
                            workflowRun: workflowRunForContext,
                            workflowNodeDefs: state.workflowNodeDefs,
                            workflowAwaitingReact: workflowAwaitingReactForContext,
                            planBefore,
                            planAdvance: advance,
                        });
                        taskPlan = (_m = progressed.taskPlan) !== null && _m !== void 0 ? _m : taskPlan;
                        if (progressed.workflowRun) {
                            workflowRunForContext = progressed.workflowRun;
                        }
                        if (progressed.workflowAwaitingReact !== undefined) {
                            workflowAwaitingReactForContext = progressed.workflowAwaitingReact;
                        }
                    }
                }
                await runHelpers.updateRun(ctx.input.runId, nextSteps, client_1.AgentRunStatus.running);
            }
            let previewReady = (0, mutation_preview_before_gate_util_1.hasUserVisibleMutationPreview)({
                artifact: deps.assistantArtifact.peek(ctx.input.sessionId, ctx.input.runId),
                observations,
            });
            if (!previewReady) {
                const previewMarkdown = (0, mutation_preview_before_gate_util_1.buildMutationPreviewMarkdownFromWriteCalls)(writeCallsForGate, state.scopedTools);
                if (previewMarkdown.trim()) {
                    const turnId = (_o = deps.assistantArtifact.peekTurnId(ctx.input.sessionId, ctx.input.runId)) !== null && _o !== void 0 ? _o : ctx.input.turnId;
                    const blocks = deps.sse.publishAssistantBlocks(ctx.input.sessionId, ctx.input.runId, (0, message_blocks_util_1.ensureAtLeastOneTextBlock)([(0, message_blocks_util_1.textBlock)(previewMarkdown.trim(), 'markdown')], previewMarkdown.trim()), { turnId, phase: 'draft' });
                    previewReady = blocks.length > 0;
                }
            }
            if (!previewReady) {
                deps.logger.warn(`write gate blocked: no user-visible mutation preview runId=${ctx.input.runId}`);
                runHelpers.publishMutationGateBlockedDraft(ctx.input.sessionId, ctx.input.runId, ctx.input.turnId, (0, mutation_preview_before_gate_util_1.buildMutationPreviewUnavailableUserMessage)());
                return Object.assign(Object.assign({}, state), { pendingToolCalls: [], lastToolRoundMeta: null, pagedListHttpUsed: pagedGatherHttpBudget.used });
            }
            const message = (0, write_confirmation_gate_util_1.buildWriteConfirmationUserMessage)();
            const confirmedPreviewSerialized = deps.assistantArtifact.peekSerialized(ctx.input.sessionId, ctx.input.runId);
            await deps.pendingWriteConfirmationStore.set({
                runId: ctx.input.runId,
                turnId: ctx.input.turnId,
                sessionId: ctx.input.sessionId,
                userId: ctx.input.userId,
                appClientId: ctx.input.appClientId,
                agentId: ctx.input.agentId,
                latestUserMessage: ctx.input.latestUserMessage,
                toolCalls: writeCallsForGate,
                resumeContext: {
                    steps: nextSteps,
                    iteration: state.iteration,
                    toolObservations: (0, agent_write_confirmation_util_1.serializeObservationsForPending)(observations),
                    scopedToolIds: state.scopedTools.map((tool) => tool.id),
                    intentKind: state.intentKind,
                    hasExpandedOnce: state.hasExpandedOnce,
                    skillApplied: state.skillApplied === true,
                    activeSkillId: (_p = state.activeSkillId) !== null && _p !== void 0 ? _p : null,
                    activeSkillPrompt: (_q = state.activeSkillPrompt) !== null && _q !== void 0 ? _q : null,
                    activeSkillName: (_r = state.activeSkillName) !== null && _r !== void 0 ? _r : null,
                    activeSkillDescription: (_s = state.activeSkillDescription) !== null && _s !== void 0 ? _s : null,
                    activeSkillConfig: (_t = state.activeSkillConfig) !== null && _t !== void 0 ? _t : null,
                    activeSkillRiskLevel: (_u = state.activeSkillRiskLevel) !== null && _u !== void 0 ? _u : null,
                    taskPlan,
                    pagedListHttpUsed: pagedGatherHttpBudget.used,
                    confirmedPreviewSerialized,
                    pageContext: (_v = state.pageContext) !== null && _v !== void 0 ? _v : null,
                    workflowRun: workflowRunForContext !== null && workflowRunForContext !== void 0 ? workflowRunForContext : null,
                    workflowNodeDefs: state.workflowNodeDefs,
                    workflowNodeOutputs: state.workflowNodeOutputs,
                    workflowAwaitingReact: workflowAwaitingReactForContext === true,
                },
                createdAt: new Date().toISOString(),
            });
            (0, workflow_debug_util_1.logWorkflowDebug)('write_confirm_gate', {
                runId: ctx.input.runId,
                sessionId: ctx.input.sessionId,
                turnId: ctx.input.turnId,
                toolNames: writeCallsForGate.map((call) => call.name),
                workflowRun: (_w = state.workflowRun) !== null && _w !== void 0 ? _w : null,
                hasWorkflowNodeDefs: ((_y = (_x = state.workflowNodeDefs) === null || _x === void 0 ? void 0 : _x.length) !== null && _y !== void 0 ? _y : 0) > 0,
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
            if (!published) {
                (0, message_blocks_debug_util_1.emitAgentMessageSseDebug)({
                    tag: 'confirmation_required_suppressed',
                    sessionId: ctx.input.sessionId,
                    runId: ctx.input.runId,
                    turnId: ctx.input.turnId,
                    ssePayload: confirmationPayload,
                    source: { reason: 'run_not_publishable' },
                });
            }
            else {
                (0, message_blocks_debug_util_1.emitAgentMessageSseDebug)({
                    tag: 'confirmation_required',
                    sessionId: ctx.input.sessionId,
                    runId: ctx.input.runId,
                    turnId: ctx.input.turnId,
                    ssePayload: confirmationPayload,
                    source: {
                        confirmedPreviewSerialized,
                        artifactBlocks: deps.assistantArtifact.peekBlocks(ctx.input.sessionId, ctx.input.runId),
                    },
                });
            }
            const gateStep = {
                step: (0, agent_run_steps_util_1.nextRunStepNumber)(nextSteps),
                type: 'write_confirmation_gate',
                output: runHelpers.normalizeJsonLike({
                    status: 'awaiting_user',
                    pendingToolCallCount: writeCallsForGate.length,
                    toolNames: writeCallsForGate.map((call) => call.name),
                }),
            };
            nextSteps = [...nextSteps, gateStep];
            await runHelpers.updateRun(ctx.input.runId, nextSteps, client_1.AgentRunStatus.success);
            return Object.assign(Object.assign({}, state), { steps: nextSteps, toolObservations: (0, graph_tool_observations_util_1.mergeRunRoundObservations)(state, observations), taskPlan, workflowRun: workflowRunForContext, workflowAwaitingReact: workflowAwaitingReactForContext, pendingToolCalls: [], awaitingWriteConfirmation: true, finalOutput: (_z = deps.assistantArtifact.peekSerialized(ctx.input.sessionId, ctx.input.runId)) !== null && _z !== void 0 ? _z : '', status: client_1.AgentRunStatus.success, finished: true, pagedListHttpUsed: pagedGatherHttpBudget.used });
        }
        const round = await (0, paged_list_gather_util_1.expandPagedListGather)({
            round: await runRound(state.pendingToolCalls, [...(0, graph_tool_observations_util_1.allToolObservations)(state)], [...state.steps]),
            taskPlan: state.taskPlan,
            scopedTools: state.scopedTools,
            runRound,
            gatherLlm,
            httpBudget: pagedGatherHttpBudget,
            onProgress: (message) => deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, message, 'delta'),
        });
        const nextSteps = round.steps.map((row) => (Object.assign(Object.assign({}, row), { output: runHelpers.normalizeJsonLike(row.output) })));
        await runHelpers.updateRun(ctx.input.runId, nextSteps, client_1.AgentRunStatus.running);
        return Object.assign(Object.assign({}, state), { steps: nextSteps, toolObservations: (0, graph_tool_observations_util_1.mergeRunRoundObservations)(state, round.toolObservations), pendingToolCalls: [], pendingRespond: null, pagedListHttpUsed: pagedGatherHttpBudget.used, lastToolRoundMeta: round.lastToolRoundMeta });
    };
}
exports.createToolsNode = createToolsNode;
//# sourceMappingURL=tools.node.js.map