import type { AgentGraphNodeBundle, AgentGraphNodeFn } from '../types/graph.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import { partitionDecisionToolCalls } from '../../host-tool/host-tool-plan.util';
import { getPendingPlanHostToolStep, getPendingPlanToolStep } from '../../plan/task-plan.util';
import {
  assessHttpToolCallsParamGate,
  buildParamGateClarificationRequest,
} from '../../../turn/tool-param-gate.util';
import { pendingRespondFromTurn } from '../../../turn/turn-respond.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import { maybeTagWorkflowReactInternalStep } from '../../run/agent-run-audit.util';

/** param_gate：对已选 HTTP tool_calls 做 schema 用户侧必填校验。 */
export function createParamGateNode(
  bundle: AgentGraphNodeBundle,
): AgentGraphNodeFn {
  const { ctx, runHelpers } = bundle;
  return async (state) => {
    if (state.pendingToolCalls.length === 0) {
      return state;
    }

    const pendingHostStep = getPendingPlanHostToolStep(
      state.taskPlan,
      state.workflowRun,
    );
    if (pendingHostStep) {
      return state;
    }

    const gatherStep = getPendingPlanToolStep(state.taskPlan, state.workflowRun);
    if (!gatherStep || gatherStep.kind !== 'tool') {
      return state;
    }

    const hostToolNames = new Set(
      (state.scopedHostTools ?? []).map((tool) => tool.name),
    );
    const { httpCalls } = partitionDecisionToolCalls(
      state.pendingToolCalls,
      pendingHostStep,
      hostToolNames,
    );
    if (httpCalls.length === 0) {
      return state;
    }

    const gate = assessHttpToolCallsParamGate({
      calls: httpCalls,
      scopedTools: state.scopedTools,
      candidateTools: state.planStepToolCandidates,
    });
    const stepNum = nextRunStepNumber(state.steps);
    const gateStep = maybeTagWorkflowReactInternalStep(
      {
        step: stepNum,
        type: 'param_gate',
        output: runHelpers.normalizeJsonLike({
          status: gate.status,
          toolName: gate.status === 'clarify' ? gate.toolName : null,
          missingFieldCount:
            gate.status === 'clarify' ? gate.missingFields.length : 0,
        }),
      },
      state,
    );
    const steps = [...state.steps, gateStep];
    await runHelpers.updateRun(ctx.input.runId, steps, AgentRunStatus.running);

    if (gate.status === 'ready') {
      return { ...state, steps };
    }

    return {
      ...state,
      steps,
      pendingToolCalls: [],
      pendingRespond: pendingRespondFromTurn(
        buildParamGateClarificationRequest({
          userMessage: ctx.input.latestUserMessage,
          planStep: gatherStep,
          missingFields: gate.missingFields,
          toolName: gate.toolName,
        }),
      ),
    };
  };
}
