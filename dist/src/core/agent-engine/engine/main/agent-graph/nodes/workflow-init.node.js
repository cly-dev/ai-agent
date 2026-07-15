"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkflowInitNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const compile_plan_to_workflow_util_1 = require("../../../../../workflow/compile-plan-to-workflow.util");
const compile_task_plan_from_workflow_util_1 = require("../../../../../workflow/compile-task-plan-from-workflow.util");
const validate_workflow_against_scope_util_1 = require("../../../../../workflow/validate-workflow-against-scope.util");
const workflow_init_audit_util_1 = require("../../../../../workflow/workflow-init-audit.util");
const workflow_init_skill_util_1 = require("../../../../../workflow/workflow-init-skill.util");
const workflow_resume_util_1 = require("../../../../../workflow/workflow-resume.util");
const workflow_debug_util_1 = require("../../../../../workflow/trace/workflow-debug.util");
const workflow_init_skip_util_1 = require("../../../../../workflow/workflow-init-skip.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const plan_node_1 = require("./plan.node");
function skipIfTriggerPermissionDenied(bundle, state, nodes, allowedToolIds, skillId, userMessage) {
    const decision = bundle.deps.approvalTriggerPermission.evaluateForNodes({
        nodes,
        allowedToolIds,
    });
    if (decision.allowed === true) {
        return null;
    }
    const missingToolIds = decision.missingToolIds;
    bundle.deps.logger.warn(`workflow_init trigger permission denied runId=${bundle.ctx.input.runId} missingToolIds=${missingToolIds.join(',')}`);
    (0, workflow_debug_util_1.logWorkflowDebug)('init_trigger_permission_denied', {
        runId: bundle.ctx.input.runId,
        sessionId: bundle.ctx.input.sessionId,
        missingToolIds,
        skillId,
    });
    return annotateWorkflowInitSkipped(state, 'trigger_permission_denied', { skillId }, userMessage);
}
function annotateWorkflowInitSkipped(state, reason, extra, userMessage) {
    var _a;
    const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps);
    const pendingRespond = (_a = state.pendingRespond) !== null && _a !== void 0 ? _a : (0, workflow_init_skip_util_1.buildWorkflowInitSkippedPendingRespond)({
        reason,
        userMessage: userMessage !== null && userMessage !== void 0 ? userMessage : '',
    });
    return Object.assign(Object.assign(Object.assign({}, state), { steps: (0, workflow_init_audit_util_1.appendWorkflowInitSkippedStep)(state.steps, stepNum, {
            reason,
            skillId: extra === null || extra === void 0 ? void 0 : extra.skillId,
            nodeIds: extra === null || extra === void 0 ? void 0 : extra.nodeIds,
        }) }), (pendingRespond ? { pendingRespond } : {}));
}
function finalizeWorkflowInit(state, input) {
    var _a, _b, _c, _d, _e, _f;
    const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps);
    const output = (0, workflow_init_audit_util_1.buildWorkflowInitRunStepOutput)({
        workflowRun: input.workflowRun,
        nodes: input.nodes,
        source: input.source,
        skillId: input.skillId,
    });
    const steps = (0, workflow_init_audit_util_1.appendWorkflowInitRunStep)(state.steps, stepNum, output);
    let taskPlan = state.taskPlan;
    if (input.source === 'workflow_db') {
        const fromNodes = (0, compile_task_plan_from_workflow_util_1.compileTaskPlanFromWorkflow)({
            nodes: input.nodes,
            originalUserRequest: ((_b = (_a = state.taskPlan) === null || _a === void 0 ? void 0 : _a.originalUserRequest) === null || _b === void 0 ? void 0 : _b.trim()) ||
                ctxMessageFallback(state),
            goal: (_c = state.taskPlan) === null || _c === void 0 ? void 0 : _c.goal,
        });
        taskPlan = fromNodes !== null && fromNodes !== void 0 ? fromNodes : taskPlan;
    }
    else if (taskPlan) {
        taskPlan =
            (_d = (0, workflow_resume_util_1.hydrateTaskPlanWithWorkflowDefs)({
                taskPlan,
                workflowNodeDefs: input.nodes,
            })) !== null && _d !== void 0 ? _d : taskPlan;
    }
    return Object.assign(Object.assign({}, state), { steps,
        taskPlan, workflowRun: input.workflowRun, workflowNodeDefs: input.nodes, workflowNodeOutputs: (_e = state.workflowNodeOutputs) !== null && _e !== void 0 ? _e : {}, workflowAwaitingReact: (_f = input.workflowAwaitingReact) !== null && _f !== void 0 ? _f : false });
}
function ctxMessageFallback(state) {
    var _a, _b, _c, _d;
    return (((_b = (_a = state.taskPlan) === null || _a === void 0 ? void 0 : _a.originalUserRequest) === null || _b === void 0 ? void 0 : _b.trim()) ||
        ((_d = (_c = state.taskPlan) === null || _c === void 0 ? void 0 : _c.goal) === null || _d === void 0 ? void 0 : _d.trim()) ||
        '');
}
function createWorkflowInitNode(bundle) {
    const planNode = (0, plan_node_1.createPlanNode)(bundle);
    const { deps, ctx, runHelpers } = bundle;
    const debugBase = {
        runId: ctx.input.runId,
        sessionId: ctx.input.sessionId,
        turnId: ctx.input.turnId,
        appClientId: ctx.input.appClientId,
        agentId: ctx.input.agentId,
    };
    return async (state) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const afterPlan = state.taskPlan ? state : await planNode(state);
        if (afterPlan.finished || !afterPlan.taskPlan) {
            (0, workflow_debug_util_1.logWorkflowDebug)('init_skipped', Object.assign(Object.assign({}, debugBase), { reason: afterPlan.finished ? 'finished' : 'no_task_plan', finished: afterPlan.finished }));
            return afterPlan.finished
                ? afterPlan
                : annotateWorkflowInitSkipped(afterPlan, 'no_task_plan', undefined, ctx.input.latestUserMessage);
        }
        if ((0, workflow_resume_util_1.isResumableWorkflowRun)(afterPlan.workflowRun) &&
            afterPlan.workflowNodeDefs &&
            afterPlan.workflowNodeDefs.length > 0) {
            (0, workflow_debug_util_1.logWorkflowDebug)('init_restore_graph_state', Object.assign(Object.assign({}, debugBase), { workflowRun: afterPlan.workflowRun, nodeDefCount: afterPlan.workflowNodeDefs.length, workflowAwaitingReact: afterPlan.workflowAwaitingReact === true }));
            return Object.assign(Object.assign({}, afterPlan), { workflowAwaitingReact: afterPlan.workflowAwaitingReact === true ||
                    (0, workflow_resume_util_1.shouldAwaitReactOnWorkflowResume)(afterPlan.workflowRun, afterPlan.workflowNodeDefs) });
        }
        const scope = {
            allowedToolIds: (_b = (_a = bundle.ctx.input.allowedToolIds) !== null && _a !== void 0 ? _a : afterPlan.scopedAllowedToolIds) !== null && _b !== void 0 ? _b : [],
            allowedHostToolIds: ((_c = afterPlan.scopedHostTools) !== null && _c !== void 0 ? _c : []).map((row) => row.id),
        };
        const boundSkillId = (0, workflow_init_skill_util_1.resolveWorkflowBoundSkillId)(bundle, afterPlan);
        if (afterPlan.planRunContext === 'resume') {
            const savedRun = (_e = (_d = bundle.ctx.getSessionGoa()) === null || _d === void 0 ? void 0 : _d.activeTask) === null || _e === void 0 ? void 0 : _e.workflowRun;
            if ((0, workflow_resume_util_1.isResumableWorkflowRun)(savedRun)) {
                const graph = await (0, workflow_resume_util_1.resolveWorkflowGraphForResume)(deps.prisma, {
                    savedRun,
                    taskPlan: afterPlan.taskPlan,
                    appClientId: ctx.input.appClientId,
                    scope,
                });
                if (graph) {
                    const resumed = (0, workflow_resume_util_1.buildWorkflowResumeGraphSlice)({
                        savedRun,
                        nodes: graph.nodes,
                        edges: graph.edges,
                    });
                    const next = finalizeWorkflowInit(afterPlan, {
                        workflowRun: resumed.workflowRun,
                        nodes: resumed.workflowNodeDefs,
                        source: 'resume',
                        workflowAwaitingReact: resumed.workflowAwaitingReact,
                    });
                    await runHelpers.updateRun(ctx.input.runId, next.steps, client_1.AgentRunStatus.running);
                    (0, workflow_debug_util_1.logWorkflowDebug)('init_resume_goa', Object.assign(Object.assign({}, debugBase), { outcome: 'ok', workflowRun: next.workflowRun, source: 'resume' }));
                    return next;
                }
                deps.logger.warn(`workflow_init resume graph mismatch runId=${ctx.input.runId} workflowId=${savedRun.workflowId}`);
                (0, workflow_debug_util_1.logWorkflowDebug)('init_resume_goa', Object.assign(Object.assign({}, debugBase), { outcome: 'defs_mismatch', workflowId: savedRun.workflowId, workflowRun: savedRun }));
                return annotateWorkflowInitSkipped(afterPlan, 'resume_defs_mismatch', { skillId: boundSkillId }, ctx.input.latestUserMessage);
            }
        }
        if (boundSkillId != null) {
            const skillWorkflow = await (0, workflow_init_skill_util_1.resolveSkillWorkflowForInit)(deps.prisma, {
                skillId: boundSkillId,
                appClientId: ctx.input.appClientId,
            });
            if (skillWorkflow.kind === 'loaded') {
                const denied = skipIfTriggerPermissionDenied(bundle, afterPlan, skillWorkflow.workflow.nodes, scope.allowedToolIds, boundSkillId, ctx.input.latestUserMessage);
                if (denied) {
                    await runHelpers.updateRun(ctx.input.runId, denied.steps, client_1.AgentRunStatus.running);
                    return denied;
                }
                const next = finalizeWorkflowInit(afterPlan, {
                    workflowRun: skillWorkflow.workflow.workflowRun,
                    nodes: skillWorkflow.workflow.nodes,
                    source: 'workflow_db',
                    skillId: boundSkillId,
                });
                await runHelpers.updateRun(ctx.input.runId, next.steps, client_1.AgentRunStatus.running);
                (0, workflow_debug_util_1.logWorkflowDebug)('init_db_load', Object.assign(Object.assign({}, debugBase), { outcome: 'ok', skillId: boundSkillId, workflowRun: next.workflowRun, source: 'workflow_db' }));
                return next;
            }
            if (skillWorkflow.kind === 'load_failed') {
                deps.logger.warn(`workflow_init db load failed runId=${ctx.input.runId} skillId=${boundSkillId} workflowId=${skillWorkflow.workflowId} reason=${skillWorkflow.reason}`);
                (0, workflow_debug_util_1.logWorkflowDebug)('init_db_load', Object.assign(Object.assign({}, debugBase), { outcome: 'failed', skillId: boundSkillId, workflowId: skillWorkflow.workflowId, failureReason: skillWorkflow.reason }));
                return annotateWorkflowInitSkipped(afterPlan, 'db_load_failed', { skillId: boundSkillId }, ctx.input.latestUserMessage);
            }
            if (skillWorkflow.kind === 'scope_incompatible') {
                deps.logger.warn(`workflow_init scope incompatible with bound workflow runId=${ctx.input.runId} skillId=${boundSkillId} workflowId=${skillWorkflow.workflowId}; falling back to plan_compile`);
                (0, workflow_debug_util_1.logWorkflowDebug)('init_db_load_scope_fallback', Object.assign(Object.assign({}, debugBase), { skillId: boundSkillId, workflowId: skillWorkflow.workflowId }));
            }
            else {
                (0, workflow_debug_util_1.logWorkflowDebug)('init_plan_compile_deferred', Object.assign(Object.assign({}, debugBase), { skillId: boundSkillId, reason: 'no_workflow_binding' }));
            }
        }
        const compiled = (0, compile_plan_to_workflow_util_1.compileTaskPlanToWorkflow)({
            plan: afterPlan.taskPlan,
            workflowId: 0,
            version: 1,
            resolveMethod: afterPlan.planRunContext === 'resume' ? 'session_resume' : undefined,
        });
        if (!compiled) {
            return annotateWorkflowInitSkipped(afterPlan, 'compile_empty', { skillId: boundSkillId }, ctx.input.latestUserMessage);
        }
        const scopeCompatible = (0, validate_workflow_against_scope_util_1.isWorkflowCompatibleWithScope)({
            nodes: compiled.nodes,
            scope,
        });
        if (!scopeCompatible) {
            deps.logger.warn(`workflow_init scope mismatch runId=${ctx.input.runId}; proceeding with compiled workflow (runtime scope enforced at execute)`);
            (0, workflow_debug_util_1.logWorkflowDebug)('init_scope_mismatch', Object.assign(Object.assign({}, debugBase), { skillId: boundSkillId, nodeIds: compiled.nodes.map((row) => row.id), outcome: 'proceed_with_warning' }));
        }
        const denied = skipIfTriggerPermissionDenied(bundle, afterPlan, compiled.nodes, scope.allowedToolIds, boundSkillId, ctx.input.latestUserMessage);
        if (denied) {
            await runHelpers.updateRun(ctx.input.runId, denied.steps, client_1.AgentRunStatus.running);
            return denied;
        }
        const next = finalizeWorkflowInit(afterPlan, {
            workflowRun: compiled.workflowRun,
            nodes: compiled.nodes,
            source: 'plan_compile',
            skillId: boundSkillId,
        });
        await runHelpers.updateRun(ctx.input.runId, next.steps, client_1.AgentRunStatus.running);
        (0, workflow_debug_util_1.logWorkflowDebug)('init_plan_compile', Object.assign(Object.assign({}, debugBase), { outcome: 'ok', skillId: boundSkillId, compiledFrom: (_g = (_f = next.workflowRun) === null || _f === void 0 ? void 0 : _f.compiledFrom) !== null && _g !== void 0 ? _g : null, workflowRun: next.workflowRun, source: 'plan_compile' }));
        return next;
    };
}
exports.createWorkflowInitNode = createWorkflowInitNode;
//# sourceMappingURL=workflow-init.node.js.map