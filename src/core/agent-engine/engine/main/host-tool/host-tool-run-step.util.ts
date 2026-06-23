import type { GraphToolCall } from '../types/agent-engine.types';
import type { AgentRunStep } from '../types/agent-engine.types';
import type { HostActionHostToolInvocation } from '../../../../host-bridge/host-action.types';
import type {
  HostToolPlanStepHandleResult,
  HostToolStepSkipReason,
} from './host-tool-llm.util';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import { nextRunStepNumber } from '../run/agent-run-steps.util';

export type HostToolRunStepStatus =
  | 'dispatched'
  | 'skipped'
  | 'required_missed'
  | 'completion_dispatched'
  | 'completion_skipped';

export type HostToolRunStepReason =
  | 'plan_host_tool'
  | 'agent_mutation_success';

export type HostToolPlanRunStatus =
  | 'none'
  | 'available_not_planned'
  | 'planned';

export function resolveHostToolPlanRunStatus(input: {
  availableHostToolCount: number;
  taskPlan: TaskPlanSnapshot;
}): {
  plannedHostToolStepIds: string[];
  hostToolRunStatus: HostToolPlanRunStatus;
} {
  const plannedHostToolStepIds = input.taskPlan.steps
    .filter((step) => step.kind === 'host_tool')
    .map((step) => step.id);
  if (input.availableHostToolCount === 0) {
    return { plannedHostToolStepIds, hostToolRunStatus: 'none' };
  }
  if (plannedHostToolStepIds.length === 0) {
    return {
      plannedHostToolStepIds,
      hostToolRunStatus: 'available_not_planned',
    };
  }
  return { plannedHostToolStepIds, hostToolRunStatus: 'planned' };
}

function mapHostToolInvocations(
  calls: GraphToolCall[] | HostActionHostToolInvocation[],
): Array<{ name: string; args: Record<string, unknown> }> {
  return calls.map((call) => ({
    name: call.name,
    args:
      'arguments' in call
        ? (call.arguments as Record<string, unknown>)
        : (call.args ?? {}),
  }));
}

export function buildHostToolRunStep(input: {
  existingSteps: AgentRunStep[];
  status: HostToolRunStepStatus;
  reason: HostToolRunStepReason;
  planStepId?: string | null;
  pageScope?: string | null;
  hostTools?: Array<{ name: string; args?: Record<string, unknown> }>;
  skipReason?: HostToolStepSkipReason | string | null;
  sseDispatched?: boolean;
}): AgentRunStep {
  return {
    step: nextRunStepNumber(input.existingSteps),
    type: 'host_tool',
    name: input.planStepId ? `plan:${input.planStepId}` : input.reason,
    output: {
      status: input.status,
      reason: input.reason,
      planStepId: input.planStepId ?? null,
      pageScope: input.pageScope ?? null,
      hostTools: input.hostTools ?? [],
      skipReason: input.skipReason ?? null,
      sseDispatched: input.sseDispatched ?? false,
      hostToolCount: input.hostTools?.length ?? 0,
    },
  };
}

export function buildHostToolRunStepFromPlanHandle(input: {
  existingSteps: AgentRunStep[];
  handle: HostToolPlanStepHandleResult;
  planStepId: string;
  pageScope?: string | null;
}): AgentRunStep {
  const dispatched = Boolean(input.handle.ssePayload);
  const hostTools =
    input.handle.ssePayload?.hostTools?.map((tool) => ({
      name: tool.name,
      args: tool.args ?? {},
    })) ??
    input.handle.observations
      .filter((row) => row.output?.outcome === 'dispatched')
      .map((row) => ({
        name: String(row.output.tool ?? ''),
        args: (row.output.arguments as Record<string, unknown>) ?? {},
      }))
      .filter((row) => row.name);

  return buildHostToolRunStep({
    existingSteps: input.existingSteps,
    status: dispatched ? 'dispatched' : 'skipped',
    reason: 'plan_host_tool',
    planStepId: input.planStepId,
    pageScope: input.pageScope,
    hostTools,
    skipReason: input.handle.skipReason ?? null,
    sseDispatched: dispatched,
  });
}

export function buildHostToolRequiredMissedStep(input: {
  existingSteps: AgentRunStep[];
  planStepId: string;
  pageScope?: string | null;
  skipReason: HostToolStepSkipReason;
  hostCalls?: GraphToolCall[];
}): AgentRunStep {
  return buildHostToolRunStep({
    existingSteps: input.existingSteps,
    status: 'required_missed',
    reason: 'plan_host_tool',
    planStepId: input.planStepId,
    pageScope: input.pageScope,
    hostTools: input.hostCalls?.length
      ? mapHostToolInvocations(input.hostCalls)
      : undefined,
    skipReason: input.skipReason,
    sseDispatched: false,
  });
}

export function buildCompletionHostToolRunStep(input: {
  existingSteps: AgentRunStep[];
  pageScope?: string | null;
  hostTools: HostActionHostToolInvocation[];
  sseDispatched: boolean;
}): AgentRunStep {
  return buildHostToolRunStep({
    existingSteps: input.existingSteps,
    status: input.sseDispatched ? 'completion_dispatched' : 'completion_skipped',
    reason: 'agent_mutation_success',
    pageScope: input.pageScope,
    hostTools: mapHostToolInvocations(input.hostTools),
    sseDispatched: input.sseDispatched,
  });
}
