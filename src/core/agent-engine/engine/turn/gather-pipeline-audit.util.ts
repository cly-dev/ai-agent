import type { AgentRunStep } from '../main/types/agent-engine.types';
import { CLARIFICATION_REQUEST_OBSERVATION_NAME } from './turn-respond.util';

export type GatherPipelineAudit = {
  planStepId: string | null;
  toolResolve: {
    strategy: string | null;
    candidateCount: number;
    candidateNames: string[];
  } | null;
  llm: {
    toolCallCount: number;
    toolNames: string[];
  } | null;
  paramGate: {
    status: string;
    missingFieldCount: number;
  } | null;
  toolsStepCount: number;
  prematureClarification: boolean;
  invariantViolations: string[];
};

function readStepOutput(step: AgentRunStep | undefined): Record<string, unknown> {
  if (!step?.output || typeof step.output !== 'object' || Array.isArray(step.output)) {
    return {};
  }
  return step.output as Record<string, unknown>;
}

function findLastStep(
  steps: AgentRunStep[],
  type: AgentRunStep['type'],
): AgentRunStep | undefined {
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    if (steps[index]?.type === type) {
      return steps[index];
    }
  }
  return undefined;
}

function readStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((item): item is string => typeof item === 'string');
}

/** 从 run steps 汇总 gather 管线审计（通用，不绑业务场景）。 */
export function buildGatherPipelineAudit(input: {
  steps: AgentRunStep[];
  planStepId?: string | null;
  pendingClarification?: boolean;
}): GatherPipelineAudit {
  const toolResolveStep = findLastStep(input.steps, 'tool_resolve');
  const llmStep = findLastStep(input.steps, 'llm');
  const paramGateStep = findLastStep(input.steps, 'param_gate');
  const toolsStepCount = input.steps.filter((step) => step.type === 'tool').length;

  const toolResolveOut = readStepOutput(toolResolveStep);
  const llmOut = readStepOutput(llmStep);
  const paramGateOut = readStepOutput(paramGateStep);

  const toolCalls = llmOut.toolCalls;
  const toolCallRows = Array.isArray(toolCalls) ? toolCalls : [];
  const toolNames = toolCallRows
    .map((row) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        return null;
      }
      const name = (row as Record<string, unknown>).name;
      return typeof name === 'string' ? name : null;
    })
    .filter((name): name is string => name != null);

  const prematureClarification = input.pendingClarification === true;
  const invariantViolations: string[] = [];

  if (prematureClarification && toolsStepCount === 0) {
    invariantViolations.push('clarification_without_tools_execution');
  }
  if (
    toolCallRows.length === 0 &&
    prematureClarification &&
    paramGateOut.status !== 'clarify'
  ) {
    invariantViolations.push('clarification_without_tool_calls_or_param_gate');
  }

  return {
    planStepId: input.planStepId ?? null,
    toolResolve: toolResolveStep
      ? {
          strategy:
            typeof toolResolveOut.strategy === 'string'
              ? toolResolveOut.strategy
              : null,
          candidateCount:
            typeof toolResolveOut.candidateCount === 'number'
              ? toolResolveOut.candidateCount
              : 0,
          candidateNames: readStringArray(toolResolveOut.candidateNames),
        }
      : null,
    llm: llmStep
      ? {
          toolCallCount: toolCallRows.length,
          toolNames,
        }
      : null,
    paramGate: paramGateStep
      ? {
          status:
            typeof paramGateOut.status === 'string' ? paramGateOut.status : 'unknown',
          missingFieldCount:
            typeof paramGateOut.missingFieldCount === 'number'
              ? paramGateOut.missingFieldCount
              : 0,
        }
      : null,
    toolsStepCount,
    prematureClarification,
    invariantViolations,
  };
}

export function pendingClarificationFromRespond(pending: unknown): boolean {
  if (!pending || typeof pending !== 'object') {
    return false;
  }
  const row = pending as Record<string, unknown>;
  if (row.mode === 'turn') {
    const request = row.request;
    if (request && typeof request === 'object' && !Array.isArray(request)) {
      return (request as Record<string, unknown>).kind === 'clarification';
    }
  }
  if (row.mode === 'observation') {
    const observation = row.observation;
    if (
      observation &&
      typeof observation === 'object' &&
      !Array.isArray(observation)
    ) {
      return (
        (observation as Record<string, unknown>).name ===
        CLARIFICATION_REQUEST_OBSERVATION_NAME
      );
    }
  }
  return false;
}
