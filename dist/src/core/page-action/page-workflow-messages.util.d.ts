import type { LlmChatMessage } from '../llm/llm.types';
export declare function appendWorkflowNodeOutputsToMessages(messages: LlmChatMessage[], nodeOutputs: Record<string, unknown>): LlmChatMessage[];
export declare function injectWorkflowNodeObjective(messages: LlmChatMessage[], objective: string, prefix?: string | null): LlmChatMessage[];
