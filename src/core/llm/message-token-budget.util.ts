import type { LlmChatMessage } from './llm.types';

const TRUNCATION_SUFFIX =
  '\n...[content truncated due to token limit]';

/** Rough token estimate for mixed CJK/Latin text (no external tokenizer). */
export function estimateTextTokens(text: string): number {
  if (!text) {
    return 0;
  }
  let tokens = 0;
  for (const char of text) {
    tokens += char.codePointAt(0)! <= 0x7f ? 0.25 : 0.5;
  }
  return Math.ceil(tokens);
}

export function estimateMessageTokens(message: LlmChatMessage): number {
  return 4 + estimateTextTokens(message.content);
}

export function estimateMessagesTokens(messages: LlmChatMessage[]): number {
  return messages.reduce(
    (sum, message) => sum + estimateMessageTokens(message),
    0,
  );
}

function truncateContentToTokenBudget(
  content: string,
  tokenBudget: number,
): string {
  if (tokenBudget <= 0) {
    return TRUNCATION_SUFFIX.trim();
  }
  if (estimateTextTokens(content) <= tokenBudget) {
    return content;
  }
  const suffixTokens = estimateTextTokens(TRUNCATION_SUFFIX);
  const bodyBudget = Math.max(tokenBudget - suffixTokens, 16);
  let low = 0;
  let high = content.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (estimateTextTokens(content.slice(0, mid)) <= bodyBudget) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  const keep = Math.max(low, 1);
  return `${content.slice(0, keep)}${TRUNCATION_SUFFIX}`;
}

function isToolResultMessage(message: LlmChatMessage): boolean {
  return (
    message.role === 'user' &&
    message.content.startsWith('[tool_result:')
  );
}

function cloneMessages(messages: LlmChatMessage[]): LlmChatMessage[] {
  return messages.map((message) => ({ ...message }));
}

/**
 * Trim messages to fit an estimated input token budget.
 * Keeps the tail (latest turns / decision prompt) and drops or truncates older content first.
 */
export function trimMessagesToTokenBudget(
  messages: LlmChatMessage[],
  maxTokens: number,
): LlmChatMessage[] {
  if (messages.length === 0 || maxTokens <= 0) {
    return messages;
  }
  const working = cloneMessages(messages);
  if (estimateMessagesTokens(working) <= maxTokens) {
    return working;
  }

  // Drop oldest non-tail messages first (preserve the final message).
  while (working.length > 1 && estimateMessagesTokens(working) > maxTokens) {
    const dropIndex = working.findIndex((message, index) => {
      if (index === working.length - 1) {
        return false;
      }
      if (index === 0 && message.role === 'system') {
        return false;
      }
      return true;
    });
    if (dropIndex < 0) {
      break;
    }
    working.splice(dropIndex, 1);
  }

  // Prefer truncating tool results, then other large messages (never drop the tail).
  while (working.length > 0 && estimateMessagesTokens(working) > maxTokens) {
    let targetIndex = -1;
    let targetSize = 0;
    for (let index = 0; index < working.length - 1; index += 1) {
      const size = estimateTextTokens(working[index].content);
      const priority = isToolResultMessage(working[index]) ? 1_000_000 + size : size;
      if (priority > targetSize) {
        targetSize = priority;
        targetIndex = index;
      }
    }
    if (targetIndex < 0) {
      break;
    }
    const message = working[targetIndex];
    const currentTokens = estimateMessageTokens(message);
    const excess = estimateMessagesTokens(working) - maxTokens;
    const nextContentBudget = Math.max(
      estimateTextTokens(message.content) - excess,
      32,
    );
    const truncated = truncateContentToTokenBudget(
      message.content,
      nextContentBudget,
    );
    if (truncated === message.content) {
      break;
    }
    working[targetIndex] = { ...message, content: truncated };
    if (estimateMessageTokens(working[targetIndex]) >= currentTokens) {
      break;
    }
  }

  // Last resort: truncate the final message.
  if (estimateMessagesTokens(working) > maxTokens) {
    const lastIndex = working.length - 1;
    const last = working[lastIndex];
    const otherTokens =
      estimateMessagesTokens(working) - estimateMessageTokens(last);
    const contentBudget = Math.max(maxTokens - otherTokens - 4, 32);
    working[lastIndex] = {
      ...last,
      content: truncateContentToTokenBudget(last.content, contentBudget),
    };
  }

  return working;
}
