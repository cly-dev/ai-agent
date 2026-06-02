import { HttpException, NotFoundException } from '@nestjs/common';

export type AgentMachineCode =
  | 'INTENT_RECALL_FAILED'
  | 'TOOL_AUTH_FAILED'
  | 'TOOL_TIMEOUT'
  | 'TOOL_EMPTY_RESULT'
  | 'LLM_TIMEOUT'
  | 'LLM_RATE_LIMIT';

/** 工具节点写入 observation 的标准错误结构。 */
export type AgentToolErrorObservation = {
  _agentToolError: true;
  userHint: string;
  detail: string;
  code: AgentMachineCode;
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

export function buildToolErrorObservation(error: unknown): AgentToolErrorObservation {
  const detail = error instanceof Error ? error.message : String(error);
  return {
    _agentToolError: true,
    userHint: buildToolFailureUserMessage(error),
    detail,
    code: resolveToolFailureCode(error),
  };
}

/** 工具 HTTP / 鉴权 / 超时等失败时给用户的说明。 */
export function buildToolFailureUserMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  const lower = text.toLowerCase();

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
    return '查询超时，未能获取到数据。请缩小查询范围或稍后再试。';
  }
  if (lower.includes('404') || lower.includes('not found')) {
    return '未查询到符合条件的数据，请核对查询条件后重试。';
  }
  if (
    lower.includes('failed: 4') ||
    lower.includes('failed: 5') ||
    lower.includes('tool ') && lower.includes('failed')
  ) {
    return '未能查询到相关数据，请确认查询条件是否正确，或稍后再试。';
  }
  if (lower.includes('not found in bound tools')) {
    return '当前无法调用所需能力，请换个说法或联系管理员检查工具配置。';
  }
  return '未能查询到相关数据，请确认条件后重试；若仍失败请联系管理员。';
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

export function resolveToolFailureCode(error: unknown): AgentMachineCode {
  const text = error instanceof Error ? error.message : String(error);
  const lower = text.toLowerCase();
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
