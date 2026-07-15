import type { LlmChatMessage } from '../llm/llm.types';
import { compactWorkflowNodeOutputForSummarize, formatPriorOutputsForDetectClues, workflowNodeOutputsToSummarizeObservations } from './workflow-node-outputs-summarize.util';
export { compactWorkflowNodeOutputForSummarize, formatPriorOutputsForDetectClues, workflowNodeOutputsToSummarizeObservations, };
export declare function formatWorkflowNodeOutputsForPrompt(nodeOutputs: Record<string, unknown>): string | null;
export declare function appendWorkflowNodeOutputsToLlmMessages(messages: LlmChatMessage[], nodeOutputs: Record<string, unknown> | undefined): LlmChatMessage[];
