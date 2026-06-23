import { END, START, StateGraph } from '@langchain/langgraph';
import { AgentRunStatus } from '../../../../../../generated/prisma/client';
import type { SessionGoaPayload } from '../../../../memory/goa/session-goa.types';
import { shouldRouteToRespond } from '../../turn/turn-graph.util';
import { buildLegacyTurnExecutionContract } from '../../turn/turn-execution-contract.util';
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
import { createPlanNode } from './nodes/plan.node';
import { createIntentNode } from './nodes/intent.node';
import { createTurnRouteNode } from './nodes/turn-route.node';
import { createReadinessNode } from './nodes/readiness.node';
import { createLlmNode } from './nodes/llm.node';
import { createToolsNode } from './nodes/tools.node';
import { createResultCheckNode } from './nodes/result-check.node';
import { createSummarizeNode } from './nodes/summarize.node';
import type { RequestedSkillRunContext } from '../skill/requested-skill-run.service';

export async function buildAndRunAgentGraph(
  deps: AgentGraphDeps,
  input: AgentLangGraphRunInput,
): Promise<AgentGraphState> {
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

  let sessionGoa: SessionGoaPayload | null = input.resumeFromWriteConfirm
    ? null
    : await deps.goaService.ensurePayload(input.sessionId);
  const sessionPriorObservations = input.resumeFromWriteConfirm
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
  const graph = new StateGraph(State)
    .addNode('intent', createIntentNode(bundle))
    .addNode('turnRoute', createTurnRouteNode(bundle))
    .addNode('plan', createPlanNode(bundle))
    .addNode('readiness', createReadinessNode(bundle))
    .addNode('llm', createLlmNode(bundle))
    .addNode('tools', createToolsNode(bundle))
    .addNode('resultCheck', createResultCheckNode(bundle))
    .addNode('summarize', createSummarizeNode(bundle))
    .addConditionalEdges(START, (s: AgentGraphState) => {
      if (input.resumeFromWriteConfirm) {
        if (shouldRouteToRespond(s)) {
          return 'summarize';
        }
        return 'resultCheck';
      }
      if (input.resumeFromLlm) {
        return 'llm';
      }
      return 'intent';
    })
    .addConditionalEdges('intent', (s: AgentGraphState) => {
      if (s.finished) {
        return END;
      }
      if (shouldRouteToRespond(s)) {
        return 'summarize';
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
      return 'plan';
    })
    .addConditionalEdges('plan', (s: AgentGraphState) => {
      if (s.finished) {
        return END;
      }
      if (shouldRouteToRespond(s)) {
        return 'summarize';
      }
      return 'readiness';
    })
    .addConditionalEdges('readiness', (s: AgentGraphState) => {
      if (s.finished) {
        return END;
      }
      if (shouldRouteToRespond(s)) {
        return 'summarize';
      }
      return 'llm';
    })
    .addConditionalEdges('llm', (state: AgentGraphState) => {
      if (state.finished) {
        return END;
      }
      if (shouldRouteToRespond(state)) {
        return 'summarize';
      }
      return 'resultCheck';
    })
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
      return 'llm';
    })
    .addConditionalEdges('summarize', (state: AgentGraphState) => {
      if (state.finished || input.resumeFromWriteConfirm) {
        return END;
      }
      if (state.pendingToolCalls.length > 0) {
        return 'tools';
      }
      return 'readiness';
    });

  const app = graph.compile();
  const skipTurnRouteContract =
    input.resumeFromLlm || input.resumeFromWriteConfirm
      ? buildLegacyTurnExecutionContract(
          input.resumeFromLlm
            ? 'resume_from_llm'
            : 'resume_from_write_confirm',
        )
      : null;
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
    scopedTools: requestedSkillCtx?.scoped.scopedTools ?? input.tools,
    scopedLangChainTools:
      requestedSkillCtx?.scoped.scopedLangChainTools ??
      input.langChainTools.tools,
    scopedToolBundle:
      requestedSkillCtx?.scoped.scopedToolBundle ?? input.langChainTools,
    scopedAllowedToolIds:
      requestedSkillCtx?.scoped.scopedAllowedToolIds ?? input.allowedToolIds,
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
    turnRoutingDecision: null,
    turnExecutionContract: skipTurnRouteContract,
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
