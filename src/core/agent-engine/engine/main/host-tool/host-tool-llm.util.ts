import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';
import type { HostActionSsePayload } from '../../../../host-bridge/host-action.types';
import { buildHostActionPayload } from '../../../../host-bridge/host-action.util';
import type { GraphToolCall } from '../types/agent-engine.types';
import type { TaskPlanAdvanceResult, TaskPlanSnapshot, TaskPlanStep } from '../plan/task-plan.types';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import {
  advanceHostToolPlanStep,
  buildHostToolDispatchObservations,
  buildHostToolSkippedObservation,
  collectRequiredHostToolNamesForPlanStep,
  hostToolCallsMatchPlanStep,
} from './host-tool-plan.util';
import { getPendingPlanHostToolStep } from '../plan/task-plan.util';

export type HostToolStepSkipReason =
  | 'missing_page_context'
  | 'no_scoped_host_tools'
  | 'host_tool_name_mismatch'
  | 'no_host_tool_calls'
  | 'unexpected_http_tool_calls'
  | 'required_host_tool_missed'
  | 'turn_contract_host_tool_blocked';

export type HostToolPlanStepHandleResult = {
  planAdvance: TaskPlanAdvanceResult;
  observations: Array<{ name: string; output: Record<string, unknown> }>;
  ssePayload?: HostActionSsePayload;
  skipReason?: HostToolStepSkipReason;
};

function hasUnmetRequiredHostTools(input: {
  pendingHostStep: TaskPlanStep;
  scopedHostTools: HostToolDecisionDefinition[];
  hostCalls: GraphToolCall[];
}): boolean {
  const required = collectRequiredHostToolNamesForPlanStep(
    input.pendingHostStep,
    input.scopedHostTools,
  );
  if (required.size === 0) {
    return false;
  }
  const dispatched = new Set(input.hostCalls.map((call) => call.name));
  for (const name of required) {
    if (!dispatched.has(name)) {
      return true;
    }
  }
  return false;
}

export function evaluateHostToolPreLlmSkip(input: {
  pendingHostStep: TaskPlanStep | null;
  taskPlan: TaskPlanSnapshot | null | undefined;
  pageContext: AgentChatPageContext | null | undefined;
  hostToolsForPrompt: HostToolDecisionDefinition[];
  scopedHostTools: HostToolDecisionDefinition[];
}): HostToolStepSkipReason | null {
  if (!input.pendingHostStep || !input.taskPlan) {
    return null;
  }
  const requiredMissed = hasUnmetRequiredHostTools({
    pendingHostStep: input.pendingHostStep,
    scopedHostTools: input.scopedHostTools,
    hostCalls: [],
  });
  if (!input.pageContext?.page?.trim()) {
    return requiredMissed ? 'required_host_tool_missed' : 'missing_page_context';
  }
  if (input.hostToolsForPrompt.length === 0) {
    return requiredMissed ? 'required_host_tool_missed' : 'no_scoped_host_tools';
  }
  return null;
}

export function evaluateHostToolPostLlm(input: {
  pendingHostStep: TaskPlanStep | null;
  taskPlan: TaskPlanSnapshot | null | undefined;
  pageContext: AgentChatPageContext | null | undefined;
  hostCalls: GraphToolCall[];
  httpCalls: GraphToolCall[];
  hasToolCalls: boolean;
  scopedHostTools: HostToolDecisionDefinition[];
}):
  | { action: 'dispatch'; hostCalls: GraphToolCall[]; planStepId: string }
  | {
      action: 'skip';
      planStepId: string;
      reason: HostToolStepSkipReason;
      hostCalls?: GraphToolCall[];
      httpCalls?: GraphToolCall[];
    }
  | {
      action: 'required_missed';
      planStepId: string;
      reason: 'required_host_tool_missed';
      hostCalls?: GraphToolCall[];
      httpCalls?: GraphToolCall[];
    }
  | { action: 'none' } {
  const {
    pendingHostStep,
    taskPlan,
    pageContext,
    hostCalls,
    httpCalls,
    hasToolCalls,
    scopedHostTools,
  } = input;
  if (!pendingHostStep || !taskPlan) {
    return { action: 'none' };
  }

  if (
    hostCalls.length > 0 &&
    pageContext?.page?.trim() &&
    hostToolCallsMatchPlanStep(pendingHostStep, hostCalls)
  ) {
    return {
      action: 'dispatch',
      hostCalls,
      planStepId: pendingHostStep.id,
    };
  }

  const requiredMissed = hasUnmetRequiredHostTools({
    pendingHostStep,
    scopedHostTools,
    hostCalls,
  });

  if (hostCalls.length > 0) {
    const reason = !pageContext?.page?.trim()
      ? requiredMissed
        ? 'required_host_tool_missed'
        : 'missing_page_context'
      : requiredMissed
        ? 'required_host_tool_missed'
        : 'host_tool_name_mismatch';
    if (reason === 'required_host_tool_missed') {
      return {
        action: 'required_missed',
        planStepId: pendingHostStep.id,
        reason,
        hostCalls,
      };
    }
    return {
      action: 'skip',
      planStepId: pendingHostStep.id,
      reason,
      hostCalls,
    };
  }

  if (httpCalls.length > 0) {
    const reason = requiredMissed
      ? 'required_host_tool_missed'
      : 'unexpected_http_tool_calls';
    if (reason === 'required_host_tool_missed') {
      return {
        action: 'required_missed',
        planStepId: pendingHostStep.id,
        reason,
        httpCalls,
      };
    }
    return {
      action: 'skip',
      planStepId: pendingHostStep.id,
      reason,
      httpCalls,
    };
  }

  if (!hasToolCalls) {
    const reason = requiredMissed
      ? 'required_host_tool_missed'
      : 'no_host_tool_calls';
    if (reason === 'required_host_tool_missed') {
      return {
        action: 'required_missed',
        planStepId: pendingHostStep.id,
        reason,
      };
    }
    return {
      action: 'skip',
      planStepId: pendingHostStep.id,
      reason,
    };
  }

  return { action: 'none' };
}

export function finalizeHostToolPlanStep(input: {
  taskPlan: TaskPlanSnapshot;
  planStepId: string;
  hostCalls?: GraphToolCall[];
  httpCalls?: GraphToolCall[];
  skipReason?: HostToolStepSkipReason;
  pageContext?: AgentChatPageContext | null;
  runId?: number;
  turnId?: number;
}): HostToolPlanStepHandleResult | null {
  const dispatched = Boolean(input.hostCalls?.length && !input.skipReason);
  const planAdvance = advanceHostToolPlanStep(input.taskPlan, {
    planStepId: input.planStepId,
    hostCalls: input.hostCalls,
    requireMatch: dispatched,
  });
  if (!planAdvance) {
    return null;
  }

  if (dispatched && input.hostCalls && input.pageContext?.page?.trim()) {
    const observations = buildHostToolDispatchObservations({
      hostCalls: input.hostCalls,
      planStepId: input.planStepId,
    });
    const ssePayload = buildHostActionPayload({
      pageContext: input.pageContext,
      runId: input.runId ?? 0,
      turnId: input.turnId ?? 0,
      hostTools: input.hostCalls.map((call) => ({
        name: call.name,
        args: call.arguments,
      })),
      planStepId: input.planStepId,
      reason: 'plan_host_tool',
    });
    return { planAdvance, observations, ssePayload };
  }

  const observations = [
    buildHostToolSkippedObservation({
      planStepId: input.planStepId,
      reason: input.skipReason ?? 'host_tool_step_skipped',
      hostCalls: input.hostCalls,
      httpCalls: input.httpCalls,
    }),
  ];
  return {
    planAdvance,
    observations,
    skipReason: input.skipReason,
  };
}

/** 契约禁止 host_tool：逐步 finalize 并产出 skipped observation。 */
export function skipPendingHostToolStepsByContract(input: {
  taskPlan: TaskPlanSnapshot;
  pageContext?: AgentChatPageContext | null;
  runId?: number;
  turnId?: number;
}): {
  plan: TaskPlanSnapshot;
  skippedStepIds: string[];
  observations: Array<{ name: string; output: Record<string, unknown> }>;
} {
  const skippedStepIds: string[] = [];
  const observations: Array<{ name: string; output: Record<string, unknown> }> =
    [];
  let current = input.taskPlan;
  while (true) {
    const pending = getPendingPlanHostToolStep(current);
    if (!pending) {
      break;
    }
    const handled = finalizeHostToolPlanStep({
      taskPlan: current,
      planStepId: pending.id,
      skipReason: 'turn_contract_host_tool_blocked',
      pageContext: input.pageContext,
      runId: input.runId,
      turnId: input.turnId,
    });
    if (!handled) {
      break;
    }
    skippedStepIds.push(pending.id);
    observations.push(...handled.observations);
    current = handled.planAdvance.updatedPlan;
  }
  return { plan: current, skippedStepIds, observations };
}
