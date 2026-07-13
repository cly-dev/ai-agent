import { END, START, StateGraph } from '@langchain/langgraph';
import { AgentRunStatus } from '../../../../../../generated/prisma/client';
import type { SessionGoaPayload } from '../../../../memory/goa/session-goa.types';
import { logWorkflowGraphBoot } from '../../../../workflow/trace/workflow-debug.util';
import {
  routeAfterExecuteNode,
  routeAfterSummarizeWorkflowAxis,
  routeAfterWorkflowAdvance,
  routeAfterWorkflowReact,
  routeAfterWorkflowInit,
  routeResultCheckWorkflowAxis,
  getCurrentWorkflowNode,
} from '../../../../workflow/workflow-graph-routing.util';
import { shouldRouteToRespond } from '../../turn/turn-graph.util';
import { buildWriteConfirmResumeContract } from '../../turn/turn-execution-contract.util';
import { shouldRouteGraphToTools } from '../../gather/paged-list-gather.util';
import {
  planObservationBucketsFromState,
  resolveInitialPlanRunContext,
  selectObservationsForPagedGatherResume,
} from '../plan/plan-observation-scope.util';
import type {
  AgentGraphState,
  AgentLangGraphRunInput,
  ToolObservation,
} from '../types/agent-engine.types';
import type { AgentGraphDeps } from './types/graph.types';
import { createAgentGraphStateAnnotation } from './state/graph-state.annotation';
import {
  bindRunContextHelpers,
  createAgentGraphRunHelpers,
  createAgentGraphSkillFrameHelpers,
  createAgentGraphDecisionHelpers,
  createAgentGraphHostToolHandleHelpers,
} from './runtime';
import { createAgentGraphSummarizeHelpers } from './summarize';
import type { AgentGraphNodeFn } from './types/graph.types';
import { createTurnRouteNode } from './nodes/turn-route.node';
import { createToolsNode } from './nodes/tools.node';
import { createResultCheckNode } from './nodes/result-check.node';
import { createSummarizeNode } from './nodes/summarize.node';
import { createWorkflowInitNode } from './nodes/workflow-init.node';
import { createExecuteNodeNode } from './nodes/execute-node.node';
import { createWorkflowAdvanceNode } from './nodes/workflow-advance.node';
import { createWorkflowReactNode } from './nodes/workflow-react.node';
import type { RequestedSkillRunContext } from '../skill/requested-skill-run.service';
import { bundleFromAllowedRunInput } from '../../turn/turn-scoped-tools.util';

/**
 * Chat LangGraph 主轴：
 * turnRoute → workflow_init → execute_node ↔ workflow_react → workflow_advance → summarize
 * 旁路：tools / resultCheck（写确认 resume、summarize 续跑）
 * plan / readiness / tool_resolve / param_gate / llm 不在顶层注册；plan 在 workflow_init 内，HTTP 候选在 tool_resolve 收窄。
 */
function withRunCancellation(
  deps: AgentGraphDeps,
  input: AgentLangGraphRunInput,
  node: AgentGraphNodeFn,
): AgentGraphNodeFn {
  const generation = input.runGeneration;
  if (generation == null) {
    deps.logger.warn(
      `runGeneration missing for runId=${input.runId}; graph nodes run without cancellation guard`,
    );
    return node;
  }
  return async (state) => {
    deps.sessionRunCoordinator.throwIfAborted(
      input.sessionId,
      input.runId,
      generation,
    );
    return node(state);
  };
}

function resolveWorkflowEdge(route: string): string {
  if (route === '__end__') {
    return END;
  }
  return route;
}

export async function buildAndRunAgentGraph(
  deps: AgentGraphDeps,
  input: AgentLangGraphRunInput,
): Promise<AgentGraphState> {
  logWorkflowGraphBoot({
    runId: input.runId,
    sessionId: input.sessionId,
  });
  const requestedSkillCtx: RequestedSkillRunContext | null =
    input.requestedSkillId != null
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

  let sessionGoa: SessionGoaPayload | null =
    input.resumeFromWriteConfirm || input.resumeFromWriteGateRetry
      ? null
      : await deps.goaService.ensurePayload(input.sessionId);
  const sessionPriorObservations =
    input.resumeFromWriteConfirm || input.resumeFromWriteGateRetry
      ? []
      : deps.goaService.buildPriorToolObservationsForGraph(sessionGoa);

  const ctx = {
    input,
    requestedSkillCtx,
    getSessionGoa: () => sessionGoa,
    setSessionGoa: (goa: SessionGoaPayload | null) => {
      sessionGoa = goa;
    },
    promptScope: {
      appClientId: input.appClientId,
      agentId: input.agentId,
    },
  };

  const runHelpers = bindRunContextHelpers(
    createAgentGraphRunHelpers(deps),
    ctx,
  );
  const skillFrame = createAgentGraphSkillFrameHelpers(deps, ctx, runHelpers);
  const decision = createAgentGraphDecisionHelpers(deps);
  const summarize = createAgentGraphSummarizeHelpers(deps);
  const hostToolHandle = createAgentGraphHostToolHandleHelpers(
    deps,
    runHelpers,
    skillFrame,
    decision,
    ctx,
  );

  const bundle = {
    deps,
    ctx,
    runHelpers,
    skillFrame,
    hostToolHandle,
    decision,
    summarize,
  };

  const State = createAgentGraphStateAnnotation();
  const wrap = (node: AgentGraphNodeFn) =>
    withRunCancellation(deps, input, node);
  const graph = new StateGraph(State)
    .addNode('turnRoute', wrap(createTurnRouteNode(bundle)))
    .addNode('workflow_init', wrap(createWorkflowInitNode(bundle)))
    .addNode('execute_node', wrap(createExecuteNodeNode(bundle)))
    .addNode('workflow_advance', wrap(createWorkflowAdvanceNode(bundle)))
    .addNode('workflow_react', wrap(createWorkflowReactNode(bundle)))
    .addNode('tools', wrap(createToolsNode(bundle)))
    .addNode('resultCheck', wrap(createResultCheckNode(bundle)))
    .addNode('summarize', wrap(createSummarizeNode(bundle)))
    .addConditionalEdges(START, (s: AgentGraphState) => {
      if (input.resumeFromWriteGateRetry) {
        if (
          s.workflowRun?.status === 'running' &&
          s.workflowRun.currentNodeId
        ) {
          const current = getCurrentWorkflowNode(s);
          if (current?.status === 'pending' || current?.status === 'running') {
            return 'execute_node';
          }
          return 'workflow_advance';
        }
        return 'resultCheck';
      }
      if (input.resumeFromWriteConfirm) {
        if (shouldRouteToRespond(s)) {
          return 'summarize';
        }
        if (
          s.workflowRun?.status === 'running' &&
          s.workflowRun.currentNodeId
        ) {
          const current = getCurrentWorkflowNode(s);
          if (current?.status === 'pending' || current?.status === 'running') {
            return 'execute_node';
          }
          return 'workflow_advance';
        }
        return 'resultCheck';
      }
      return 'turnRoute';
    })
    .addConditionalEdges('turnRoute', (s: AgentGraphState) => {
      if (s.finished) {
        return END;
      }
      if (shouldRouteToRespond(s)) {
        return 'summarize';
      }
      return 'workflow_init';
    })
    .addConditionalEdges('workflow_init', (s: AgentGraphState) =>
      resolveWorkflowEdge(routeAfterWorkflowInit(s)),
    )
    .addConditionalEdges('execute_node', (s: AgentGraphState) =>
      resolveWorkflowEdge(routeAfterExecuteNode(s)),
    )
    .addConditionalEdges('workflow_react', (s: AgentGraphState) =>
      resolveWorkflowEdge(routeAfterWorkflowReact(s)),
    )
    .addConditionalEdges('workflow_advance', (s: AgentGraphState) =>
      resolveWorkflowEdge(routeAfterWorkflowAdvance(s)),
    )
    .addConditionalEdges('tools', (state: AgentGraphState) => {
      if (state.finished) {
        return END;
      }
      return 'resultCheck';
    })
    .addConditionalEdges('resultCheck', (state: AgentGraphState) => {
      if (state.finished) {
        return END;
      }
      if (shouldRouteToRespond(state)) {
        return 'summarize';
      }
      const workflowRoute = routeResultCheckWorkflowAxis(state);
      if (workflowRoute) {
        return workflowRoute;
      }
      if (state.workflowAwaitingReact) {
        return 'workflow_react';
      }
      if (
        state.workflowRun?.status === 'running' &&
        state.workflowRun.currentNodeId
      ) {
        const current = getCurrentWorkflowNode(state);
        if (current?.status === 'pending' || current?.status === 'running') {
          return 'execute_node';
        }
        return 'workflow_advance';
      }
      if (
        shouldRouteGraphToTools({
          pendingToolCalls: state.pendingToolCalls,
          taskPlan: state.taskPlan,
          scopedTools: state.scopedTools,
          observations: selectObservationsForPagedGatherResume(
            planObservationBucketsFromState(state),
          ),
        })
      ) {
        return 'tools';
      }
      if (state.iteration >= input.maxSteps) {
        return END;
      }
      return 'summarize';
    })
    .addConditionalEdges('summarize', (state: AgentGraphState) => {
      if (state.finished) {
        return END;
      }
      if (input.resumeFromWriteConfirm) {
        if (
          state.workflowRun?.status === 'running' &&
          state.workflowRun.currentNodeId
        ) {
          return resolveWorkflowEdge(
            routeAfterSummarizeWorkflowAxis(state, false),
          );
        }
        return END;
      }
      if (state.pendingToolCalls.length > 0) {
        return 'tools';
      }
      return resolveWorkflowEdge(routeAfterSummarizeWorkflowAxis(state, false));
    });

  const app = graph.compile();
  const skipTurnRouteContract =
    input.resumeFromWriteConfirm || input.resumeFromWriteGateRetry
      ? buildWriteConfirmResumeContract('resume_from_write_confirm')
      : null;
  const allowedToolsBundle = bundleFromAllowedRunInput({
    tools: input.tools,
    langChainTools: input.langChainTools,
    allowedToolIds: input.allowedToolIds,
  });
  const defaultInitial: AgentGraphState = {
    iteration: 0,
    steps: [],
    toolObservations: [],
    pendingToolCalls: [],
    pendingRespond: null,
    intentKind: 'task',
    finalOutput: '',
    status: AgentRunStatus.running,
    finished: false,
    ...allowedToolsBundle,
    planStepToolCandidates: [],
    planStepToolCandidateStrategy: null,
    intentScopedToolsBundle: allowedToolsBundle,
    toolProfilesByName: input.toolProfilesByName,
    hasExpandedOnce: false,
    skillApplied: false,
    activeSkillId: null,
    activeSkillPrompt: null,
    activeSkillName: null,
    activeSkillDescription: null,
    activeSkillConfig: null,
    activeSkillRiskLevel: null,
    taskPlan: null,
    lastToolRoundMeta: null,
    pagedListHttpUsed: 0,
    preloadedToolObservations: [],
    planRunContext: resolveInitialPlanRunContext({
      resumeFromWriteConfirm: input.resumeFromWriteConfirm,
      graphInitialState: input.graphInitialState,
    }),
    pageContext: input.pageContext ?? null,
    scopedHostTools: [],
    scopedHostLangChainTools: [],
    turnExecutionContract: skipTurnRouteContract,
    workflowRun: null,
    workflowNodeDefs: undefined,
    workflowNodeOutputs: undefined,
    workflowAwaitingReact: false,
  };
  const graphOverride = input.graphInitialState ?? {};
  const priorObservations: ToolObservation[] = sessionPriorObservations.map(
    (row) => ({
      name: row.name,
      output: row.output,
    }),
  );
  const initial = {
    ...defaultInitial,
    ...graphOverride,
    preloadedToolObservations:
      graphOverride.preloadedToolObservations ?? priorObservations,
    toolObservations: graphOverride.toolObservations ?? [],
    turnExecutionContract:
      graphOverride.turnExecutionContract ?? skipTurnRouteContract,
  };
  return app.invoke(initial);
}
