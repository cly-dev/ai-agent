"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAndRunAgentGraph = void 0;
const langgraph_1 = require("@langchain/langgraph");
const client_1 = require("../../../../../../generated/prisma/client");
const workflow_debug_util_1 = require("../../../../workflow/trace/workflow-debug.util");
const workflow_graph_routing_util_1 = require("../../../../workflow/workflow-graph-routing.util");
const turn_graph_util_1 = require("../../turn/turn-graph.util");
const turn_execution_contract_util_1 = require("../../turn/turn-execution-contract.util");
const paged_list_gather_util_1 = require("../../gather/paged-list-gather.util");
const plan_observation_scope_util_1 = require("../plan/plan-observation-scope.util");
const graph_state_annotation_1 = require("./state/graph-state.annotation");
const runtime_1 = require("./runtime");
const summarize_1 = require("./summarize");
const turn_route_node_1 = require("./nodes/turn-route.node");
const tools_node_1 = require("./nodes/tools.node");
const result_check_node_1 = require("./nodes/result-check.node");
const summarize_node_1 = require("./nodes/summarize.node");
const workflow_init_node_1 = require("./nodes/workflow-init.node");
const execute_node_node_1 = require("./nodes/execute-node.node");
const workflow_advance_node_1 = require("./nodes/workflow-advance.node");
const workflow_react_node_1 = require("./nodes/workflow-react.node");
const turn_scoped_tools_util_1 = require("../../turn/turn-scoped-tools.util");
function withRunCancellation(deps, input, node) {
    const generation = input.runGeneration;
    if (generation == null) {
        deps.logger.warn(`runGeneration missing for runId=${input.runId}; graph nodes run without cancellation guard`);
        return node;
    }
    return async (state) => {
        deps.sessionRunCoordinator.throwIfAborted(input.sessionId, input.runId, generation);
        return node(state);
    };
}
function resolveWorkflowEdge(route) {
    if (route === '__end__') {
        return langgraph_1.END;
    }
    return route;
}
async function buildAndRunAgentGraph(deps, input) {
    var _a, _b, _c, _d, _e;
    (0, workflow_debug_util_1.logWorkflowGraphBoot)({
        runId: input.runId,
        sessionId: input.sessionId,
    });
    const requestedSkillCtx = input.requestedSkillId != null
        ? await deps.requestedSkillRun.loadRunContext({
            agentId: input.agentId,
            userId: input.userId,
            appClientId: input.appClientId,
            skillId: input.requestedSkillId,
            allowedTools: input.tools,
            toolBuildCtx: input.toolBuildCtx,
            runId: input.runId,
            sessionId: input.sessionId,
        })
        : null;
    let sessionGoa = input.resumeFromWriteConfirm || input.resumeFromWriteGateRetry
        ? null
        : await deps.goaService.ensurePayload(input.sessionId);
    const sessionPriorObservations = input.resumeFromWriteConfirm || input.resumeFromWriteGateRetry
        ? []
        : deps.goaService.buildPriorToolObservationsForGraph(sessionGoa);
    const ctx = {
        input,
        requestedSkillCtx,
        getSessionGoa: () => sessionGoa,
        setSessionGoa: (goa) => {
            sessionGoa = goa;
        },
        promptScope: {
            appClientId: input.appClientId,
            agentId: input.agentId,
        },
    };
    const runHelpers = (0, runtime_1.bindRunContextHelpers)((0, runtime_1.createAgentGraphRunHelpers)(deps), ctx);
    const skillFrame = (0, runtime_1.createAgentGraphSkillFrameHelpers)(deps, ctx, runHelpers);
    const decision = (0, runtime_1.createAgentGraphDecisionHelpers)(deps);
    const summarize = (0, summarize_1.createAgentGraphSummarizeHelpers)(deps);
    const hostToolHandle = (0, runtime_1.createAgentGraphHostToolHandleHelpers)(deps, runHelpers, skillFrame, decision, ctx);
    const bundle = {
        deps,
        ctx,
        runHelpers,
        skillFrame,
        hostToolHandle,
        decision,
        summarize,
    };
    const State = (0, graph_state_annotation_1.createAgentGraphStateAnnotation)();
    const wrap = (node) => withRunCancellation(deps, input, node);
    const graph = new langgraph_1.StateGraph(State)
        .addNode('turnRoute', wrap((0, turn_route_node_1.createTurnRouteNode)(bundle)))
        .addNode('workflow_init', wrap((0, workflow_init_node_1.createWorkflowInitNode)(bundle)))
        .addNode('execute_node', wrap((0, execute_node_node_1.createExecuteNodeNode)(bundle)))
        .addNode('workflow_advance', wrap((0, workflow_advance_node_1.createWorkflowAdvanceNode)(bundle)))
        .addNode('workflow_react', wrap((0, workflow_react_node_1.createWorkflowReactNode)(bundle)))
        .addNode('tools', wrap((0, tools_node_1.createToolsNode)(bundle)))
        .addNode('resultCheck', wrap((0, result_check_node_1.createResultCheckNode)(bundle)))
        .addNode('summarize', wrap((0, summarize_node_1.createSummarizeNode)(bundle)))
        .addConditionalEdges(langgraph_1.START, (s) => {
        var _a, _b;
        if (input.resumeFromWriteGateRetry) {
            if (((_a = s.workflowRun) === null || _a === void 0 ? void 0 : _a.status) === 'running' &&
                s.workflowRun.currentNodeId) {
                const current = (0, workflow_graph_routing_util_1.getCurrentWorkflowNode)(s);
                if ((current === null || current === void 0 ? void 0 : current.status) === 'pending' || (current === null || current === void 0 ? void 0 : current.status) === 'running') {
                    return 'execute_node';
                }
                return 'workflow_advance';
            }
            return 'resultCheck';
        }
        if (input.resumeFromWriteConfirm) {
            if ((0, turn_graph_util_1.shouldRouteToRespond)(s)) {
                return 'summarize';
            }
            if (((_b = s.workflowRun) === null || _b === void 0 ? void 0 : _b.status) === 'running' &&
                s.workflowRun.currentNodeId) {
                const current = (0, workflow_graph_routing_util_1.getCurrentWorkflowNode)(s);
                if ((current === null || current === void 0 ? void 0 : current.status) === 'pending' || (current === null || current === void 0 ? void 0 : current.status) === 'running') {
                    return 'execute_node';
                }
                return 'workflow_advance';
            }
            return 'resultCheck';
        }
        return 'turnRoute';
    })
        .addConditionalEdges('turnRoute', (s) => {
        if (s.finished) {
            return langgraph_1.END;
        }
        if ((0, turn_graph_util_1.shouldRouteToRespond)(s)) {
            return 'summarize';
        }
        return 'workflow_init';
    })
        .addConditionalEdges('workflow_init', (s) => resolveWorkflowEdge((0, workflow_graph_routing_util_1.routeAfterWorkflowInit)(s)))
        .addConditionalEdges('execute_node', (s) => resolveWorkflowEdge((0, workflow_graph_routing_util_1.routeAfterExecuteNode)(s)))
        .addConditionalEdges('workflow_react', (s) => resolveWorkflowEdge((0, workflow_graph_routing_util_1.routeAfterWorkflowReact)(s)))
        .addConditionalEdges('workflow_advance', (s) => resolveWorkflowEdge((0, workflow_graph_routing_util_1.routeAfterWorkflowAdvance)(s)))
        .addConditionalEdges('tools', (state) => {
        if (state.finished) {
            return langgraph_1.END;
        }
        return 'resultCheck';
    })
        .addConditionalEdges('resultCheck', (state) => {
        var _a;
        if (state.finished) {
            return langgraph_1.END;
        }
        if ((0, turn_graph_util_1.shouldRouteToRespond)(state)) {
            return 'summarize';
        }
        const workflowRoute = (0, workflow_graph_routing_util_1.routeResultCheckWorkflowAxis)(state);
        if (workflowRoute) {
            return workflowRoute;
        }
        if (state.workflowAwaitingReact) {
            return 'workflow_react';
        }
        if (((_a = state.workflowRun) === null || _a === void 0 ? void 0 : _a.status) === 'running' &&
            state.workflowRun.currentNodeId) {
            const current = (0, workflow_graph_routing_util_1.getCurrentWorkflowNode)(state);
            if ((current === null || current === void 0 ? void 0 : current.status) === 'pending' || (current === null || current === void 0 ? void 0 : current.status) === 'running') {
                return 'execute_node';
            }
            return 'workflow_advance';
        }
        if ((0, paged_list_gather_util_1.shouldRouteGraphToTools)({
            pendingToolCalls: state.pendingToolCalls,
            taskPlan: state.taskPlan,
            scopedTools: state.scopedTools,
            observations: (0, plan_observation_scope_util_1.selectObservationsForPagedGatherResume)((0, plan_observation_scope_util_1.planObservationBucketsFromState)(state)),
        })) {
            return 'tools';
        }
        if (state.iteration >= input.maxSteps) {
            return langgraph_1.END;
        }
        return 'summarize';
    })
        .addConditionalEdges('summarize', (state) => {
        var _a;
        if (state.finished) {
            return langgraph_1.END;
        }
        if (input.resumeFromWriteConfirm) {
            if (((_a = state.workflowRun) === null || _a === void 0 ? void 0 : _a.status) === 'running' &&
                state.workflowRun.currentNodeId) {
                return resolveWorkflowEdge((0, workflow_graph_routing_util_1.routeAfterSummarizeWorkflowAxis)(state, false));
            }
            return langgraph_1.END;
        }
        if (state.pendingToolCalls.length > 0) {
            return 'tools';
        }
        return resolveWorkflowEdge((0, workflow_graph_routing_util_1.routeAfterSummarizeWorkflowAxis)(state, false));
    });
    const app = graph.compile();
    const skipTurnRouteContract = input.resumeFromWriteConfirm || input.resumeFromWriteGateRetry
        ? (0, turn_execution_contract_util_1.buildWriteConfirmResumeContract)('resume_from_write_confirm')
        : null;
    const allowedToolsBundle = (0, turn_scoped_tools_util_1.bundleFromAllowedRunInput)({
        tools: input.tools,
        langChainTools: input.langChainTools,
        allowedToolIds: input.allowedToolIds,
    });
    const defaultInitial = Object.assign(Object.assign({ iteration: 0, steps: [], toolObservations: [], pendingToolCalls: [], pendingRespond: null, intentKind: 'task', finalOutput: '', status: client_1.AgentRunStatus.running, finished: false }, allowedToolsBundle), { planStepToolCandidates: [], planStepToolCandidateStrategy: null, intentScopedToolsBundle: allowedToolsBundle, toolProfilesByName: input.toolProfilesByName, hasExpandedOnce: false, skillApplied: false, activeSkillId: null, activeSkillPrompt: null, activeSkillName: null, activeSkillDescription: null, activeSkillConfig: null, activeSkillRiskLevel: null, taskPlan: null, lastToolRoundMeta: null, pagedListHttpUsed: 0, preloadedToolObservations: [], planRunContext: (0, plan_observation_scope_util_1.resolveInitialPlanRunContext)({
            resumeFromWriteConfirm: input.resumeFromWriteConfirm,
            graphInitialState: input.graphInitialState,
        }), pageContext: (_a = input.pageContext) !== null && _a !== void 0 ? _a : null, scopedHostTools: [], scopedHostLangChainTools: [], turnExecutionContract: skipTurnRouteContract, workflowRun: null, workflowNodeDefs: undefined, workflowIr: null, workflowExecutionMode: undefined, workflowNodeOutputs: undefined, workflowAwaitingReact: false });
    const graphOverride = (_b = input.graphInitialState) !== null && _b !== void 0 ? _b : {};
    const priorObservations = sessionPriorObservations.map((row) => ({
        name: row.name,
        output: row.output,
    }));
    const initial = Object.assign(Object.assign(Object.assign({}, defaultInitial), graphOverride), { preloadedToolObservations: (_c = graphOverride.preloadedToolObservations) !== null && _c !== void 0 ? _c : priorObservations, toolObservations: (_d = graphOverride.toolObservations) !== null && _d !== void 0 ? _d : [], turnExecutionContract: (_e = graphOverride.turnExecutionContract) !== null && _e !== void 0 ? _e : skipTurnRouteContract });
    return app.invoke(initial);
}
exports.buildAndRunAgentGraph = buildAndRunAgentGraph;
//# sourceMappingURL=build-agent-graph.js.map