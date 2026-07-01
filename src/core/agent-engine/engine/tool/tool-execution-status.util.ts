import { parseAgentMetadata } from '../../../tool-engine/tool-agent-metadata.util';
import { isMutationTool } from '../../../tool-engine/tool-mutation.util';
import { OperationType, ToolMode } from '../../../tool-engine/tool-agent-metadata.types';
import { isPaginationParam } from '../../../tool-engine/tool-pagination-params.util';
import {
  extractToolErrorCode,
  isAgentToolErrorObservation,
  type AgentMachineCode,
} from '../agent-run-user-messages.util';
import { isEmptyListToolObservation } from './tool-observation.util';

export type ToolExecutionStatus = 'SUCCESS' | 'EMPTY' | 'ERROR';

/** ERROR 后路由：重试 / 回 LLM 改参 / 直接 summarize。 */
export type ToolErrorDisposition = 'retry' | 'llm' | 'summarize';

const TEMPORAL_USER_HINT_RE =
  /近\s*\d+\s*天|最\s*近\s*\d+|last\s+\d+\s+days?|past\s+\d+\s+days?|时间范围|日期范围|startdate|enddate/i;
const TEMPORAL_ARG_KEY_RE =
  /date|time|day|start|end|from|to|period|range|created|updated/i;

function isMissingParamValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function errorTextFromOutput(output: unknown): string {
  if (isAgentToolErrorObservation(output)) {
    return `${output.detail} ${output.userHint}`.toLowerCase();
  }
  if (output instanceof Error) {
    return output.message.toLowerCase();
  }
  return String(output).toLowerCase();
}

function extractRequiredParamNames(inputSchema: unknown): string[] {
  if (!inputSchema || typeof inputSchema !== 'object' || Array.isArray(inputSchema)) {
    return [];
  }
  const params = (inputSchema as Record<string, unknown>).parameters;
  if (!Array.isArray(params)) {
    return [];
  }
  return params
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }
      const row = item as Record<string, unknown>;
      if (row.required !== true) {
        return null;
      }
      const name = row.name;
      return typeof name === 'string' && name.trim() ? name.trim() : null;
    })
    .filter((name): name is string => name != null);
}

export function readToolInvokeMaxRetries(): number {
  const raw = process.env.TOOL_INVOKE_MAX_RETRIES?.trim();
  const value = raw ? Number.parseInt(raw, 10) : 2;
  return Number.isFinite(value) && value >= 0 ? value : 2;
}

export { isMutationTool } from '../../../tool-engine/tool-mutation.util';

/** tools 节点内重试已结束后，retry 类 disposition 应视为终态 summarize。 */
export function finalizeToolErrorDispositionAfterInvoke(
  disposition: ToolErrorDisposition,
): ToolErrorDisposition {
  return disposition === 'retry' ? 'summarize' : disposition;
}

export function resolveToolErrorDisposition(output: unknown): ToolErrorDisposition {
  if (!isAgentToolErrorObservation(output)) {
    return 'summarize';
  }
  const code = extractToolErrorCode(output) ?? inferCodeFromErrorText(output);
  const lower = errorTextFromOutput(output);

  if (code === 'TOOL_AUTH_FAILED') {
    return 'summarize';
  }
  if (lower.includes('404') || lower.includes('not found')) {
    return 'llm';
  }
  if (lower.includes('failed: 400') || /\b400\b/.test(lower)) {
    return 'llm';
  }
  if (
    code === 'TOOL_TIMEOUT' ||
    lower.includes('429') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504') ||
    lower.includes('econnreset') ||
    lower.includes('network')
  ) {
    return 'retry';
  }
  return 'summarize';
}

function inferCodeFromErrorText(
  output: unknown,
): AgentMachineCode | null {
  return extractToolErrorCode(output);
}

export type ToolExecutionStatusContext = {
  agentMetadata?: unknown;
};

/** 写/变更类工具：HTTP 2xx 且无 error observation 即 SUCCESS，不做空列表 EMPTY 判定。 */
export function isMutationExecutionContext(
  context?: ToolExecutionStatusContext,
): boolean {
  return isMutationTool(context?.agentMetadata);
}

export function classifyToolExecutionStatus(
  output: unknown,
  context?: ToolExecutionStatusContext,
): ToolExecutionStatus {
  if (isAgentToolErrorObservation(output)) {
    return 'ERROR';
  }
  if (isMutationExecutionContext(context)) {
    return 'SUCCESS';
  }
  if (isEmptyListToolObservation(output)) {
    return 'EMPTY';
  }
  return 'SUCCESS';
}

/** 路由/重试以 raw 为准；EMPTY 判定可在投影后的 payload 上识别（仅读/取数工具）。 */
export function resolveToolExecutionStatusAfterInvoke(
  rawOutput: unknown,
  projectedOutput: unknown,
  context?: ToolExecutionStatusContext,
): ToolExecutionStatus {
  if (classifyToolExecutionStatus(rawOutput, context) === 'ERROR') {
    return 'ERROR';
  }
  return classifyToolExecutionStatus(projectedOutput, context);
}

/** 读/取数工具低质量或空列表 → TOOL_EMPTY_RESULT；写操作成功不记此码。 */
export function resolveToolStepMachineCode(input: {
  quality: 'high' | 'medium' | 'low';
  output: unknown;
  agentMetadata?: unknown;
}): AgentMachineCode | null {
  if (isAgentToolErrorObservation(input.output)) {
    return extractToolErrorCode(input.output);
  }
  if (isMutationTool(input.agentMetadata)) {
    return null;
  }
  if (isEmptyListToolObservation(input.output)) {
    return null;
  }
  if (input.quality === 'low') {
    return 'TOOL_EMPTY_RESULT';
  }
  return null;
}

/** ERROR 保留 raw，避免 profile 投影成空列表后丢失错误语义。 */
export function resolveToolObservationOutputForStore(
  rawOutput: unknown,
  projectedOutput: unknown,
): unknown {
  if (classifyToolExecutionStatus(rawOutput) === 'ERROR') {
    return rawOutput;
  }
  return projectedOutput;
}

export function findLastErrorObservation<
  T extends { output: unknown },
>(
  observations: T[],
  preferredIndices?: number[],
): T | null {
  if (preferredIndices && preferredIndices.length > 0) {
    for (let index = preferredIndices.length - 1; index >= 0; index -= 1) {
      const row = observations[preferredIndices[index]!];
      if (row && isAgentToolErrorObservation(row.output)) {
        return row;
      }
    }
  }
  for (let index = observations.length - 1; index >= 0; index -= 1) {
    const row = observations[index];
    if (row && isAgentToolErrorObservation(row.output)) {
      return row;
    }
  }
  return null;
}

export function userMessageHasTemporalScope(userMessage: string): boolean {
  return TEMPORAL_USER_HINT_RE.test(userMessage.trim());
}

export function toolArgsHaveTemporalScope(args: Record<string, unknown>): boolean {
  return Object.entries(args).some(
    ([key, value]) =>
      TEMPORAL_ARG_KEY_RE.test(key) && !isMissingParamValue(value),
  );
}

/** LIST/SEARCH/STATS 缺必填筛选或用户要时间范围但未传时间参数 → 不算 EMPTY 终态。 */
export function hasIncompleteToolInvocation(input: {
  userMessage: string;
  agentMetadata: unknown;
  inputSchema: unknown;
  args: Record<string, unknown>;
}): boolean {
  const meta = parseAgentMetadata(input.agentMetadata);
  const isListLike =
    meta?.operation === OperationType.LIST ||
    meta?.operation === OperationType.SEARCH ||
    meta?.operation === OperationType.STATS;

  const requiredParams = extractRequiredParamNames(input.inputSchema);
  for (const name of requiredParams) {
    if (isPaginationParam(name)) {
      continue;
    }
    if (isMissingParamValue(input.args[name])) {
      return true;
    }
  }

  if (
    isListLike &&
    userMessageHasTemporalScope(input.userMessage) &&
    !toolArgsHaveTemporalScope(input.args)
  ) {
    return true;
  }

  return false;
}

export function shouldShortCircuitEmptyToSummarize(input: {
  userMessage: string;
  toolCalls: Array<{ name: string; arguments: Record<string, unknown> }>;
  scopedTools: Array<{
    name: string;
    agentMetadata: unknown;
    inputSchema: unknown;
  }>;
  executionStatuses: ToolExecutionStatus[];
}): boolean {
  if (input.executionStatuses.length === 0) {
    return false;
  }
  if (input.executionStatuses.some((status) => status === 'ERROR')) {
    return false;
  }
  if (input.toolCalls.some((call) => {
    const tool = input.scopedTools.find((row) => row.name === call.name);
    return tool != null && isMutationTool(tool.agentMetadata);
  })) {
    return false;
  }
  if (!input.executionStatuses.every((status) => status === 'EMPTY')) {
    return false;
  }
  for (const call of input.toolCalls) {
    const tool = input.scopedTools.find((row) => row.name === call.name);
    if (!tool) {
      continue;
    }
    if (
      hasIncompleteToolInvocation({
        userMessage: input.userMessage,
        agentMetadata: tool.agentMetadata,
        inputSchema: tool.inputSchema,
        args: call.arguments,
      })
    ) {
      return false;
    }
  }
  return true;
}

export function pickSummarizeErrorObservation<
  T extends { output: unknown },
>(
  observations: T[],
  dispositions: ToolErrorDisposition[],
  roundObservationIndices: number[],
): T | null {
  for (let roundIndex = 0; roundIndex < roundObservationIndices.length; roundIndex += 1) {
    const observationIndex = roundObservationIndices[roundIndex];
    const row = observations[observationIndex];
    if (!row) {
      continue;
    }
    if (
      isAgentToolErrorObservation(row.output) &&
      dispositions[roundIndex] === 'summarize'
    ) {
      return row;
    }
  }
  return null;
}

/** 本轮 ERROR 且 disposition 均为 llm 时回 LLM；任一为 summarize 则不走此分支。 */
export function shouldReturnToLlmAfterToolErrors(
  observations: Array<{ output: unknown }>,
  dispositions: ToolErrorDisposition[],
  roundObservationIndices: number[],
): boolean {
  let sawError = false;
  for (let roundIndex = 0; roundIndex < roundObservationIndices.length; roundIndex += 1) {
    const observationIndex = roundObservationIndices[roundIndex];
    const row = observations[observationIndex];
    if (!row || !isAgentToolErrorObservation(row.output)) {
      continue;
    }
    sawError = true;
    if (dispositions[roundIndex] === 'summarize') {
      return false;
    }
  }
  return sawError;
}

export function readRetryBackoffMs(attempt: number): number {
  const base = 400;
  return base * attempt;
}
