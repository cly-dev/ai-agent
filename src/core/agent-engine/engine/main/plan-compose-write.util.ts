import type { GraphToolCall, ToolObservation } from './agent-engine.types';
import type { AgentEngineTool } from './agent-engine.types';
import { enrichWriteToolArgumentsFromReadObservations } from '../../../tool-engine/write-tool-draft-injection.util';
import { isMutationTool } from '../tool/tool-execution-status.util';
import {
  filterScopedToolsForPlanStep,
  PLAN_COMPOSE_WRITE_STEP_ID,
  PLAN_PRESENT_STEP_ID,
} from './task-plan.util';
import type { TaskPlanSnapshot } from './task-plan.types';

/** Plan compose_write 步产出：机器层 write 参数（尚未执行 HTTP）。 */
export const PLAN_COMPOSE_WRITE_OBSERVATION_NAME = 'plan_compose_write';

export { PLAN_COMPOSE_WRITE_STEP_ID, PLAN_PRESENT_STEP_ID };

export type PlanComposeWriteObservationOutput = {
  tool: string;
  arguments: Record<string, unknown>;
  planStepId?: string | null;
};

export function buildPlanComposeWriteObservation(input: {
  toolCall: GraphToolCall;
  planStepId?: string | null;
}): ToolObservation {
  return {
    name: PLAN_COMPOSE_WRITE_OBSERVATION_NAME,
    output: {
      tool: input.toolCall.name.trim(),
      arguments: input.toolCall.arguments,
      planStepId: input.planStepId ?? null,
    } satisfies PlanComposeWriteObservationOutput,
    quality: 'high',
  };
}

export function resolveLatestPlanComposeWrite(
  observations: ToolObservation[],
): PlanComposeWriteObservationOutput | null {
  for (let i = observations.length - 1; i >= 0; i -= 1) {
    const row = observations[i];
    if (row?.name !== PLAN_COMPOSE_WRITE_OBSERVATION_NAME) {
      continue;
    }
    const output = row.output as PlanComposeWriteObservationOutput;
    const tool = output?.tool?.trim();
    if (!tool) {
      continue;
    }
    const args = output.arguments;
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      continue;
    }
    return {
      tool,
      arguments: args,
      planStepId: output.planStepId ?? null,
    };
  }
  return null;
}

/** compose_write 步：从 LLM tool_calls 中选取允许的写工具调用。 */
export function pickComposeWriteToolCall(
  toolCalls: GraphToolCall[],
  scopedTools: AgentEngineTool[],
  taskPlan: TaskPlanSnapshot,
): GraphToolCall | null {
  const allowed = filterScopedToolsForPlanStep(scopedTools, taskPlan);
  for (const call of toolCalls) {
    const def = allowed.find((tool) => tool.name === call.name);
    if (def && isMutationTool(def.agentMetadata)) {
      return call;
    }
  }
  return null;
}

/** 非 mutation 的 scoped tool 观测，用于 compose 参数补齐。 */
export function buildReadToolObservationMatcher(
  scopedTools: AgentEngineTool[],
): (toolName: string) => boolean {
  const readToolNames = new Set(
    scopedTools
      .filter((tool) => !isMutationTool(tool.agentMetadata))
      .map((tool) => tool.name),
  );
  return (toolName: string) => readToolNames.has(toolName);
}

/**
 * compose 机器层真值：LLM 产参 + read observations 按 write tool schema 补齐必填项与数组项字段。
 */
export function prepareComposeWriteToolCall(input: {
  toolCall: GraphToolCall;
  writeTool: AgentEngineTool;
  observations: ToolObservation[];
  scopedTools: AgentEngineTool[];
}): GraphToolCall {
  const isReadToolObservation = buildReadToolObservationMatcher(
    input.scopedTools,
  );
  return {
    name: input.toolCall.name,
    arguments: enrichWriteToolArgumentsFromReadObservations(
      input.toolCall.arguments,
      input.writeTool,
      input.observations,
      { isReadToolObservation },
    ),
  };
}
