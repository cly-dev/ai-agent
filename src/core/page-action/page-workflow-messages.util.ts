import type { LlmChatMessage } from '../llm/llm.types';
import { appendWorkflowNodeOutputsToLlmMessages } from '../workflow/workflow-node-outputs.util';

export function appendWorkflowNodeOutputsToMessages(
  messages: LlmChatMessage[],
  nodeOutputs: Record<string, unknown>,
): LlmChatMessage[] {
  return appendWorkflowNodeOutputsToLlmMessages(messages, nodeOutputs);
}

export function injectWorkflowNodeObjective(
  messages: LlmChatMessage[],
  objective: string,
  prefix?: string | null,
): LlmChatMessage[] {
  const text = prefix?.trim()
    ? `${prefix.trim()}\n\n${objective}`
    : objective;
  return [
    ...messages,
    {
      role: 'user',
      content: text,
    },
  ];
}
