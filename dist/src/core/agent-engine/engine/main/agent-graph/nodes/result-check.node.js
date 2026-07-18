"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResultCheckNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const graph_tool_observations_util_1 = require("../../../graph-tool-observations.util");
const tool_plan_error_util_1 = require("../../../tool/tool-plan-error.util");
const tool_result_check_util_1 = require("../../../tool/tool-result-check.util");
const result_check_route_util_1 = require("../../../tool/result-check-route.util");
const turn_respond_util_1 = require("../../../turn/turn-respond.util");
const turn_execution_contract_util_1 = require("../../../turn/turn-execution-contract.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const outer_plan_skills_util_1 = require("../../plan/outer-plan-skills.util");
const plan_observation_scope_util_1 = require("../../plan/plan-observation-scope.util");
const plan_sync_util_1 = require("../../plan/plan-sync.util");
const session_goa_plan_projection_util_1 = require("../../session/session-goa-plan-projection.util");
const task_plan_llm_util_1 = require("../../plan/task-plan-llm.util");
const task_plan_util_1 = require("../../plan/task-plan.util");
const workflow_plan_transition_util_1 = require("../../../../../workflow/workflow-plan-transition.util");
const agent_run_audit_util_1 = require("../../run/agent-run-audit.util");
const patch_upstream_from_fetch_round_util_1 = require("../../../../../entity-materialization/patch-upstream-from-fetch-round.util");
function workflowProgressPatch(state, planBefore, planAdvance, options) {
    if (!planBefore || !planAdvance) {
        return {};
    }
    return (0, workflow_plan_transition_util_1.applyPlanAdvanceAsWorkflowProgress)({
        taskPlan: state.taskPlan,
        workflowRun: state.workflowRun,
        workflowNodeDefs: state.workflowNodeDefs,
        workflowAwaitingReact: state.workflowAwaitingReact,
        planBefore,
        planAdvance,
        options,
    });
}
function createResultCheckNode(bundle) {
    const { deps, ctx, runHelpers, skillFrame, summarize } = bundle;
    return async (state) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        const planBeforeReact = (_a = state.taskPlan) !== null && _a !== void 0 ? _a : null;
        const phase = (0, tool_result_check_util_1.inferResultCheckPhase)(state);
        const savedRoundMeta = state.lastToolRoundMeta;
        if (phase === 'post_tools' && !savedRoundMeta) {
            const fallbackStep = {
                step: (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps),
                type: 'result_check',
                output: runHelpers.normalizeJsonLike({
                    phase: 'post_tools',
                    route: 'llm',
                    reason: 'missing_tool_round_meta',
                }),
            };
            const steps = [...state.steps, fallbackStep];
            await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
            return Object.assign(Object.assign({}, state), { steps, pendingToolCalls: [], pendingRespond: null, lastToolRoundMeta: null });
        }
        const observationsForResultCheck = (0, graph_tool_observations_util_1.allToolObservations)(state);
        let taskPlanForCheck = state.taskPlan;
        let planAdvanceFromSync = null;
        let planSyncedAt = null;
        const planSyncFromStepId = (_c = (_b = state.taskPlan) === null || _b === void 0 ? void 0 : _b.currentStepId) !== null && _c !== void 0 ? _c : null;
        if (phase === 'pre_tools' && state.taskPlan) {
            const synced = (0, plan_sync_util_1.syncTaskPlanBeforeReAct)({
                taskPlan: state.taskPlan,
                scopedTools: state.scopedTools,
                skillConfig: state.activeSkillConfig,
                observationBuckets: (0, plan_observation_scope_util_1.planObservationBucketsFromState)(state),
                pageContextEntityId: (0, turn_execution_contract_util_1.pageContextEntityIdFromGraphState)(state),
                workflowRun: state.workflowRun,
                workflowNodeDefs: state.workflowNodeDefs,
                workflowAwaitingReact: state.workflowAwaitingReact,
            });
            taskPlanForCheck = synced.taskPlan;
            planAdvanceFromSync = synced.planAdvance;
            if (planAdvanceFromSync) {
                planSyncedAt = 'result_check';
            }
        }
        let outcome;
        if (phase === 'pre_tools') {
            outcome = (0, tool_result_check_util_1.resolvePreToolsResultCheck)({
                pendingToolCalls: state.pendingToolCalls,
                steps: state.steps,
                taskPlan: taskPlanForCheck,
                scopedTools: state.scopedTools,
                observationBuckets: (0, plan_observation_scope_util_1.planObservationBucketsFromState)(state),
                skillConfig: state.activeSkillConfig,
                pageContextEntityId: (0, turn_execution_contract_util_1.pageContextEntityIdFromGraphState)(state),
            });
        }
        else if (savedRoundMeta) {
            const lastRoundIndex = savedRoundMeta.roundObservationIndices.at(-1);
            const lastRoundObservation = lastRoundIndex != null
                ? observationsForResultCheck[lastRoundIndex]
                : undefined;
            outcome = (0, tool_result_check_util_1.resolvePostToolsResultCheck)({
                userMessage: ctx.input.latestUserMessage,
                observations: observationsForResultCheck,
                lastToolRoundMeta: savedRoundMeta,
                scopedTools: state.scopedTools,
                taskPlan: state.taskPlan,
                skillConfig: state.activeSkillConfig,
                skillApplied: state.skillApplied,
                hasExpandedOnce: state.hasExpandedOnce,
                iteration: state.iteration,
                totalAllowedToolCount: ctx.input.tools.length,
                writeConfirmResume: ctx.input.resumeFromWriteConfirm === true,
                isLowQualityLastObservation: summarize.isLowQualityToolObservation(lastRoundObservation),
            });
        }
        else {
            throw new Error('resultCheck: post_tools without lastToolRoundMeta');
        }
        const planAdvance = phase === 'post_tools' && savedRoundMeta && state.taskPlan
            ? (0, task_plan_util_1.resolveTaskPlanAdvance)({
                phase: 'post_tools',
                plan: state.taskPlan,
                observations: (0, graph_tool_observations_util_1.allToolObservations)(state),
                executionStatuses: savedRoundMeta.executionStatuses,
                roundObservationIndices: savedRoundMeta.roundObservationIndices,
                scopedTools: state.scopedTools,
                toolCalls: savedRoundMeta.toolCalls,
                skillConfig: state.activeSkillConfig,
            })
            : phase === 'pre_tools'
                ? planAdvanceFromSync
                : null;
        const planFallback = (0, result_check_route_util_1.resolveResultCheckPlanFallback)({
            outcome,
            planAdvance,
        });
        const workflowProgressOptions = (planFallback === null || planFallback === void 0 ? void 0 : planFallback.action) === 'llm_continue' &&
            planFallback.reason === 'plan_advance_tool_step'
            ? { clearWorkflowAwaitingReact: true }
            : undefined;
        const workflowPatch = planAdvance != null
            ? workflowProgressPatch(state, planBeforeReact, planAdvance, workflowProgressOptions)
            : {};
        const taskPlanNext = planAdvance != null
            ? ((_d = workflowPatch.taskPlan) !== null && _d !== void 0 ? _d : planAdvance.updatedPlan)
            : ((_e = state.taskPlan) !== null && _e !== void 0 ? _e : null);
        const observationsForCheck = (0, graph_tool_observations_util_1.allToolObservations)(state);
        const summaryObservationForAbort = outcome.route === 'summarize'
            ? (0, tool_result_check_util_1.resolveSummaryObservationForCheck)({
                reason: outcome.reason,
                observations: observationsForCheck,
                savedRoundMeta,
                mergedObservation: outcome.reason === 'tool_error_summarize' ||
                    outcome.reason === 'tool_error_same_args_repeat'
                    ? null
                    : summarize.buildSummarizeObservationFromState(state, {
                        taskPlan: taskPlanNext,
                        scopedTools: state.scopedTools,
                    }),
            })
            : null;
        const abortPlanOnEmptyResults = outcome.reason === 'empty_tool_results' && state.taskPlan != null;
        const abortPlanOnDuplicateSummarize = state.taskPlan != null &&
            planAdvance == null &&
            (outcome.reason === 'duplicate_tool_call_round' ||
                outcome.reason === 'all_tool_calls_duplicate');
        const abortPlanOnToolStepExhausted = outcome.reason === 'plan_tool_step_exhausted' && state.taskPlan != null;
        const abortPlanOnWriteStepExhausted = outcome.reason === 'plan_write_step_exhausted' && state.taskPlan != null;
        const abortPlanOnTerminalToolError = (0, tool_plan_error_util_1.shouldAbortPlanOnTerminalToolError)({
            reason: outcome.reason,
            errorOutput: summaryObservationForAbort === null || summaryObservationForAbort === void 0 ? void 0 : summaryObservationForAbort.output,
            taskPlan: state.taskPlan,
        });
        const abortPlanOnRecoverableSameArgs = (0, tool_plan_error_util_1.shouldAbortPlanOnRecoverableSameArgs)({
            reason: outcome.reason,
            taskPlan: state.taskPlan,
        });
        const planAbortedOnToolError = abortPlanOnTerminalToolError || abortPlanOnRecoverableSameArgs;
        const planAbortedAfterCheck = state.planAborted === true ||
            abortPlanOnEmptyResults ||
            abortPlanOnDuplicateSummarize ||
            abortPlanOnToolStepExhausted ||
            abortPlanOnWriteStepExhausted ||
            planAbortedOnToolError;
        const taskPlanAfterCheck = abortPlanOnEmptyResults ||
            abortPlanOnDuplicateSummarize ||
            abortPlanOnToolStepExhausted ||
            abortPlanOnWriteStepExhausted ||
            planAbortedOnToolError
            ? null
            : taskPlanNext;
        const skipSteps = outcome.duplicateSkipCalls.length > 0
            ? (0, tool_result_check_util_1.buildDuplicateSkipToolSteps)(outcome.duplicateSkipCalls, state.steps, outcome.reason)
            : [];
        const planSyncSteps = planAdvanceFromSync != null &&
            !(0, workflow_plan_transition_util_1.isWorkflowBoundRun)(state.workflowRun)
            ? [
                (0, plan_sync_util_1.toPlanSyncAgentStep)({
                    step: (0, agent_run_steps_util_1.nextRunStepNumber)([...state.steps, ...skipSteps]),
                    planAdvance: planAdvanceFromSync,
                    fromStepId: planSyncFromStepId,
                    site: 'result_check',
                    planRunContext: (0, plan_observation_scope_util_1.planRunContextFromState)(state),
                    normalizeOutput: (value) => runHelpers.normalizeJsonLike(value),
                }),
            ]
            : [];
        const isSafetyAbortRoute = outcome.route === 'summarize' && planAbortedAfterCheck;
        const planRouteAuthority = (_f = planFallback === null || planFallback === void 0 ? void 0 : planFallback.authority) !== null && _f !== void 0 ? _f : (isSafetyAbortRoute ? 'safety_abort' : 'react');
        const resultCheckStep = (0, agent_run_audit_util_1.maybeTagWorkflowReactInternalStep)({
            step: (0, agent_run_steps_util_1.nextRunStepNumber)([...state.steps, ...skipSteps, ...planSyncSteps]),
            type: 'result_check',
            output: runHelpers.normalizeJsonLike({
                phase: outcome.phase,
                route: outcome.route,
                reason: outcome.reason,
                duplicateSkipCount: outcome.duplicateSkipCalls.length,
                pendingToolCallCount: outcome.pendingToolCalls.length,
                supersededPendingToolCallCount: (_g = outcome.supersededPendingToolCallCount) !== null && _g !== void 0 ? _g : 0,
                planAdvanceRoute: (_h = planAdvance === null || planAdvance === void 0 ? void 0 : planAdvance.route) !== null && _h !== void 0 ? _h : null,
                planAdvanceReason: (_j = planAdvance === null || planAdvance === void 0 ? void 0 : planAdvance.reason) !== null && _j !== void 0 ? _j : null,
                planSyncedAt,
                planRouteAuthority,
                planSupersededPendingToolCallCount: (planFallback === null || planFallback === void 0 ? void 0 : planFallback.action) === 'summarize'
                    ? planFallback.supersededPendingToolCallCount
                    : 0,
                planAbortedEmpty: abortPlanOnEmptyResults,
                planAbortedDuplicate: abortPlanOnDuplicateSummarize,
                planAbortedToolStepExhausted: abortPlanOnToolStepExhausted,
                planAbortedWriteStepExhausted: abortPlanOnWriteStepExhausted,
                planAbortedTerminalToolError: abortPlanOnTerminalToolError,
                planAbortedSameArgsRepeat: abortPlanOnRecoverableSameArgs,
                taskPlanStep: (_k = taskPlanAfterCheck === null || taskPlanAfterCheck === void 0 ? void 0 : taskPlanAfterCheck.currentStepId) !== null && _k !== void 0 ? _k : null,
            }),
        }, state);
        let steps = [...state.steps, ...skipSteps, ...planSyncSteps, resultCheckStep];
        const upstreamEntityPatch = phase === 'post_tools' && savedRoundMeta && taskPlanNext
            ? (0, patch_upstream_from_fetch_round_util_1.patchUpstreamEntitiesAfterFetchRound)({
                state: Object.assign(Object.assign({}, state), workflowPatch),
                steps,
                planBefore: planBeforeReact,
                planAfter: taskPlanNext,
                roundObservationIndices: savedRoundMeta.roundObservationIndices,
                allObservations: (0, graph_tool_observations_util_1.allToolObservations)(state),
            })
            : null;
        if (upstreamEntityPatch) {
            steps = upstreamEntityPatch.steps;
        }
        const emitRouteThink = (message) => {
            deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, message, 'delta');
        };
        const effectiveTaskPlanNext = taskPlanNext;
        if ((planFallback === null || planFallback === void 0 ? void 0 : planFallback.action) === 'summarize' && planAdvance) {
            const summarizeObservation = summarize.buildSummarizeObservationFromState(state, {
                taskPlan: effectiveTaskPlanNext,
                scopedTools: state.scopedTools,
            });
            const summaryObservation = (_l = (0, tool_result_check_util_1.resolveSummaryObservationForCheck)({
                reason: planAdvance.reason,
                observations: (0, graph_tool_observations_util_1.allToolObservations)(state),
                savedRoundMeta,
                mergedObservation: summarizeObservation,
            })) !== null && _l !== void 0 ? _l : (0, task_plan_util_1.buildPlanSummarizeObservation)({
                userMessage: ctx.input.latestUserMessage,
                summarizeObservation,
            });
            if (planAdvance.reason === 'plan_advance_summarize') {
                emitRouteThink('数据已就绪，正在按任务计划生成结果…\n');
            }
            else if (planAdvance.reason === 'plan_complete') {
                emitRouteThink('任务计划已完成，正在生成最终结果…\n');
            }
            await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
            return Object.assign(Object.assign(Object.assign(Object.assign({}, state), workflowPatch), (upstreamEntityPatch !== null && upstreamEntityPatch !== void 0 ? upstreamEntityPatch : {})), { steps, taskPlan: effectiveTaskPlanNext, pendingToolCalls: [], pendingRespond: (0, turn_respond_util_1.pendingRespondFromObservation)(summaryObservation), lastToolRoundMeta: null });
        }
        if ((planFallback === null || planFallback === void 0 ? void 0 : planFallback.action) === 'skill_step') {
            emitRouteThink('进入下一技能步骤…\n');
            await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
            return skillFrame.applySkillFrameContext(Object.assign(Object.assign(Object.assign(Object.assign({}, state), workflowPatch), (upstreamEntityPatch !== null && upstreamEntityPatch !== void 0 ? upstreamEntityPatch : {})), { steps, taskPlan: effectiveTaskPlanNext, pendingToolCalls: (0, result_check_route_util_1.resolveSkillStepPendingToolCalls)({
                    pendingToolCalls: outcome.pendingToolCalls,
                    taskPlan: effectiveTaskPlanNext,
                    scopedTools: state.scopedTools,
                }), pendingRespond: null, lastToolRoundMeta: null }));
        }
        if ((planFallback === null || planFallback === void 0 ? void 0 : planFallback.action) === 'llm_continue') {
            if (planFallback.reason === 'plan_advance_tool_step') {
                emitRouteThink('进入下一任务步骤…\n');
            }
            await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
            return Object.assign(Object.assign(Object.assign(Object.assign({}, state), workflowPatch), (upstreamEntityPatch !== null && upstreamEntityPatch !== void 0 ? upstreamEntityPatch : {})), { steps, taskPlan: effectiveTaskPlanNext, pendingToolCalls: planFallback.clearPendingToolCalls
                    ? []
                    : outcome.pendingToolCalls, pendingRespond: null, lastToolRoundMeta: null });
        }
        if (outcome.route === 'expand_tools') {
            const expandScopedTools = ctx.requestedSkillCtx
                ? ctx.requestedSkillCtx.scoped.scopedTools
                : ctx.input.tools;
            const expandedStep = {
                step: (0, agent_run_steps_util_1.nextRunStepNumber)(steps),
                type: 'intent',
                output: runHelpers.normalizeJsonLike(Object.assign({ fallback: true, fallbackReason: outcome.reason, toolsBeforeExpand: state.scopedTools.length, toolsAfterExpand: expandScopedTools.length }, (ctx.requestedSkillCtx
                    ? { requestedSkillId: ctx.requestedSkillCtx.skillId, expandSkipped: true }
                    : {}))),
            };
            steps = [...steps, expandedStep];
            await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
            emitRouteThink(ctx.requestedSkillCtx
                ? '首轮结果信息不足，正在按所选技能重新规划…\n'
                : '首轮结果信息不足，正在放宽工具范围再尝试一次…\n');
            const expandedSkills = await deps.skillService.resolveSkillsForOuterPlan({
                agentId: ctx.input.agentId,
                userId: ctx.input.userId,
                appClientId: ctx.input.appClientId,
                scopedTools: expandScopedTools,
                scopedHostToolIds: (_o = (_m = state.scopedHostTools) === null || _m === void 0 ? void 0 : _m.map((tool) => tool.id)) !== null && _o !== void 0 ? _o : [],
                requestedSkillId: ctx.input.requestedSkillId,
            });
            const expandedRequestedSkillDetail = ctx.input.requestedSkillId != null
                ? expandedSkills.find((skill) => skill.id === ctx.input.requestedSkillId)
                : undefined;
            const expandedResolvedPlan = await (0, task_plan_llm_util_1.resolveOuterPlan)({
                llmService: deps.llmService,
                promptRegistry: deps.promptRegistry,
                scope: ctx.promptScope,
                planInput: {
                    userMessage: ctx.input.latestUserMessage,
                    scopedToolSummaries: (0, task_plan_util_1.summarizeScopedToolsForPlan)(expandScopedTools),
                    availableSkills: (0, outer_plan_skills_util_1.summarizeAvailableSkillsForOuterPlan)(expandedSkills, expandScopedTools, (_q = (_p = state.scopedHostTools) === null || _p === void 0 ? void 0 : _p.map((tool) => tool.id)) !== null && _q !== void 0 ? _q : []),
                    sessionWorkingMemory: (0, session_goa_plan_projection_util_1.buildPlanSessionWorkingMemory)({
                        goa: ctx.getSessionGoa(),
                        scopedTools: expandScopedTools,
                        runOwnedObservations: (0, graph_tool_observations_util_1.runOwnedToolObservations)(state),
                    }),
                    requestedSkillId: ctx.input.requestedSkillId,
                    requestedSkillDetail: expandedRequestedSkillDetail,
                },
            });
            const expandedBundle = ctx.requestedSkillCtx
                ? ctx.requestedSkillCtx.scoped.scopedToolBundle
                : deps.toolEngine.buildLangChainTools(expandScopedTools, Object.assign(Object.assign({}, ctx.input.toolBuildCtx), { allowedToolIds: expandScopedTools.map((tool) => tool.id) }));
            return skillFrame.applySkillFrameContext(Object.assign(Object.assign({}, state), { steps, pendingToolCalls: [], pendingRespond: null, lastToolRoundMeta: null, scopedTools: expandScopedTools, scopedLangChainTools: expandedBundle.tools, scopedToolBundle: expandedBundle, scopedAllowedToolIds: expandScopedTools.map((tool) => tool.id), hasExpandedOnce: true, taskPlan: expandedResolvedPlan.plan, skillApplied: false, activeSkillId: null, activeSkillPrompt: null, activeSkillName: null, activeSkillDescription: null, activeSkillConfig: null, activeSkillRiskLevel: null }));
        }
        if (outcome.route === 'summarize') {
            const planStepExhausted = outcome.reason === 'plan_tool_step_exhausted' ||
                outcome.reason === 'plan_write_step_exhausted';
            const summaryObservation = planStepExhausted
                ? null
                : summaryObservationForAbort;
            if (summaryObservation) {
                if (outcome.reason === 'duplicate_tool_call_round' ||
                    outcome.reason === 'all_tool_calls_duplicate') {
                    emitRouteThink('检测到与上一轮完全相同的工具调用，强制汇总已有结果…\n');
                }
                else if (outcome.reason === 'empty_tool_results') {
                    emitRouteThink('查询成功，但未找到符合条件的数据，正在生成说明…\n');
                }
                else if (outcome.reason === 'tool_error_same_args_repeat') {
                    emitRouteThink('参数未调整且与上次失败调用相同，正在生成说明…\n');
                }
                else if (outcome.reason === 'tool_error_summarize' &&
                    planAbortedOnToolError) {
                    emitRouteThink('工具调用失败，正在生成说明…\n');
                }
                await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
                return Object.assign(Object.assign({}, state), { steps, taskPlan: taskPlanAfterCheck, pendingToolCalls: [], pendingRespond: (0, turn_respond_util_1.pendingRespondFromObservation)(summaryObservation), lastToolRoundMeta: null, planAborted: planAbortedAfterCheck || undefined });
            }
            const exhaustedFallback = outcome.reason === 'plan_write_step_exhausted'
                ? '未能按任务计划发起写操作（未生成有效的工具调用）。请确认需要提交回复或修改数据后，我再试一次。'
                : outcome.reason === 'plan_tool_step_exhausted'
                    ? '我未能按任务计划调用所需工具获取数据，请补充更具体的查询条件后我再试一次。'
                    : '我暂时无法根据已有工具结果给出汇总，请补充更具体的条件后我再试一次。';
            emitRouteThink(outcome.reason === 'plan_write_step_exhausted'
                ? '未能完成写操作步骤，正在生成说明…\n'
                : '无法从已有工具结果生成汇总，正在生成说明…\n');
            await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
            return Object.assign(Object.assign({}, state), { steps, taskPlan: taskPlanAfterCheck, pendingToolCalls: [], pendingRespond: (0, turn_respond_util_1.pendingRespondFromObservation)(summarize.buildDirectReplyObservation(ctx.input.latestUserMessage, exhaustedFallback)), lastToolRoundMeta: null });
        }
        if (outcome.route === 'tools' &&
            outcome.reason === 'paged_gather_resume') {
            emitRouteThink(outcome.pagedGatherResumeKind === 'map_summary'
                ? '页内摘要未完成，正在重试（复用已拉取数据）…\n'
                : '分页数据未拉取完整，正在继续拉取…\n');
            await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
            return Object.assign(Object.assign({}, state), { steps, taskPlan: taskPlanAfterCheck, pendingToolCalls: [], pendingRespond: null, lastToolRoundMeta: null });
        }
        if (outcome.reason === 'duplicate_off_plan_step') {
            emitRouteThink('当前任务步骤需要其他工具，正在重新决策…\n');
        }
        if (outcome.reason === 'plan_tool_step_required') {
            emitRouteThink('当前任务步骤需要先调用工具，正在重新决策…\n');
        }
        if (outcome.reason === 'plan_write_step_required') {
            emitRouteThink('当前任务步骤需要执行写操作，正在重新决策…\n');
        }
        if (outcome.reason === 'plan_write_step_exhausted') {
            emitRouteThink('多次未能发起写操作，正在生成说明…\n');
        }
        if (outcome.reason === 'plan_tool_step_exhausted') {
            emitRouteThink('多次未能按任务计划调用工具，正在根据已有信息生成说明…\n');
        }
        await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
        return Object.assign(Object.assign(Object.assign({}, state), workflowProgressPatch(state, planBeforeReact, planAdvance)), { steps, taskPlan: taskPlanAfterCheck, pendingToolCalls: outcome.pendingToolCalls, pendingRespond: null, lastToolRoundMeta: null });
    };
}
exports.createResultCheckNode = createResultCheckNode;
//# sourceMappingURL=result-check.node.js.map