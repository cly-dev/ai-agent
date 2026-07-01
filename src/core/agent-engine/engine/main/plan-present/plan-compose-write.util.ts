import type { GraphToolCall, ToolObservation } from '../types/agent-engine.types';
import type { AgentEngineTool } from '../types/agent-engine.types';
import { normalizeWriteToolArguments } from '../../../../tool-engine/write-tool-draft-injection.util';
import { isMutationTool } from '../../tool/tool-execution-status.util';
import {
  filterScopedToolsForPlanStep,
  PLAN_COMPOSE_WRITE_STEP_ID,
  PLAN_PRESENT_STEP_ID,
} from '../plan/task-plan.util';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';

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

/**
 * 将 present / prose supplement 等机器层变更写回 plan_compose_write，供 gate 与 write fallback 共用。
 */
export function patchLatestPlanComposeWriteObservation(
  observations: ToolObservation[],
  machineLayer: PlanComposeWriteObservationOutput,
): { observations: ToolObservation[]; patched: boolean } {
  for (let i = observations.length - 1; i >= 0; i -= 1) {
    const row = observations[i];
    if (row?.name !== PLAN_COMPOSE_WRITE_OBSERVATION_NAME) {
      continue;
    }
    const output = row.output as PlanComposeWriteObservationOutput;
    const next = [...observations];
    next[i] = {
      ...row,
      output: {
        tool: machineLayer.tool.trim() || output.tool,
        arguments: machineLayer.arguments,
        planStepId: machineLayer.planStepId ?? output.planStepId ?? null,
      } satisfies PlanComposeWriteObservationOutput,
    };
    return { observations: next, patched: true };
  }
  return { observations, patched: false };
}

/** compose_write 步：从 LLM tool_calls 中选取允许的写工具调用。 */
export function pickComposeWriteToolCall(
  toolCalls: GraphToolCall[],
  scopedTools: AgentEngineTool[],
  taskPlan: TaskPlanSnapshot,
  workflowRun?: WorkflowRunState | null,
  workflowNodeDefs?: WorkflowNodeDef[] | null,
): GraphToolCall | null {
  const allowed = filterScopedToolsForPlanStep(
    scopedTools,
    taskPlan,
    workflowRun,
    workflowNodeDefs,
  );
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
  pageContext?: AgentChatPageContext | null;
}): GraphToolCall {
  const isReadToolObservation = buildReadToolObservationMatcher(
    input.scopedTools,
  );
  return {
    name: input.toolCall.name,
    arguments: normalizeWriteToolArguments(
      input.toolCall.arguments,
      input.writeTool,
      input.observations,
      {
        isReadToolObservation,
        pageContext: input.pageContext ?? null,
      },
    ),
  };
}

export type ComposeMutationInterceptResult =
  | { kind: 'not_applicable' }
  | { kind: 'no_allowed_call' }
  | {
      kind: 'applied';
      preparedCall: GraphToolCall;
      composeObservation: ToolObservation;
    };

/** LLM / tools 共用：compose 阶段拦截 write tool_call，存 plan_compose_write 不执行 HTTP。 */
export function tryInterceptComposeMutationToolCalls(input: {
  toolCalls: GraphToolCall[];
  taskPlan: TaskPlanSnapshot;
  scopedTools: AgentEngineTool[];
  observations: ToolObservation[];
  pageContext?: AgentChatPageContext | null;
  planStepId: string;
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
}): ComposeMutationInterceptResult {
  const composeCall = pickComposeWriteToolCall(
    input.toolCalls,
    input.scopedTools,
    input.taskPlan,
    input.workflowRun,
    input.workflowNodeDefs,
  );
  if (!composeCall) {
    return { kind: 'no_allowed_call' };
  }
  const writeToolDef = input.scopedTools.find(
    (tool) => tool.name === composeCall.name,
  );
  const preparedCall =
    writeToolDef != null
      ? prepareComposeWriteToolCall({
          toolCall: composeCall,
          writeTool: writeToolDef,
          observations: input.observations,
          scopedTools: input.scopedTools,
          pageContext: input.pageContext ?? null,
        })
      : composeCall;
  return {
    kind: 'applied',
    preparedCall,
    composeObservation: buildPlanComposeWriteObservation({
      toolCall: preparedCall,
      planStepId: input.planStepId,
    }),
  };
}
