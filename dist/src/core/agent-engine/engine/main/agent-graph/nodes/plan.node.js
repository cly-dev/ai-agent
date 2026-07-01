"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlanNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const graph_tool_observations_util_1 = require("../../../graph-tool-observations.util");
const turn_respond_util_1 = require("../../../turn/turn-respond.util");
const turn_execution_contract_util_1 = require("../../../turn/turn-execution-contract.util");
const skill_intent_alignment_util_1 = require("../../../turn/skill-intent-alignment.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const plan_observation_scope_util_1 = require("../../plan/plan-observation-scope.util");
const plan_sync_util_1 = require("../../plan/plan-sync.util");
const session_graph_resume_util_1 = require("../../session/session-graph-resume.util");
const session_goa_plan_projection_util_1 = require("../../session/session-goa-plan-projection.util");
const outer_plan_skills_util_1 = require("../../plan/outer-plan-skills.util");
const outer_plan_skill_resolve_util_1 = require("../../plan/outer-plan-skill-resolve.util");
const resolve_plan_from_contract_util_1 = require("../../plan/resolve-plan-from-contract.util");
const task_plan_util_1 = require("../../plan/task-plan.util");
const host_tool_resolve_debug_util_1 = require("../../../../../host-bridge/host-tool-resolve-debug.util");
const host_tool_plan_util_1 = require("../../host-tool/host-tool-plan.util");
const session_resume_workflow_util_1 = require("../../../../../workflow/session-resume-workflow.util");
function createPlanNode(bundle) {
    const { deps, ctx, runHelpers, skillFrame, summarize } = bundle;
    return async (state) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps);
        if (state.taskPlan) {
            return state;
        }
        const contract = (0, turn_execution_contract_util_1.resolveTurnExecutionContract)(state, undefined, deps.logger);
        if (!contract.plan.enabled) {
            if ((0, turn_respond_util_1.hasPendingRespond)(state.pendingRespond)) {
                return state;
            }
            const step = {
                step: stepNum,
                type: 'plan',
                output: runHelpers.normalizeJsonLike({
                    skipped: true,
                    reason: 'plan_disabled_by_contract',
                }),
            };
            const stepsWithSkip = [...state.steps, step];
            await runHelpers.updateRun(ctx.input.runId, stepsWithSkip, client_1.AgentRunStatus.running);
            return runHelpers.buildTurnRespondState(state, stepsWithSkip, {
                kind: 'off_domain',
                userMessage: ctx.input.latestUserMessage,
                payload: {
                    routingReason: (_a = contract.routing.reason) !== null && _a !== void 0 ? _a : 'plan_disabled_by_contract',
                },
            });
        }
        const sessionGoa = ctx.getSessionGoa();
        if (sessionGoa && !ctx.requestedSkillCtx) {
            const resumeDecision = await deps.resumeGate.evaluate({
                sessionId: ctx.input.sessionId,
                appClientId: ctx.input.appClientId,
                agentId: ctx.input.agentId,
                latestUserMessage: ctx.input.latestUserMessage,
                goa: sessionGoa,
                contract,
            });
            if (resumeDecision.action === 'abandon_and_fresh') {
                ctx.setSessionGoa(await deps.goaService.getPayload(ctx.input.sessionId));
            }
            if (resumeDecision.action === 'resume') {
                const taskPlan = (0, session_graph_resume_util_1.fromStoredTaskPlan)(resumeDecision.plan);
                const planStep = {
                    step: stepNum,
                    type: 'plan',
                    output: runHelpers.normalizeJsonLike({
                        method: 'session_resume',
                        activeFrameIndex: taskPlan.activeFrameIndex,
                        frameCount: taskPlan.frames.length,
                        source: taskPlan.source,
                        deliverable: taskPlan.deliverable,
                        goal: taskPlan.goal,
                        stepIds: taskPlan.steps.map((step) => step.id),
                        pendingStepIds: taskPlan.pendingStepIds,
                        currentStepId: taskPlan.currentStepId,
                        currentObjective: taskPlan.currentObjective,
                        taskPhase: taskPlan.taskPhase,
                        resumedFromRunId: resumeDecision.resumedFromRunId,
                        followUpReason: resumeDecision.followUpReason,
                    }),
                };
                const initialAdvance = (0, task_plan_util_1.resolveTaskPlanInitialAdvance)({
                    plan: taskPlan,
                    allObservations: (0, graph_tool_observations_util_1.allToolObservations)(state),
                    runOwnedObservations: (0, graph_tool_observations_util_1.runOwnedToolObservations)(state),
                    userMessage: ctx.input.latestUserMessage,
                    planRunContext: 'resume',
                    buildMergedObservation: () => summarize.buildSummarizeObservationFromState(state, {
                        taskPlan,
                        scopedTools: state.scopedTools,
                    }),
                });
                const stepsWithPlan = [...state.steps, planStep];
                await runHelpers.updateRun(ctx.input.runId, stepsWithPlan, client_1.AgentRunStatus.running);
                deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, '续接上次未完成任务步骤…\n', 'replace');
                if (initialAdvance) {
                    const workflowSlice = (0, session_resume_workflow_util_1.tryBuildSessionResumeWorkflowSlice)({
                        workflowRun: resumeDecision.workflowRun,
                        taskPlan: initialAdvance.updatedPlan,
                    });
                    return skillFrame.applySkillFrameContext(Object.assign(Object.assign(Object.assign({}, state), { steps: stepsWithPlan, turnExecutionContract: contract, taskPlan: initialAdvance.updatedPlan, planRunContext: 'resume', pendingRespond: (0, turn_respond_util_1.pendingRespondFromObservation)(initialAdvance.summaryObservation) }), (workflowSlice
                        ? {
                            workflowRun: workflowSlice.workflowRun,
                            workflowNodeDefs: workflowSlice.workflowNodeDefs,
                            workflowAwaitingReact: workflowSlice.workflowAwaitingReact,
                        }
                        : {})));
                }
                const workflowSlice = (0, session_resume_workflow_util_1.tryBuildSessionResumeWorkflowSlice)({
                    workflowRun: resumeDecision.workflowRun,
                    taskPlan,
                });
                return skillFrame.applySkillFrameContext(Object.assign(Object.assign(Object.assign({}, state), { steps: stepsWithPlan, turnExecutionContract: contract, taskPlan, planRunContext: 'resume' }), (workflowSlice
                    ? {
                        workflowRun: workflowSlice.workflowRun,
                        workflowNodeDefs: workflowSlice.workflowNodeDefs,
                        workflowAwaitingReact: workflowSlice.workflowAwaitingReact,
                    }
                    : {})));
            }
        }
        if (!ctx.input.enableToolCall) {
            const step = {
                step: stepNum,
                type: 'plan',
                output: runHelpers.normalizeJsonLike({
                    skipped: true,
                    reason: 'tools_disabled',
                }),
            };
            const stepsWithSkip = [...state.steps, step];
            await runHelpers.updateRun(ctx.input.runId, stepsWithSkip, client_1.AgentRunStatus.running);
            return runHelpers.buildTurnRespondState(state, stepsWithSkip, {
                kind: 'unsupported_scope',
                userMessage: ctx.input.latestUserMessage,
                payload: { readinessReason: 'tools_disabled' },
            });
        }
        const pageContextForPlan = (_c = (_b = state.pageContext) !== null && _b !== void 0 ? _b : ctx.input.pageContext) !== null && _c !== void 0 ? _c : null;
        const planHostBundle = await runHelpers.loadScopedHostTools(ctx.input, pageContextForPlan, (_e = (_d = contract.plan.explicitSkillId) !== null && _d !== void 0 ? _d : ctx.input.requestedSkillId) !== null && _e !== void 0 ? _e : null);
        if (state.scopedTools.length === 0 &&
            planHostBundle.scopedHostTools.length === 0) {
            (0, host_tool_resolve_debug_util_1.logHostToolResolve)('plan_skip_no_scoped_tools', {
                runId: ctx.input.runId,
                sessionId: ctx.input.sessionId,
                agentId: ctx.input.agentId,
                requestedSkillId: (_f = ctx.input.requestedSkillId) !== null && _f !== void 0 ? _f : null,
                pageContext: pageContextForPlan,
                httpScopedToolCount: state.scopedTools.length,
                httpScopedToolNames: state.scopedTools.map((tool) => tool.name),
                hostScopedToolCount: planHostBundle.scopedHostTools.length,
                hostScopedToolNames: planHostBundle.scopedHostTools.map((tool) => tool.name),
                requestedSkillToolIds: (_h = (_g = ctx.requestedSkillCtx) === null || _g === void 0 ? void 0 : _g.scoped.skillToolIds) !== null && _h !== void 0 ? _h : null,
                requestedSkillHostToolIds: (_k = (_j = ctx.requestedSkillCtx) === null || _j === void 0 ? void 0 : _j.skill.hostToolIds) !== null && _k !== void 0 ? _k : null,
            });
            const step = {
                step: stepNum,
                type: 'plan',
                output: runHelpers.normalizeJsonLike({
                    skipped: true,
                    reason: 'no_scoped_tools',
                }),
            };
            const stepsWithSkip = [...state.steps, step];
            await runHelpers.updateRun(ctx.input.runId, stepsWithSkip, client_1.AgentRunStatus.running);
            return runHelpers.buildTurnRespondState(state, stepsWithSkip, {
                kind: 'unsupported_scope',
                userMessage: ctx.input.latestUserMessage,
                payload: { readinessReason: 'no_scoped_tools' },
            });
        }
        const goaForPlan = (_l = ctx.getSessionGoa()) !== null && _l !== void 0 ? _l : (await deps.goaService.getPayload(ctx.input.sessionId));
        const sessionWorkingMemory = (0, session_goa_plan_projection_util_1.buildPlanSessionWorkingMemory)({
            goa: goaForPlan,
            scopedTools: state.scopedTools,
            runOwnedObservations: (0, graph_tool_observations_util_1.runOwnedToolObservations)(state),
        });
        if (contract.plan.abandonActiveTaskOnFreshPlan) {
            if (((_m = goaForPlan.activeTask) === null || _m === void 0 ? void 0 : _m.status) === 'in_progress' ||
                ((_o = goaForPlan.activeTask) === null || _o === void 0 ? void 0 : _o.status) === 'awaiting_confirmation') {
                await deps.goaService.abandonActiveTask(ctx.input.sessionId);
                ctx.setSessionGoa(await deps.goaService.getPayload(ctx.input.sessionId));
            }
        }
        deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, ctx.requestedSkillCtx
            ? '正在按所选技能规划任务步骤…\n'
            : '正在规划任务步骤…\n', 'replace');
        const availableSkills = await deps.skillService.resolveSkillsForOuterPlan({
            agentId: ctx.input.agentId,
            userId: ctx.input.userId,
            appClientId: ctx.input.appClientId,
            scopedTools: state.scopedTools,
            scopedHostToolIds: planHostBundle.scopedHostTools.map((tool) => tool.id),
            requestedSkillId: (_p = contract.plan.explicitSkillId) !== null && _p !== void 0 ? _p : ctx.input.requestedSkillId,
        });
        const hostBundle = planHostBundle;
        const availableHostTools = hostBundle.scopedHostTools.map((tool) => ({
            name: tool.name,
            description: tool.description,
        }));
        const requestedSkillDetail = (0, outer_plan_skills_util_1.toRequestedSkillPlanDetail)(contract.plan.explicitSkillId != null
            ? availableSkills.find((skill) => skill.id === contract.plan.explicitSkillId)
            : undefined);
        const scopedToolSummaries = (0, task_plan_util_1.summarizeScopedToolsForPlan)(state.scopedTools);
        const scopedHostToolIds = planHostBundle.scopedHostTools.map((tool) => tool.id);
        const autoSkillSelection = contract.plan.skillSelect === 'page_host'
            ? (0, outer_plan_skill_resolve_util_1.resolveAutoOuterPlanSkill)({
                availableSkills,
                scopedHostToolIds,
            })
            : null;
        const resolvedPlan = await (0, resolve_plan_from_contract_util_1.resolvePlanFromContract)({
            contract,
            autoSkillCandidate: autoSkillSelection,
            llmService: deps.llmService,
            promptRegistry: deps.promptRegistry,
            scope: ctx.promptScope,
            planInput: {
                userMessage: ctx.input.latestUserMessage,
                scopedToolSummaries,
                availableHostTools,
                availableSkills: (0, outer_plan_skills_util_1.summarizeAvailableSkillsForOuterPlan)(availableSkills, state.scopedTools, planHostBundle.scopedHostTools.map((tool) => tool.id)),
                sessionWorkingMemory,
                requestedSkillId: (_q = contract.plan.explicitSkillId) !== null && _q !== void 0 ? _q : undefined,
                requestedSkillDetail,
            },
        });
        const skillSelectMeta = (0, outer_plan_skill_resolve_util_1.resolveOuterPlanSkillSelectMethod)({
            autoSelection: autoSkillSelection,
            requestedSkillId: contract.plan.explicitSkillId,
            planMethod: resolvedPlan.method,
        });
        const outerSkillSelectMethod = (_r = resolvedPlan.outerSkillSelectMethod) !== null && _r !== void 0 ? _r : skillSelectMeta.outerSkillSelectMethod;
        const autoSelectedSkillId = (_s = resolvedPlan.autoSelectedSkillId) !== null && _s !== void 0 ? _s : skillSelectMeta.autoSelectedSkillId;
        const taskPlan = (0, task_plan_util_1.applyOuterPlanSelectMetadata)(resolvedPlan.plan, {
            outerSkillSelectMethod,
            autoSelectedSkillId,
        });
        const outerFrameCount = taskPlan.frames.length;
        const initialAdvance = (0, task_plan_util_1.resolveTaskPlanInitialAdvance)({
            plan: taskPlan,
            allObservations: (0, graph_tool_observations_util_1.allToolObservations)(state),
            runOwnedObservations: (0, graph_tool_observations_util_1.runOwnedToolObservations)(state),
            userMessage: ctx.input.latestUserMessage,
            planRunContext: (0, plan_observation_scope_util_1.planRunContextFromState)(state),
            buildMergedObservation: () => summarize.buildSummarizeObservationFromState(state, {
                taskPlan,
                scopedTools: state.scopedTools,
            }),
        });
        const planState = Object.assign(Object.assign({}, state), { turnExecutionContract: contract, taskPlan: (_t = initialAdvance === null || initialAdvance === void 0 ? void 0 : initialAdvance.updatedPlan) !== null && _t !== void 0 ? _t : taskPlan, scopedHostTools: hostBundle.scopedHostTools, scopedHostLangChainTools: hostBundle.scopedHostLangChainTools, skillApplied: false, activeSkillId: null, activeSkillPrompt: null, activeSkillName: null, activeSkillDescription: null, activeSkillConfig: null, activeSkillRiskLevel: null, pendingRespond: initialAdvance
                ? (0, turn_respond_util_1.pendingRespondFromObservation)(initialAdvance.summaryObservation)
                : null });
        const expandedState = await skillFrame.applySkillFrameContext(planState);
        const expandedTaskPlan = (_u = expandedState.taskPlan) !== null && _u !== void 0 ? _u : taskPlan;
        const skillFrameExpanded = expandedTaskPlan.frames.length > outerFrameCount;
        const prunedHostToolStepIds = (0, host_tool_plan_util_1.collectRemovedPendingHostToolStepIds)(planState.taskPlan, expandedTaskPlan);
        const planStep = {
            step: stepNum,
            type: 'plan',
            output: runHelpers.normalizeJsonLike((0, plan_sync_util_1.buildPlanRunStepOutput)({
                taskPlan: expandedTaskPlan,
                method: resolvedPlan.method,
                llmFallbackReason: resolvedPlan.llmFallbackReason,
                droppedHostToolStepIds: resolvedPlan.droppedHostToolStepIds,
                prunedHostToolStepIds,
                availableHostToolCount: hostBundle.scopedHostTools.length,
                availableHostToolNames: hostBundle.scopedHostTools.map((tool) => tool.name),
                availableSkillIds: availableSkills.map((skill) => skill.id),
                requestedSkillId: contract.plan.explicitSkillId,
                requestedSkillEnforced: (0, skill_intent_alignment_util_1.shouldEnforceRequestedSkillFromContract)({
                    scopedToolsSource: contract.plan.scopedToolsSource,
                }),
                sessionWorkingMemoryIncluded: sessionWorkingMemory != null,
                skillFrameExpanded,
                outerFrameCount,
                outerSkillSelectMethod,
                autoSelectedSkillId,
                turnRoute: contract.routing.route,
                turnSkillSelect: contract.plan.skillSelect,
                pageContextPlan: contract.plan.pageContextPlan,
                pageContextApplies: contract.plan.pageContextUsage.applies,
                pageContextTaskKind: contract.routing.pageContextTaskKind,
                pageContextDataSufficiency: contract.plan.pageContextUsage.dataSufficiency,
            })),
        };
        const stepsWithPlan = [...state.steps, planStep];
        await runHelpers.updateRun(ctx.input.runId, stepsWithPlan, client_1.AgentRunStatus.running);
        return Object.assign(Object.assign({}, expandedState), { steps: stepsWithPlan });
    };
}
exports.createPlanNode = createPlanNode;
//# sourceMappingURL=plan.node.js.map