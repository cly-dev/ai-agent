import { HttpException, NotFoundException } from '@nestjs/common';
import { ToolHttpResponseError } from '../../tool-engine/tool-response-source.util';
import { isRequestedSkillRunError } from './main/skill/requested-skill-run.error';
import { requestedSkillUserMessage } from './main/skill/requested-skill-run.service';

export type AgentMachineCode =
  | 'INTENT_RECALL_FAILED'
  | 'SKILL_NOT_VISIBLE'
  | 'SKILL_TOOLS_EMPTY'
  | 'SKILL_NOT_IN_SCOPE'
  | 'SKILL_EXPAND_FAILED'
  | 'TOOL_AUTH_FAILED'
  | 'TOOL_TIMEOUT'
  | 'TOOL_EMPTY_RESULT'
  | 'TOOL_DOWNSTREAM_ERROR'
  | 'LLM_TIMEOUT'
  | 'LLM_RATE_LIMIT'
  | 'WRITE_CONFIRMATION_REQUIRED';

/** 工具节点写入 observation 的标准错误结构。 */
export type AgentToolErrorObservation = {
  _agentToolError: true;
  userHint: string;
  detail: string;
  code: AgentMachineCode;
  /** 下游 HTTP body 原文，或 invoke 阶段原始错误文本。 */
  responseSource?: unknown;
  httpStatus?: number;
};

export type BuildToolErrorObservationContext = {
  isMutation?: boolean;
};

export function isAgentToolErrorObservation(
  output: unknown,
): output is AgentToolErrorObservation {
  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return false;
  }
  const row = output as Record<string, unknown>;
  return row._agentToolError === true && typeof row.userHint === 'string';
}

export function extractToolErrorUserHint(output: unknown): string | null {
  if (!isAgentToolErrorObservation(output)) {
    return null;
  }
  const hint = output.userHint.trim();
  return hint.length > 0 ? hint : null;
}

export function extractToolErrorCode(output: unknown): AgentMachineCode | null {
  if (!isAgentToolErrorObservation(output)) {
    return null;
  }
  return output.code;
}

export function extractToolErrorResponseSource(output: unknown): unknown {
  if (!isAgentToolErrorObservation(output)) {
    return undefined;
  }
  return output.responseSource;
}

function parseHttpStatusFromToolError(error: unknown): number | undefined {
  if (error instanceof ToolHttpResponseError) {
    return error.httpResponse.status;
  }
  const text = error instanceof Error ? error.message : String(error);
  const match = text.match(/\bfailed:\s*(\d{3})\b/i);
  if (!match) {
    return undefined;
  }
  const status = Number.parseInt(match[1]!, 10);
  return Number.isFinite(status) ? status : undefined;
}

function resolveToolErrorResponseSource(error: unknown): unknown | undefined {
  if (error instanceof ToolHttpResponseError) {
    return error.httpResponse.bodyText;
  }
  if (error instanceof Error && !(error instanceof ToolHttpResponseError)) {
    return error.message;
  }
  return undefined;
}

export function formatResponseSourceForDisplay(source: unknown): string {
  if (source === null || source === undefined) {
    return '';
  }
  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (!trimmed) {
      return '';
    }
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return trimmed;
    }
  }
  try {
    return JSON.stringify(source, null, 2);
  } catch {
    return String(source);
  }
}

function extractDownstreamMessage(responseSource: unknown): string | null {
  if (responseSource == null) {
    return null;
  }
  let row: Record<string, unknown> | null = null;
  if (typeof responseSource === 'string') {
    const trimmed = responseSource.trim();
    if (!trimmed) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        row = parsed as Record<string, unknown>;
      }
    } catch {
      return trimmed.length <= 240 ? trimmed : `${trimmed.slice(0, 240)}…`;
    }
  } else if (
    typeof responseSource === 'object' &&
    !Array.isArray(responseSource)
  ) {
    row = responseSource as Record<string, unknown>;
  }
  if (!row) {
    return null;
  }
  const parts: string[] = [];
  for (const key of ['message', 'errorKey', 'type', 'code'] as const) {
    const value = row[key];
    if (value != null && String(value).trim().length > 0) {
      parts.push(`${key}=${String(value).trim()}`);
    }
  }
  return parts.length > 0 ? parts.join(', ') : null;
}

export function buildToolErrorObservation(
  error: unknown,
  context?: BuildToolErrorObservationContext,
): AgentToolErrorObservation {
  const detail = error instanceof Error ? error.message : String(error);
  const httpStatus = parseHttpStatusFromToolError(error);
  const responseSource = resolveToolErrorResponseSource(error);
  return {
    _agentToolError: true,
    userHint: buildToolFailureUserMessage(error, {
      isMutation: context?.isMutation,
      httpStatus,
      responseSource,
    }),
    detail,
    code: resolveToolFailureCode(error, { httpStatus }),
    ...(responseSource !== undefined ? { responseSource } : {}),
    ...(httpStatus !== undefined ? { httpStatus } : {}),
  };
}

/** 工具 HTTP / 鉴权 / 超时等失败时给用户的说明。 */
export function buildToolFailureUserMessage(
  error: unknown,
  context?: {
    isMutation?: boolean;
    httpStatus?: number;
    responseSource?: unknown;
  },
): string {
  const text = error instanceof Error ? error.message : String(error);
  const lower = text.toLowerCase();
  const httpStatus =
    context?.httpStatus ?? parseHttpStatusFromToolError(error);
  const downstreamMsg = extractDownstreamMessage(context?.responseSource);
  const isMutation = context?.isMutation === true;

  if (
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('auth unresolved') ||
    lower.includes('api key')
  ) {
    return '当前账号暂无权限访问该数据，请确认已绑定正确的集成密钥后再试。';
  }
  if (
    lower.includes('abort') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('etimedout')
  ) {
    return isMutation
      ? '写操作超时，请稍后重试或联系管理员。'
      : '查询超时，未能获取到数据。请缩小查询范围或稍后再试。';
  }
  if (httpStatus != null && httpStatus >= 400) {
    if (isMutation) {
      if (httpStatus >= 500) {
        return downstreamMsg
          ? `写操作失败（HTTP ${httpStatus}）：${downstreamMsg}`
          : `写操作失败：下游服务返回 HTTP ${httpStatus} 错误。`;
      }
      return downstreamMsg
        ? `写操作未通过（HTTP ${httpStatus}）：${downstreamMsg}`
        : `写操作未通过：下游返回 HTTP ${httpStatus}。`;
    }
    if (httpStatus === 404) {
      return '未查询到符合条件的数据，请核对查询条件后重试。';
    }
    if (httpStatus >= 500) {
      return downstreamMsg
        ? `服务暂时不可用（HTTP ${httpStatus}）：${downstreamMsg}`
        : `服务暂时不可用（HTTP ${httpStatus}），请稍后再试。`;
    }
    return downstreamMsg
      ? `请求未成功（HTTP ${httpStatus}）：${downstreamMsg}`
      : `请求未成功（HTTP ${httpStatus}），请核对参数后重试。`;
  }
  if (lower.includes('404') || lower.includes('not found')) {
    return '未查询到符合条件的数据，请核对查询条件后重试。';
  }
  if (lower.includes('not found in bound tools')) {
    return '当前无法调用所需能力，请换个说法或联系管理员检查工具配置。';
  }
  if (lower.includes('did not match expected schema')) {
    return isMutation
      ? '写操作参数未通过校验，请根据工具 schema 修正后重试。'
      : '工具参数未通过校验，请根据工具 schema 修正后重试。';
  }
  return isMutation
    ? '写操作未能完成，请稍后重试；若仍失败请联系管理员。'
    : '未能完成查询，请确认条件后重试；若仍失败请联系管理员。';
}

/** 意图召回 / 工具收窄失败时给用户的说明。 */
export function buildIntentScopeFailureUserMessage(): string {
  return '暂时没能准确理解你的问题。请补充具体对象、编号或你想完成的操作，我再帮你处理。';
}

/** 主循环 LLM 调用失败时给用户的说明。 */
export function buildLlmFailureUserMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  const lower = text.toLowerCase();

  if (
    lower.includes('rate limit') ||
    lower.includes('429') ||
    lower.includes('quota')
  ) {
    return '智能服务当前较繁忙，请稍后再试。';
  }
  if (
    lower.includes('context') ||
    lower.includes('token') ||
    lower.includes('length')
  ) {
    return '对话内容过长，请缩短问题或开启新会话后再试。';
  }
  if (
    lower.includes('timeout') ||
    lower.includes('abort') ||
    lower.includes('etimedout')
  ) {
    return '生成回复超时，请稍后重试。';
  }
  return '智能回复暂时不可用，请稍后重试；若持续失败请联系管理员。';
}

export function resolveToolFailureCode(
  error: unknown,
  context?: { httpStatus?: number },
): AgentMachineCode {
  const text = error instanceof Error ? error.message : String(error);
  const lower = text.toLowerCase();
  const httpStatus =
    context?.httpStatus ?? parseHttpStatusFromToolError(error);
  if (
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('auth unresolved') ||
    lower.includes('api key')
  ) {
    return 'TOOL_AUTH_FAILED';
  }
  if (
    lower.includes('abort') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('etimedout')
  ) {
    return 'TOOL_TIMEOUT';
  }
  if (httpStatus != null && httpStatus >= 400) {
    return 'TOOL_DOWNSTREAM_ERROR';
  }
  if (lower.includes('did not match expected schema')) {
    return 'TOOL_DOWNSTREAM_ERROR';
  }
  return 'TOOL_EMPTY_RESULT';
}

export function resolveLlmFailureCode(error: unknown): AgentMachineCode {
  const text = error instanceof Error ? error.message : String(error);
  const lower = text.toLowerCase();
  if (
    lower.includes('rate limit') ||
    lower.includes('429') ||
    lower.includes('quota')
  ) {
    return 'LLM_RATE_LIMIT';
  }
  return 'LLM_TIMEOUT';
}

/**
 * 将未在节点内消化的运行错误映射为用户文案；返回 null 表示应继续向上抛出（如会话不存在）。
 */
export function resolveAgentRunFailureUserMessage(
  error: unknown,
): string | null {
  if (error instanceof NotFoundException) {
    return null;
  }
  if (isRequestedSkillRunError(error)) {
    return requestedSkillUserMessage(error.code);
  }
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();
  if (
    lower.includes('embedding') ||
    lower.includes('intent recall') ||
    lower.includes('category vector recall')
  ) {
    return buildIntentScopeFailureUserMessage();
  }
  if (error instanceof HttpException) {
    const status = error.getStatus();
    if (status === 404) {
      return null;
    }
    const msg = extractHttpExceptionMessage(error);
    if (status === 400 && msg.includes('exceeded max steps')) {
      return '处理步骤较多未能完成，请简化问题或拆成多次提问。';
    }
    if (msg.includes('tool ') && msg.includes('failed')) {
      return buildToolFailureUserMessage(error);
    }
    return buildLlmFailureUserMessage(error);
  }
  return buildLlmFailureUserMessage(error);
}

export function resolveAgentRunFailureCode(
  error: unknown,
): AgentMachineCode | null {
  if (error instanceof NotFoundException) {
    return null;
  }
  if (isRequestedSkillRunError(error)) {
    return error.code;
  }
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();
  if (
    lower.includes('embedding') ||
    lower.includes('intent recall') ||
    lower.includes('category vector recall')
  ) {
    return 'INTENT_RECALL_FAILED';
  }
  if (error instanceof HttpException) {
    const msg = extractHttpExceptionMessage(error);
    if (msg.includes('tool ') && msg.includes('failed')) {
      return resolveToolFailureCode(error);
    }
  }
  return resolveLlmFailureCode(error);
}

function extractHttpExceptionMessage(error: HttpException): string {
  const response = error.getResponse();
  if (typeof response === 'string') {
    return response;
  }
  if (response && typeof response === 'object' && 'message' in response) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.map(String).join('; ');
    }
  }
  return error.message;
}
