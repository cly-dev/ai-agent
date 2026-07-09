import type { PageActionRunStep } from './page-action-run-steps.util';
import { parsePageActionRunSteps } from './page-action-run-steps.util';

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractTextFromWriteArguments(args: unknown): string | null {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return null;
  }
  const row = args as Record<string, unknown>;

  for (const key of ['content', 'text', 'body', 'summary', 'message']) {
    const direct = pickString(row[key]);
    if (direct) {
      return direct;
    }
  }

  const reviewReply = row.reviewReply;
  if (reviewReply && typeof reviewReply === 'object' && !Array.isArray(reviewReply)) {
    const nested = reviewReply as Record<string, unknown>;
    const preview = nested._preview;
    if (Array.isArray(preview)) {
      for (const item of preview) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          continue;
        }
        const content = pickString((item as Record<string, unknown>).content);
        if (content) {
          return content;
        }
      }
    }
  }

  if (Array.isArray(reviewReply)) {
    for (const item of reviewReply) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        continue;
      }
      const content = pickString((item as Record<string, unknown>).content);
      if (content) {
        return content;
      }
    }
  }

  return null;
}

function readWriteArgumentsFromStepDetail(
  detail: Record<string, unknown>,
): unknown {
  if (detail.writeArguments != null) {
    return detail.writeArguments;
  }
  const rawToolCall = detail.rawToolCall;
  if (rawToolCall && typeof rawToolCall === 'object' && !Array.isArray(rawToolCall)) {
    return (rawToolCall as Record<string, unknown>).arguments;
  }
  if (detail.llmStructuredOutput != null) {
    return detail.llmStructuredOutput;
  }
  return null;
}

function extractFromSteps(steps: PageActionRunStep[]): string | null {
  const preferredNames = new Set([
    'compose_mutation.end',
    'compose_mutation:compose',
    'awaiting_approval',
  ]);

  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];
    if (!preferredNames.has(step.name) || !step.detail) {
      continue;
    }
    const summaryText = pickString(step.detail.summaryText);
    if (summaryText) {
      return summaryText;
    }
    const fromArgs = extractTextFromWriteArguments(
      readWriteArgumentsFromStepDetail(step.detail),
    );
    if (fromArgs) {
      return fromArgs;
    }
  }

  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];
    if (!step.detail) {
      continue;
    }
    const fromArgs = extractTextFromWriteArguments(
      readWriteArgumentsFromStepDetail(step.detail),
    );
    if (fromArgs) {
      return fromArgs;
    }
  }

  return null;
}

/**
 * 任务中心 / 详情展示的完整产物正文。
 * 优先 fillText；mutation 写成功等场景从 steps 回填 compose 草稿。
 */
export function resolvePageActionRunOutputText(input: {
  fillText?: string | null;
  errorMessage?: string | null;
  steps?: unknown;
}): string | null {
  const fillText = input.fillText?.trim();
  if (fillText) {
    return fillText;
  }

  const fromSteps = extractFromSteps(parsePageActionRunSteps(input.steps));
  if (fromSteps) {
    return fromSteps;
  }

  const errorMessage = input.errorMessage?.trim();
  if (errorMessage) {
    return errorMessage;
  }

  return null;
}
