import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import { summarizeHostToolsForLlmSchema } from '../../../../host-bridge/host-tool-langchain.util';
import type { GraphToolCall, ToolObservation } from '../types/agent-engine.types';
import { findPrecedingReasonStepId } from '../host-tool/host-tool-fill-alignment.util';
import {
  finalizePlanAfterSummarize,
  getPendingPlanHostToolStep,
  getPendingPlanStep,
} from '../plan/task-plan.util';
import type { TaskPlanSnapshot, TaskPlanStep } from '../plan/task-plan.types';
import { isUsablePlanDraftSubmitText } from '../../../../tool-engine/write-tool-draft-injection.util';

/** Plan reason 步产出的 Host Tool 机器层参数（尚未 SSE dispatch）。 */
export const PLAN_HOST_FILL_OBSERVATION_NAME = 'plan_host_fill';

export type PlanHostFillEntry = {
  tool: string;
  arguments: Record<string, unknown>;
};

export type PlanHostFillObservationOutput = {
  planStepId: string | null;
  fills: PlanHostFillEntry[];
  source: 'plan_reason_host_fill';
};

const HOST_TOOL_TEXT_ARG_KEYS = ['text', 'content', 'value', 'draft', 'body'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function buildPlanHostFillObservation(input: {
  planStepId?: string | null;
  fills: PlanHostFillEntry[];
}): ToolObservation {
  const fills = input.fills
    .map((row) => ({
      tool: row.tool.trim(),
      arguments: row.arguments,
    }))
    .filter((row) => row.tool.length > 0);
  return {
    name: PLAN_HOST_FILL_OBSERVATION_NAME,
    output: {
      planStepId: input.planStepId ?? null,
      fills,
      source: 'plan_reason_host_fill',
    } satisfies PlanHostFillObservationOutput,
    quality: 'high',
  };
}

export function resolveLatestPlanHostFill(
  observations: ToolObservation[],
  planStepId?: string | null,
): PlanHostFillObservationOutput | null {
  for (let i = observations.length - 1; i >= 0; i -= 1) {
    const row = observations[i];
    if (row?.name !== PLAN_HOST_FILL_OBSERVATION_NAME) {
      continue;
    }
    const output = row.output as PlanHostFillObservationOutput;
    if (planStepId && output?.planStepId && output.planStepId !== planStepId) {
      continue;
    }
    if (!Array.isArray(output?.fills) || output.fills.length === 0) {
      continue;
    }
    const fills = output.fills
      .map((entry) => {
        if (!entry || typeof entry.tool !== 'string') {
          return null;
        }
        const tool = entry.tool.trim();
        if (!tool || !isRecord(entry.arguments)) {
          return null;
        }
        return { tool, arguments: entry.arguments };
      })
      .filter((entry): entry is PlanHostFillEntry => entry != null);
    if (fills.length === 0) {
      continue;
    }
    return {
      planStepId: output.planStepId ?? null,
      fills,
      source: 'plan_reason_host_fill',
    };
  }
  return null;
}

export function extractPrimaryFillTextFromHostFills(
  fills: PlanHostFillEntry[],
): string {
  for (const fill of fills) {
    for (const key of HOST_TOOL_TEXT_ARG_KEYS) {
      const value = fill.arguments[key];
      if (typeof value === 'string' && isUsablePlanDraftSubmitText(value)) {
        return value.trim();
      }
    }
  }
  return '';
}

/** 当前 summarize 步为 reason，且完成后下一步为 host_tool。 */
export function isPlanReasonBeforeHostTool(
  plan: TaskPlanSnapshot | null | undefined,
): boolean {
  if (!plan) {
    return false;
  }
  const pending = getPendingPlanStep(plan);
  if (!pending || pending.kind !== 'reason') {
    return false;
  }
  const afterFinalize = finalizePlanAfterSummarize(plan);
  if (!afterFinalize) {
    return false;
  }
  return getPendingPlanHostToolStep(afterFinalize) != null;
}

export function resolveHostToolsForUpcomingHostStep(
  plan: TaskPlanSnapshot,
  scopedHostTools: HostToolDecisionDefinition[],
): HostToolDecisionDefinition[] {
  const afterFinalize = finalizePlanAfterSummarize(plan);
  if (!afterFinalize) {
    return [];
  }
  const hostStep = getPendingPlanHostToolStep(afterFinalize);
  if (!hostStep) {
    return [];
  }
  const allowed = hostStep.hostToolNames?.map((name) => name.trim()).filter(Boolean);
  if (hostStep.hostToolNames != null) {
    if (!allowed?.length) {
      return [];
    }
    const allowedSet = new Set(allowed);
    return scopedHostTools.filter((tool) => allowedSet.has(tool.name));
  }
  return scopedHostTools;
}

function normalizeHostFillEntry(
  entry: PlanHostFillEntry,
  allowedTools: Map<string, HostToolDecisionDefinition>,
): PlanHostFillEntry | null {
  const def = allowedTools.get(entry.tool);
  if (!def) {
    return null;
  }
  const args = { ...entry.arguments };
  for (const key of Object.keys(args)) {
    const value = args[key];
    if (typeof value === 'string') {
      args[key] = value.trim();
    }
  }
  const hasPayload = HOST_TOOL_TEXT_ARG_KEYS.some((key) => {
    const value = args[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
  if (!hasPayload && Object.keys(args).length === 0) {
    return null;
  }
  return { tool: entry.tool, arguments: args };
}

/** host_tool 步：从 plan_host_fill 解析待 dispatch 的 calls（机器层唯一真值）。 */
export function resolvePlanHostFillCalls(input: {
  taskPlan: TaskPlanSnapshot;
  observations: ToolObservation[];
  pendingHostStep: TaskPlanStep;
  hostToolsForPrompt: HostToolDecisionDefinition[];
}): GraphToolCall[] {
  const reasonStepId = findPrecedingReasonStepId(
    input.taskPlan,
    input.pendingHostStep.id,
  );
  const machineLayer = resolveLatestPlanHostFill(
    input.observations,
    reasonStepId ?? undefined,
  );
  if (!machineLayer) {
    return [];
  }
  const allowedTools = new Map(
    input.hostToolsForPrompt.map((tool) => [tool.name, tool]),
  );
  const stepNames = input.pendingHostStep.hostToolNames?.length
    ? new Set(
        input.pendingHostStep.hostToolNames
          .map((name) => name.trim())
          .filter(Boolean),
      )
    : null;
  const calls: GraphToolCall[] = [];
  for (const entry of machineLayer.fills) {
    if (stepNames && !stepNames.has(entry.tool)) {
      continue;
    }
    const normalized = normalizeHostFillEntry(entry, allowedTools);
    if (!normalized) {
      continue;
    }
    calls.push({
      name: normalized.tool,
      arguments: normalized.arguments,
    });
  }
  return calls;
}

export function hasPlanHostFillForDispatch(input: {
  taskPlan: TaskPlanSnapshot;
  observations: ToolObservation[];
  pendingHostStep: TaskPlanStep;
  hostToolsForPrompt: HostToolDecisionDefinition[];
}): boolean {
  return (
    resolvePlanHostFillCalls(input).length > 0 &&
    input.hostToolsForPrompt.length > 0
  );
}

export function summarizeHostToolsForReasonFillPrompt(
  tools: HostToolDecisionDefinition[],
): string {
  return JSON.stringify(summarizeHostToolsForLlmSchema(tools), null, 2);
}
