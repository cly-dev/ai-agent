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

function isObservationsBlockMessage(message: LlmChatMessage): boolean {
  return (
    message.content.includes('<working_memory_observations>') ||
    message.content.includes('<current_run_observations>') ||
    message.content.includes('<observations>')
  );
}

function isToolSchemaBlockMessage(message: LlmChatMessage): boolean {
  return message.content.includes('<tool_schema>');
}

function isToolDecisionBlockMessage(message: LlmChatMessage): boolean {
  return message.content.includes('<tool_decision>');
}

function isAgentPromptMessage(message: LlmChatMessage): boolean {
  return (
    message.role === 'system' && message.content.includes('<agent_prompt>')
  );
}

function isDecisionLoopPinnedMessage(message: LlmChatMessage): boolean {
  return (
    isAgentPromptMessage(message) ||
    isPinnedUserRequestMessage(message) ||
    isToolSchemaBlockMessage(message) ||
    isToolDecisionBlockMessage(message)
  );
}

/** Current-turn user question; must survive budget trimming ahead of older history. */
function isPinnedUserRequestMessage(message: LlmChatMessage): boolean {
  return (
    message.role === 'user' &&
    message.content.includes('<current_user_request>')
  );
}

function cloneMessages(messages: LlmChatMessage[]): LlmChatMessage[] {
  return messages.map((message) => ({ ...message }));
}

export type TrimMessagesResult = {
  messages: LlmChatMessage[];
  estimatedTokensBefore: number;
  estimatedTokensAfter: number;
  trimmed: boolean;
  droppedMessageIndexes: number[];
  truncatedMessageIndexes: number[];
};

/**
 * Trim messages to fit an estimated input token budget.
 * Decision-loop blocks (agent/tool_schema/tool_decision/user) are never dropped.
 * Observations may be truncated but not dropped.
 */
export function trimMessagesToTokenBudgetDetailed(
  messages: LlmChatMessage[],
  maxTokens: number,
): TrimMessagesResult {
  const estimatedTokensBefore = estimateMessagesTokens(messages);
  if (messages.length === 0 || maxTokens <= 0) {
    return {
      messages,
      estimatedTokensBefore,
      estimatedTokensAfter: estimatedTokensBefore,
      trimmed: false,
      droppedMessageIndexes: [],
      truncatedMessageIndexes: [],
    };
  }

  const working = cloneMessages(messages);
  const droppedMessageIndexes: number[] = [];
  const truncatedMessageIndexes: number[] = [];

  if (estimateMessagesTokens(working) <= maxTokens) {
    return {
      messages: working,
      estimatedTokensBefore,
      estimatedTokensAfter: estimatedTokensBefore,
      trimmed: false,
      droppedMessageIndexes,
      truncatedMessageIndexes,
    };
  }

  // Drop only non-decision messages (e.g. old session history if ever injected here).
  while (working.length > 1 && estimateMessagesTokens(working) > maxTokens) {
    const dropIndex = working.findIndex((message, index) => {
      if (index === working.length - 1) {
        return false;
      }
      if (isDecisionLoopPinnedMessage(message)) {
        return false;
      }
      if (isObservationsBlockMessage(message)) {
        return false;
      }
      return true;
    });
    if (dropIndex < 0) {
      break;
    }
    droppedMessageIndexes.push(dropIndex);
    working.splice(dropIndex, 1);
  }

  // Truncate observations first — they are the largest block and safe to shorten.
  while (working.length > 0 && estimateMessagesTokens(working) > maxTokens) {
    const observationIndex = working.findIndex((message) =>
      isObservationsBlockMessage(message),
    );
    if (observationIndex < 0) {
      break;
    }
    const message = working[observationIndex];
    const excess = estimateMessagesTokens(working) - maxTokens;
    const nextContentBudget = Math.max(
      estimateTextTokens(message.content) - excess,
      64,
    );
    const truncated = truncateContentToTokenBudget(
      message.content,
      nextContentBudget,
    );
    if (truncated === message.content) {
      break;
    }
    working[observationIndex] = { ...message, content: truncated };
    truncatedMessageIndexes.push(observationIndex);
    if (
      estimateMessageTokens(working[observationIndex]) >=
      estimateMessageTokens(message)
    ) {
      break;
    }
  }

  // Truncate other large non-pinned messages (legacy tool_result user messages).
  while (working.length > 0 && estimateMessagesTokens(working) > maxTokens) {
    let targetIndex = -1;
    let targetSize = 0;
    for (let index = 0; index < working.length - 1; index += 1) {
      if (isDecisionLoopPinnedMessage(working[index])) {
        continue;
      }
      if (isObservationsBlockMessage(working[index])) {
        continue;
      }
      const size = estimateTextTokens(working[index].content);
      const priority = isToolResultMessage(working[index])
        ? 1_000_000 + size
        : size;
      if (priority > targetSize) {
        targetSize = priority;
        targetIndex = index;
      }
    }
    if (targetIndex < 0) {
      break;
    }
    const message = working[targetIndex];
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
    truncatedMessageIndexes.push(targetIndex);
    if (
      estimateMessageTokens(working[targetIndex]) >=
      estimateMessageTokens(message)
    ) {
      break;
    }
  }

  const estimatedTokensAfter = estimateMessagesTokens(working);
  return {
    messages: working,
    estimatedTokensBefore,
    estimatedTokensAfter,
    trimmed: estimatedTokensAfter < estimatedTokensBefore,
    droppedMessageIndexes,
    truncatedMessageIndexes,
  };
}

export function trimMessagesToTokenBudget(
  messages: LlmChatMessage[],
  maxTokens: number,
): LlmChatMessage[] {
  return trimMessagesToTokenBudgetDetailed(messages, maxTokens).messages;
}
