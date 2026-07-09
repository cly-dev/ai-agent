import type { LlmChatMessage } from '../llm/llm.types';
export declare function formatWorkflowNodeOutputsForPrompt(nodeOutputs: Record<string, unknown>): string | null;
export declare function appendWorkflowNodeOutputsToLlmMessages(messages: LlmChatMessage[], nodeOutputs: Record<string, unknown> | undefined): LlmChatMessage[];
