"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReadinessNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const turn_readiness_util_1 = require("../../../turn/turn-readiness.util");
const turn_respond_util_1 = require("../../../turn/turn-respond.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const plan_observation_scope_util_1 = require("../../plan/plan-observation-scope.util");
const plan_sync_util_1 = require("../../plan/plan-sync.util");
const task_plan_util_1 = require("../../plan/task-plan.util");
const plan_summarize_gate_util_1 = require("../../plan/plan-summarize-gate.util");
const plan_draft_summarize_util_1 = require("../../plan-present/plan-draft-summarize.util");
const graph_tool_observations_util_1 = require("../../../graph-tool-observations.util");
const agent_run_audit_util_1 = require("../../run/agent-run-audit.util");
function createReadinessNode(bundle) {
    const { deps, ctx, runHelpers, skillFrame, summarize } = bundle;
    return async (state) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const frameCountBefore = (_b = (_a = state.taskPlan) === null || _a === void 0 ? void 0 : _a.frames.length) !== null && _b !== void 0 ? _b : 0;
        const stateAfterSkill = await skillFrame.applySkillFrameContext(state);
        if ((0, turn_respond_util_1.hasPendingRespond)(stateAfterSkill.pendingRespond)) {
            return stateAfterSkill;
        }
        let stateForReadiness = stateAfterSkill;
        const pendingPlanStep = (0, task_plan_util_1.resolvePlanExecutionStep)({
            taskPlan: stateForReadiness.taskPlan,
            workflowRun: stateForReadiness.workflowRun,
            workflowNodeDefs: stateForReadiness.workflowNodeDefs,
        });
        if ((0, task_plan_util_1.isPlanTextGenerationStep)(pendingPlanStep.step, pendingPlanStep.workflowNodeAction)) {
            const summarizeGate = (0, plan_summarize_gate_util_1.assessPlanSummarizeGate)({
                plan: stateForReadiness.taskPlan,
                observationBuckets: (0, plan_observation_scope_util_1.planObservationBucketsFromState)(stateForReadiness),
                scopedTools: stateForReadiness.scopedTools,
                workflowRun: stateForReadiness.workflowRun,
                workflowNodeDefs: stateForReadiness.workflowNodeDefs,
            });
            if (summarizeGate.status === 'rewind_gather') {
                stateForReadiness = (0, plan_summarize_gate_util_1.applyPlanSummarizeRewind)(stateForReadiness, summarizeGate);
            }
            else if (summarizeGate.status === 'allowed') {
                deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, '正在按任务计划生成结果…\n', 'delta');
                return Object.assign(Object.assign({}, stateForReadiness), { pendingRespond: (0, turn_respond_util_1.pendingRespondFromObservation)((0, task_plan_util_1.buildPlanSummarizeObservation)({
                        userMessage: ctx.input.latestUserMessage,
                        summarizeObservation: summarize.buildSummarizeObservationFromState(stateForReadiness, {
                            taskPlan: stateForReadiness.taskPlan,
                            scopedTools: stateForReadiness.scopedTools,
                        }),
                    })) });
            }
        }
        const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(stateForReadiness.steps);
        const pageContext = (_d = (_c = stateForReadiness.pageContext) !== null && _c !== void 0 ? _c : ctx.input.pageContext) !== null && _d !== void 0 ? _d : null;
        const readinessResult = await (0, turn_readiness_util_1.evaluateExecutionReadiness)({
            userMessage: ctx.input.latestUserMessage,
            taskPlan: stateForReadiness.taskPlan,
            scopedTools: stateForReadiness.scopedTools,
            observationBuckets: (0, plan_observation_scope_util_1.planObservationBucketsFromState)(stateForReadiness),
            skillConfig: stateForReadiness.activeSkillConfig,
            resumeFromWriteConfirm: ctx.input.resumeFromWriteConfirm,
            pageContext,
            pageContextUsage: (_f = (_e = stateForReadiness.turnExecutionContract) === null || _e === void 0 ? void 0 : _e.plan.pageContextUsage) !== null && _f !== void 0 ? _f : null,
            workflowRun: stateForReadiness.workflowRun,
        });
        const readinessStep = (0, agent_run_audit_util_1.maybeTagWorkflowReactInternalStep)({
            step: stepNum,
            type: 'readiness',
            output: runHelpers.normalizeJsonLike({
                status: readinessResult.status,
                reason: readinessResult.reason,
            }),
        }, stateAfterSkill);
        const frameExpanded = ((_h = (_g = stateAfterSkill.taskPlan) === null || _g === void 0 ? void 0 : _g.frames.length) !== null && _h !== void 0 ? _h : 0) > frameCountBefore;
        const frameSyncStep = frameExpanded && stateAfterSkill.taskPlan
            ? (() => {
                var _a, _b, _c, _d;
                const raw = (0, plan_sync_util_1.buildSkillFrameExpandedPlanSyncStep)({
                    step: stepNum + 1,
                    taskPlan: stateAfterSkill.taskPlan,
                    availableHostToolCount: (_b = (_a = stateAfterSkill.scopedHostTools) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0,
                    availableHostToolNames: (_d = (_c = stateAfterSkill.scopedHostTools) === null || _c === void 0 ? void 0 : _c.map((tool) => tool.name)) !== null && _d !== void 0 ? _d : [],
                    frameCountBefore,
                    planRunContext: (0, plan_observation_scope_util_1.planRunContextFromState)(stateAfterSkill),
                });
                const output = runHelpers.normalizeJsonLike(raw.output);
                return Object.assign({ step: raw.step, type: raw.type }, (output !== undefined ? { output } : {}));
            })()
            : null;
        const steps = [
            ...stateForReadiness.steps,
            readinessStep,
            ...(frameSyncStep ? [frameSyncStep] : []),
        ];
        await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
        const pendingToolStep = (0, task_plan_util_1.getPendingPlanToolStep)(stateForReadiness.taskPlan, stateForReadiness.workflowRun);
        if ((0, task_plan_util_1.isPlanWriteExecutionStepInMutationFlow)(pendingToolStep)) {
            const reuse = (0, plan_draft_summarize_util_1.resolvePendingWriteForPlanWriteStepResult)({
                observations: (0, graph_tool_observations_util_1.allToolObservations)(stateForReadiness),
                taskPlan: stateForReadiness.taskPlan,
                scopedTools: stateForReadiness.scopedTools,
                pageContext: (_j = stateForReadiness.pageContext) !== null && _j !== void 0 ? _j : null,
            });
            const diagnosticDetail = reuse.gateDiagnostic
                ? (0, plan_draft_summarize_util_1.formatComposedWriteGateDiagnosticForLog)({
                    call: reuse.call,
                    failureReason: reuse.failureReason,
                    diagnostic: reuse.gateDiagnostic,
                })
                : `failureReason=${(_k = reuse.failureReason) !== null && _k !== void 0 ? _k : 'none'}`;
            deps.logger.log(`readiness write-fallback probe runId=${ctx.input.runId} step=${pendingToolStep.id} incomingPendingToolCalls=${stateAfterSkill.pendingToolCalls.length} reuse=${reuse.call ? 'yes' : 'no'} source=${(_l = reuse.source) !== null && _l !== void 0 ? _l : 'none'} ${diagnosticDetail}`);
        }
        if (readinessResult.status === 'respond') {
            return Object.assign(Object.assign({}, stateForReadiness), { steps, pendingRespond: (0, turn_respond_util_1.pendingRespondFromTurn)(readinessResult.request) });
        }
        return Object.assign(Object.assign({}, stateForReadiness), { steps });
    };
}
exports.createReadinessNode = createReadinessNode;
//# sourceMappingURL=readiness.node.js.map