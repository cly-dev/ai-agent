import type { LlmChatMessage } from '../../llm/llm.types';

export function isAgentPromptMessage(message: LlmChatMessage): boolean {
  return (
    message.role === 'system' && message.content.includes('<agent_prompt>')
  );
}

/** Excluded from tool-decision LLM context (summarize / platform rules). */
export function isDecisionLoopExcludedMessage(message: LlmChatMessage): boolean {
  if (message.role !== 'system') {
    return false;
  }
  const content = message.content;
  return (
    content.includes('<response_style>') ||
    content.includes('<message_blocks_spec>') ||
    content.includes('<user_memory>') ||
    content.includes('<session_history>')
  );
}

export function extractAgentPromptMessages(
  messages: LlmChatMessage[],
): LlmChatMessage[] {
  return messages.filter(isAgentPromptMessage);
}

export function joinAgentPromptText(messages: LlmChatMessage[]): string | null {
  const blocks = extractAgentPromptMessages(messages)
    .map((message) => message.content.trim())
    .filter((content) => content.length > 0);
  if (blocks.length === 0) {
    return null;
  }
  return blocks.join('\n\n');
}

/** Conversation turns only — drops platform/agent system blocks. */
export function extractConversationTurns(
  messages: LlmChatMessage[],
): LlmChatMessage[] {
  return messages.filter(
    (message) =>
      (message.role === 'user' || message.role === 'assistant') &&
      !message.content.includes('<current_user_request>'),
  );
}

function isSessionHistorySummaryMessage(message: LlmChatMessage): boolean {
  return (
    message.role === 'system' &&
    message.content.includes('<session_history_summary>')
  );
}

function isSessionHistoryGuideMessage(message: LlmChatMessage): boolean {
  return (
    message.role === 'system' &&
    message.content.includes('<session_history>') &&
    !message.content.includes('<session_history_summary>')
  );
}

/**
 * 决策环 LLM：注入压缩摘要 + 最近 user/assistant 轮次（不含本轮 pinned user，避免重复）。
 */
function isSessionMemoryBlockMessage(message: LlmChatMessage): boolean {
  if (message.role !== 'system') {
    return false;
  }
  const content = message.content;
  return (
    content.includes('<recent_episodes>') ||
    content.includes('<artifact_summaries>') ||
    content.includes('<active_task>') ||
    content.includes('<session_entities>')
  );
}

/** 决策环：注入回合叙事 / 工件摘要 / 任务态（由 PromptComposer 生成）。 */
export function extractSessionMemoryForDecision(
  messages: LlmChatMessage[],
): LlmChatMessage[] {
  return messages.filter(isSessionMemoryBlockMessage);
}

export function extractSessionHistoryForDecision(
  messages: LlmChatMessage[],
  latestUserMessage: string,
): LlmChatMessage[] {
  const latest = latestUserMessage.trim();
  const out: LlmChatMessage[] = [];

  for (const message of messages) {
    if (isSessionHistoryGuideMessage(message) || isSessionHistorySummaryMessage(message)) {
      out.push(message);
    }
  }

  const turns = extractConversationTurns(messages);
  for (let i = 0; i < turns.length; i += 1) {
    const turn = turns[i]!;
    const isLast = i === turns.length - 1;
    if (
      isLast &&
      turn.role === 'user' &&
      turn.content.trim() === latest
    ) {
      continue;
    }
    out.push(turn);
  }

  return out;
}
