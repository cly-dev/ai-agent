import type { AgentGraphNodeBundle, AgentGraphNodeFn } from '../types/graph.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import { resolvePlanToolCandidates } from '../../plan/plan-tool-candidates.util';
import { assessGatherToolCandidateReadiness } from '../../plan/plan-gather-candidate-readiness.util';
import { getPendingPlanToolStep } from '../../plan/task-plan.util';
import { pendingRespondFromTurn } from '../../../turn/turn-respond.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import { maybeTagWorkflowReactInternalStep } from '../../run/agent-run-audit.util';

/** tool_resolve：为当前 plan gather 步解析 HTTP 工具候选面并写入 state。 */
export function createToolResolveNode(
  bundle: AgentGraphNodeBundle,
): AgentGraphNodeFn {
  const { ctx, runHelpers } = bundle;
  return async (state) => {
    const pendingStep = getPendingPlanToolStep(
      state.taskPlan,
      state.workflowRun,
    );
    if (!pendingStep || pendingStep.kind !== 'tool') {
      return {
        ...state,
        planStepToolCandidates: [],
        planStepToolCandidateStrategy: null,
      };
    }

    const resolved = resolvePlanToolCandidates({
      scopedTools: state.scopedTools,
      taskPlan: state.taskPlan,
      workflowRun: state.workflowRun,
      workflowNodeDefs: state.workflowNodeDefs,
    });

    const stepNum = nextRunStepNumber(state.steps);
    const resolveStep = maybeTagWorkflowReactInternalStep(
      {
        step: stepNum,
        type: 'tool_resolve',
        output: runHelpers.normalizeJsonLike({
          strategy: resolved.strategy,
          planStepId: resolved.planStepId,
          toolRole: resolved.toolRole,
          candidateCount: resolved.candidates.length,
          candidateNames: resolved.candidates.map((tool) => tool.name),
        }),
      },
      state,
    );
    const steps = [...state.steps, resolveStep];
    await runHelpers.updateRun(ctx.input.runId, steps, AgentRunStatus.running);

    const candidateReadiness = assessGatherToolCandidateReadiness({
      taskPlan: state.taskPlan,
      workflowRun: state.workflowRun,
      candidates: resolved.candidates,
      strategy: resolved.strategy,
    });
    if (candidateReadiness.status === 'no_candidates') {
      return {
        ...state,
        steps,
        planStepToolCandidates: [],
        planStepToolCandidateStrategy: resolved.strategy,
        pendingRespond: pendingRespondFromTurn({
          kind: 'unsupported_scope',
          userMessage: ctx.input.latestUserMessage,
          payload: { readinessReason: candidateReadiness.reason },
        }),
      };
    }
    if (candidateReadiness.status === 'blocked') {
      return {
        ...state,
        steps,
        planStepToolCandidates: resolved.candidates,
        planStepToolCandidateStrategy: resolved.strategy,
        pendingRespond: pendingRespondFromTurn({
          kind: 'unsupported_scope',
          userMessage: ctx.input.latestUserMessage,
          payload: { readinessReason: candidateReadiness.reason },
        }),
      };
    }

    return {
      ...state,
      steps,
      planStepToolCandidates: resolved.candidates,
      planStepToolCandidateStrategy: resolved.strategy,
    };
  };
}
