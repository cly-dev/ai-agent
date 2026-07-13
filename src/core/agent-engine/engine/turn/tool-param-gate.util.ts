import type { AgentEngineTool, GraphToolCall } from '../main/types/agent-engine.types';
import type { TaskPlanStep } from '../main/plan/task-plan.types';
import type { TurnRespondMissingField, TurnRespondRequest } from './turn-respond.types';
import {
  listUserFacingRequiredParamsForTool,
  type PlanToolCandidateTool,
} from '../main/plan/plan-tool-candidates.util';
import { buildCompactToolInput } from '../../../tool-engine/tool-decision-input.util';

function isPresentArg(value: unknown): boolean {
  if (value == null) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  return true;
}

function readArgLeaf(args: Record<string, unknown>, field: string): unknown {
  if (Object.prototype.hasOwnProperty.call(args, field)) {
    return args[field];
  }
  const segments = field.split('.');
  let current: unknown = args;
  for (const segment of segments) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function paramHintForTool(
  tool: PlanToolCandidateTool,
  fieldName: string,
): string {
  const compact = buildCompactToolInput(
    tool.inputSchema,
    tool.schema,
    tool.agentMetadata,
  );
  const fromParams = compact.parameters.find((row) => row.name === fieldName);
  if (fromParams?.description?.trim()) {
    return fromParams.description.trim();
  }
  const fromBody = compact.requestBody?.properties?.find(
    (row) => row.name === fieldName,
  );
  if (fromBody?.description?.trim()) {
    return fromBody.description.trim();
  }
  return `请提供 ${fieldName}`;
}

export function listMissingUserFacingParamsForToolCall(input: {
  call: GraphToolCall;
  tool: PlanToolCandidateTool;
}): TurnRespondMissingField[] {
  const args =
    input.call.arguments && typeof input.call.arguments === 'object'
      ? (input.call.arguments as Record<string, unknown>)
      : {};
  const required = listUserFacingRequiredParamsForTool(input.tool);
  const missing: TurnRespondMissingField[] = [];
  for (const field of required) {
    if (!isPresentArg(readArgLeaf(args, field))) {
      missing.push({
        name: field,
        hint: paramHintForTool(input.tool, field),
      });
    }
  }
  return missing;
}

export type ToolParamGateResult =
  | { status: 'ready' }
  | {
      status: 'clarify';
      missingFields: TurnRespondMissingField[];
      toolName: string;
    };

/** 对已选 HTTP 工具调用做 schema 用户侧必填校验（param_gate）。 */
export function assessHttpToolCallsParamGate(input: {
  calls: GraphToolCall[];
  scopedTools: AgentEngineTool[];
  candidateTools?: AgentEngineTool[] | null;
}): ToolParamGateResult {
  const candidateNames =
    input.candidateTools && input.candidateTools.length > 0
      ? new Set(input.candidateTools.map((tool) => tool.name))
      : null;
  const toolPool =
    candidateNames != null
      ? input.scopedTools.filter((tool) => candidateNames.has(tool.name))
      : input.scopedTools;

  for (const call of input.calls) {
    if (candidateNames != null && !candidateNames.has(call.name)) {
      return {
        status: 'clarify',
        missingFields: [
          {
            name: 'tool',
            hint: '当前计划步骤不允许使用该 API，请从候选工具中选择',
          },
        ],
        toolName: call.name,
      };
    }
    const tool = toolPool.find((row) => row.name === call.name);
    if (!tool) {
      continue;
    }
    const missingFields = listMissingUserFacingParamsForToolCall({ call, tool });
    if (missingFields.length > 0) {
      return {
        status: 'clarify',
        missingFields,
        toolName: call.name,
      };
    }
  }
  return { status: 'ready' };
}

export function buildParamGateClarificationRequest(input: {
  userMessage: string;
  planStep: TaskPlanStep;
  missingFields: TurnRespondMissingField[];
  toolName: string;
}): TurnRespondRequest {
  return {
    kind: 'clarification',
    userMessage: input.userMessage,
    payload: {
      missingFields: input.missingFields,
      planStepId: input.planStep.id,
      toolRole: input.planStep.toolRole,
      readinessReason: `param_gate:${input.toolName}`,
    },
  };
}
