import { normalizeToolCallArgs } from '../../../llm/tool-call-args.util';
import { compactArgsForObservation } from '../observation-format.util';
import {
  isAgentToolErrorObservation,
  type AgentToolErrorObservation,
} from '../agent-run-user-messages.util';
import type { ToolObservation } from '../main/agent-engine.types';
import { getPendingPlanToolStep } from '../main/task-plan.util';
import type { TaskPlanSnapshot } from '../main/task-plan.types';
import {
  toolCallSignature,
  type ToolCallLike,
} from './tool-call-dedupe.util';

export function resolveToolErrorHttpStatus(
  output: unknown,
): number | undefined {
  if (!isAgentToolErrorObservation(output)) {
    return undefined;
  }
  return output.httpStatus;
}

/** 400 类参数/请求错误：允许回 LLM 调整参数后重试。 */
export function isRecoverableParameterToolError(output: unknown): boolean {
  if (!isAgentToolErrorObservation(output)) {
    return false;
  }
  if (output.httpStatus === 400) {
    return true;
  }
  const text = `${output.detail} ${output.userHint}`.toLowerCase();
  return text.includes('failed: 400') || /\b400\b/.test(text);
}

/** 非 400 可恢复错误：应中断 Plan 并终态 summarize（503/401/5xx 等）。 */
export function isTerminalPlanToolError(output: unknown): boolean {
  return (
    isAgentToolErrorObservation(output) &&
    !isRecoverableParameterToolError(output)
  );
}

export function shouldAbortPlanOnTerminalToolError(input: {
  reason: string;
  errorOutput: unknown;
  taskPlan: TaskPlanSnapshot | null | undefined;
}): boolean {
  if (!input.taskPlan || input.reason !== 'tool_error_summarize') {
    return false;
  }
  if (!isTerminalPlanToolError(input.errorOutput)) {
    return false;
  }
  const step = getPendingPlanToolStep(input.taskPlan);
  return step?.kind === 'tool';
}

export function shouldAbortPlanOnRecoverableSameArgs(input: {
  reason: string;
  taskPlan: TaskPlanSnapshot | null | undefined;
}): boolean {
  return (
    input.reason === 'tool_error_same_args_repeat' && input.taskPlan != null
  );
}

function observationArgsSignature(
  name: string,
  args: Record<string, unknown> | undefined,
): string | null {
  if (!args) {
    return null;
  }
  const compact = compactArgsForObservation(args);
  if (!compact || Object.keys(compact).length === 0) {
    return null;
  }
  return toolCallSignature({
    name,
    arguments: normalizeToolCallArgs(compact),
  });
}

export function findLastRecoverableToolErrorObservation(
  observations: ToolObservation[],
): {
  name: string;
  output: AgentToolErrorObservation;
  args: Record<string, unknown>;
} | null {
  for (let index = observations.length - 1; index >= 0; index -= 1) {
    const row = observations[index];
    if (!row || !isRecoverableParameterToolError(row.output)) {
      continue;
    }
    const args =
      compactArgsForObservation(row.llmPayload?.args) ?? row.llmPayload?.args;
    if (!args || Object.keys(args).length === 0) {
      continue;
    }
    return {
      name: row.name,
      output: row.output as AgentToolErrorObservation,
      args,
    };
  }
  return null;
}

/** 400 恢复路径：LLM 再次提交与失败调用完全相同的 tool+args。 */
export function pendingCallsRepeatRecoverableToolError(input: {
  pendingToolCalls: ToolCallLike[];
  observations: ToolObservation[];
}): { repeat: boolean; errorOutput?: AgentToolErrorObservation } {
  const failed = findLastRecoverableToolErrorObservation(input.observations);
  if (!failed) {
    return { repeat: false };
  }
  const failedSig = observationArgsSignature(failed.name, failed.args);
  if (!failedSig) {
    return { repeat: false };
  }
  for (const call of input.pendingToolCalls) {
    if (toolCallSignature(call) === failedSig) {
      return { repeat: true, errorOutput: failed.output };
    }
  }
  return { repeat: false };
}

export function buildSameArgsRepeatUserHint(
  errorOutput: AgentToolErrorObservation,
): string {
  const base = errorOutput.userHint.trim();
  const suffix = '未能根据上次报错调整查询参数，请修改条件后重试。';
  return base.length > 0 ? `${base}\n\n${suffix}` : suffix;
}
