import type {
  ToolExecutionResult,
  ToolHttpResponseSource,
} from './tool-engine.types';

export class ToolHttpResponseError extends Error {
  readonly httpResponse: ToolHttpResponseSource;

  constructor(message: string, httpResponse: ToolHttpResponseSource) {
    super(message);
    this.name = 'ToolHttpResponseError';
    this.httpResponse = httpResponse;
  }
}

export function buildHttpResponseSource(
  response: Pick<Response, 'ok' | 'status' | 'statusText'>,
  bodyText: string,
  bodyParsed: unknown,
): ToolHttpResponseSource {
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    bodyText,
    bodyParsed,
  };
}

/** invoke / HTTP 失败时的原始错误文本或 body，不做 agent 包装。 */
export function extractRawInvokeError(error: unknown): unknown {
  if (error instanceof ToolHttpResponseError) {
    return error.httpResponse.bodyText;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return error;
}

/** 优先取已写入的 responseSource；否则 fallback 到 HTTP body 原文。 */
export function resolveToolResponseSource(input: {
  toolResult: Pick<ToolExecutionResult, 'responseSource' | 'httpResponse'>;
}): unknown {
  if (input.toolResult.responseSource !== undefined) {
    return input.toolResult.responseSource;
  }
  if (input.toolResult.httpResponse) {
    return input.toolResult.httpResponse.bodyText;
  }
  return undefined;
}
