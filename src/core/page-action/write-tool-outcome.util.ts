export type WriteToolBusinessFailure = {
  code: string;
  message: string;
};

function readNestedMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  if (typeof row.message === 'string' && row.message.trim()) {
    return row.message.trim();
  }
  if (typeof row.msg === 'string' && row.msg.trim()) {
    return row.msg.trim();
  }
  return null;
}

/** 识别 HTTP 写工具响应体中的业务失败（success:false / httpCode>=400）。 */
export function assessWriteToolBusinessFailure(
  output: unknown,
): WriteToolBusinessFailure | null {
  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return null;
  }
  const row = output as Record<string, unknown>;
  const httpCode =
    typeof row.httpCode === 'number'
      ? row.httpCode
      : typeof row.httpStatus === 'number'
        ? row.httpStatus
        : null;

  const nestedError = row.error;
  const nestedMessage = readNestedMessage(nestedError);
  const topLevelMessage =
    typeof row.message === 'string' && row.message.trim()
      ? row.message.trim()
      : null;

  if (row.success === false) {
    return {
      code: 'WRITE_FAILED',
      message:
        nestedMessage ??
        topLevelMessage ??
        (httpCode != null ? `Write API returned httpCode ${httpCode}` : 'Write API returned success=false'),
    };
  }

  if (httpCode != null && httpCode >= 400) {
    return {
      code: 'WRITE_FAILED',
      message:
        nestedMessage ??
        topLevelMessage ??
        `Write API returned httpCode ${httpCode}`,
    };
  }

  return null;
}
