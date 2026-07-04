import type { GraphToolCall } from '../types/agent-engine.types';
import type {
  TaskPlanAdvanceResult,
  TaskPlanSnapshot,
  TaskPlanStep,
} from '../plan/task-plan.types';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import {
  advancePlanAfterStepComplete,
  getPendingPlanHostToolStep,
} from '../plan/task-plan.util';

/** 按当前 plan 步收窄 Host Tool（host_tool 步用 hostToolNames 或全量 scoped）。 */
export function filterHostToolsForPlanStep(
  hostTools: HostToolDecisionDefinition[],
  taskPlan: TaskPlanSnapshot | null | undefined,
): HostToolDecisionDefinition[] {
  const step = getPendingPlanHostToolStep(taskPlan);
  if (!step) {
    return [];
  }
  const allowed = step.hostToolNames?.map((name) => name.trim()).filter(Boolean);
  if (step.hostToolNames != null) {
    if (!allowed?.length) {
      return [];
    }
    const allowedSet = new Set(allowed);
    return hostTools.filter((tool) => allowedSet.has(tool.name));
  }
  if (step.hostToolIds?.length) {
    const allowedIds = new Set(step.hostToolIds);
    return hostTools.filter((tool) => allowedIds.has(tool.id));
  }
  return hostTools;
}

/** 当前 pending host_tool 步中，Skill 标记为 isRequired 的工具名。 */
export function collectRequiredHostToolNamesForPlanStep(
  pendingHostStep: TaskPlanStep | null,
  scopedHostTools: HostToolDecisionDefinition[],
): Set<string> {
  if (!pendingHostStep) {
    return new Set();
  }
  const stepNames = pendingHostStep.hostToolNames?.length
    ? new Set(
        pendingHostStep.hostToolNames
          .map((name) => name.trim())
          .filter(Boolean),
      )
    : new Set(scopedHostTools.map((tool) => tool.name));
  const required = new Set<string>();
  for (const tool of scopedHostTools) {
    if (tool.isRequired && stepNames.has(tool.name)) {
      required.add(tool.name);
    }
  }
  return required;
}

function enrichHostToolStep(
  step: TaskPlanStep,
  scopedHostTools: HostToolDecisionDefinition[],
  scopedNames: Set<string>,
): TaskPlanStep {
  if (step.kind !== 'host_tool') {
    return step;
  }
  if (step.hostToolNames?.length) {
    const names = step.hostToolNames.filter((name) => scopedNames.has(name));
    return { ...step, hostToolNames: names };
  }
  if (step.hostToolIds?.length) {
    const allowedIds = new Set(step.hostToolIds);
    const names = scopedHostTools
      .filter((tool) => allowedIds.has(tool.id))
      .map((tool) => tool.name);
    return { ...step, hostToolNames: names };
  }
  return {
    ...step,
    hostToolNames: scopedHostTools.map((tool) => tool.name),
  };
}

function isInvalidEnrichedHostToolStep(step: TaskPlanStep): boolean {
  return (
    step.kind === 'host_tool' &&
    step.hostToolNames != null &&
    step.hostToolNames.length === 0
  );
}

function mapPlanWithEnrichedHostToolSteps(
  plan: TaskPlanSnapshot,
  scopedHostTools: HostToolDecisionDefinition[],
  scopedNames: Set<string>,
): TaskPlanSnapshot {
  const mapSteps = (steps: TaskPlanStep[]) =>
    steps.map((step) => enrichHostToolStep(step, scopedHostTools, scopedNames));
  return {
    ...plan,
    steps: mapSteps(plan.steps),
    frames: plan.frames.map((frame) => ({
      ...frame,
      steps: mapSteps(frame.steps),
    })),
  };
}

/** 对齐 hostToolNames，并 auto-advance 无效的 pending host_tool 步。 */
export function enrichPlanStepsWithHostTools(
  plan: TaskPlanSnapshot,
  scopedHostTools: HostToolDecisionDefinition[],
): { plan: TaskPlanSnapshot; prunedHostToolStepIds: string[] } {
  if (scopedHostTools.length === 0) {
    return { plan, prunedHostToolStepIds: [] };
  }
  const scopedNames = new Set(scopedHostTools.map((tool) => tool.name));
  let current = mapPlanWithEnrichedHostToolSteps(
    plan,
    scopedHostTools,
    scopedNames,
  );
  const prunedHostToolStepIds: string[] = [];
  while (true) {
    const pendingHost = getPendingPlanHostToolStep(current);
    if (!pendingHost || !isInvalidEnrichedHostToolStep(pendingHost)) {
      break;
    }
    prunedHostToolStepIds.push(pendingHost.id);
    current = advancePlanAfterStepComplete(current, pendingHost.id).updatedPlan;
  }
  return { plan: current, prunedHostToolStepIds };
}

/** Plan 展开前后，从 pending 队列移除的 host_tool 步 id（用于 run step 遥测）。 */
export function collectRemovedPendingHostToolStepIds(
  before: TaskPlanSnapshot | null | undefined,
  after: TaskPlanSnapshot | null | undefined,
): string[] {
  if (!before || !after) {
    return [];
  }
  const beforePendingHost = before.pendingStepIds.filter((stepId) => {
    const step = before.steps.find((row) => row.id === stepId);
    return step?.kind === 'host_tool';
  });
  const afterPendingHost = new Set(
    after.pendingStepIds.filter((stepId) => {
      const step = after.steps.find((row) => row.id === stepId);
      return step?.kind === 'host_tool';
    }),
  );
  return beforePendingHost.filter((stepId) => !afterPendingHost.has(stepId));
}

export function partitionToolCallsByHost(
  toolCalls: GraphToolCall[],
  hostToolNames: Set<string>,
): { httpCalls: GraphToolCall[]; hostCalls: GraphToolCall[] } {
  const httpCalls: GraphToolCall[] = [];
  const hostCalls: GraphToolCall[] = [];
  for (const call of toolCalls) {
    if (hostToolNames.has(call.name)) {
      hostCalls.push(call);
    } else {
      httpCalls.push(call);
    }
  }
  return { httpCalls, hostCalls };
}

/** 仅 pending host_tool 步时将 host 名划入 hostCalls；否则全部视为 HTTP。 */
export function partitionDecisionToolCalls(
  toolCalls: GraphToolCall[],
  pendingHostStep: TaskPlanStep | null,
  allowedHostToolNames: Set<string>,
): { httpCalls: GraphToolCall[]; hostCalls: GraphToolCall[] } {
  const hostNameSet = pendingHostStep ? allowedHostToolNames : new Set<string>();
  return partitionToolCallsByHost(toolCalls, hostNameSet);
}

export function hostToolCallsMatchPlanStep(
  step: TaskPlanStep,
  hostCalls: GraphToolCall[],
): boolean {
  if (hostCalls.length === 0) {
    return false;
  }
  const allowed = step.hostToolNames?.map((name) => name.trim()).filter(Boolean);
  if (step.hostToolNames != null) {
    if (!allowed?.length) {
      return false;
    }
    const allowedSet = new Set(allowed);
    return hostCalls.every((call) => allowedSet.has(call.name));
  }
  return true;
}

export const HOST_TOOL_INVOKE_OBSERVATION_NAME = 'host_tool_invoke';

export function buildHostToolDispatchObservations(input: {
  hostCalls: GraphToolCall[];
  planStepId: string;
}): Array<{ name: string; output: Record<string, unknown> }> {
  return input.hostCalls.map((call) => ({
    name: HOST_TOOL_INVOKE_OBSERVATION_NAME,
    output: {
      outcome: 'dispatched',
      tool: call.name,
      arguments: call.arguments,
      planStepId: input.planStepId,
    },
  }));
}

export function buildHostToolSkippedObservation(input: {
  planStepId: string;
  reason: string;
  hostCalls?: GraphToolCall[];
  httpCalls?: GraphToolCall[];
}): { name: string; output: Record<string, unknown> } {
  return {
    name: HOST_TOOL_INVOKE_OBSERVATION_NAME,
    output: {
      outcome: 'skipped',
      planStepId: input.planStepId,
      reason: input.reason,
      ...(input.hostCalls?.length
        ? { attemptedTools: input.hostCalls.map((call) => call.name) }
        : {}),
      ...(input.httpCalls?.length
        ? { attemptedHttpTools: input.httpCalls.map((call) => call.name) }
        : {}),
    },
  };
}

export function advanceHostToolPlanStep(
  plan: TaskPlanSnapshot,
  input: {
    planStepId: string;
    hostCalls?: GraphToolCall[];
    requireMatch?: boolean;
  },
): TaskPlanAdvanceResult | null {
  const step = getPendingPlanHostToolStep(plan);
  if (!step || step.id !== input.planStepId) {
    return null;
  }
  if (input.requireMatch) {
    if (
      !input.hostCalls?.length ||
      !hostToolCallsMatchPlanStep(step, input.hostCalls)
    ) {
      return null;
    }
  }
  return advancePlanAfterStepComplete(plan, input.planStepId);
}
