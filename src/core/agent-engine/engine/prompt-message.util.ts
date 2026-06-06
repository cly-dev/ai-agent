import type { LlmChatMessage } from '../../llm/llm.types';

export function isAgentPromptMessage(message: LlmChatMessage): boolean {
  return (
    message.role === 'system' && message.content.includes('<agent_prompt>')
  );
}

export function isWorkingMemoryMessage(message: LlmChatMessage): boolean {
  return (
    message.role === 'system' && message.content.includes('<working_memory>')
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

export function extractWorkingMemoryMessages(
  messages: LlmChatMessage[],
): LlmChatMessage[] {
  return messages.filter(isWorkingMemoryMessage);
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
