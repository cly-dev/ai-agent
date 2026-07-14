import { AIMessage } from '@langchain/core/messages';
import type { LlmChatMessage } from '../../../../../llm/llm.types';
import { type SplitToolObservationsOutput } from '../../../observation-format.util';
import { type HostToolDecisionDefinition } from '../../../../../host-bridge';
import type { TaskPlanSnapshot } from '../../plan/task-plan.types';
import type { GraphToolCall } from '../../types/agent-engine.types';
import type { AgentGraphDeps } from '../types/graph.types';
export interface AgentGraphDecisionHelpers {
    buildLlmInvokeMessages: typeof buildLlmInvokeMessages;
    buildDecisionPrompt: (promptMessages: LlmChatMessage[], tools: Parameters<typeof buildDecisionPrompt>[2], observationSplit: Parameters<typeof buildDecisionPrompt>[3], enableToolCall: Parameters<typeof buildDecisionPrompt>[4], scope: Parameters<typeof buildDecisionPrompt>[5], activeSkillPrompt?: Parameters<typeof buildDecisionPrompt>[6], taskPlan?: Parameters<typeof buildDecisionPrompt>[7], hostToolsForPrompt?: Parameters<typeof buildDecisionPrompt>[8]) => ReturnType<typeof buildDecisionPrompt>;
    toLangChainInvokeMessage: typeof toLangChainInvokeMessage;
    buildTaskPlanTraceForLlmStep: typeof buildTaskPlanTraceForLlmStep;
    extractToolCalls: typeof extractToolCalls;
    extractAiMessageText: typeof extractAiMessageText;
    stringifyForPrompt: typeof stringifyForPrompt;
    renderToolDecisionTemplate: (scope: Parameters<typeof renderToolDecisionTemplate>[1], toolCallInstruction: Parameters<typeof renderToolDecisionTemplate>[2]) => ReturnType<typeof renderToolDecisionTemplate>;
    appendPlanStepDecisionHint: typeof appendPlanStepDecisionHint;
    extractRequiredParamNames: typeof extractRequiredParamNames;
}
export declare function buildLlmInvokeMessages(promptMessages: LlmChatMessage[], observationSplit: SplitToolObservationsOutput, latestUserMessage: string, toolSchemaJson: string, hostToolSchemaJson: string, toolDecisionPrompt: string, messageTokenBudget: number, taskPlan?: TaskPlanSnapshot | null, workflowNodeOutputs?: Record<string, unknown>): {
    messages: Array<{
        role: string;
        content: string;
        toolCallId?: string;
    }>;
    trimMeta: {
        configuredBudget: number;
        effectiveBudget: number;
        estimatedTokensBefore: number;
        estimatedTokensAfter: number;
        trimmed: boolean;
        droppedMessageIndexes: number[];
        truncatedMessageIndexes: number[];
    };
};
export declare function toLangChainInvokeMessage(message: {
    role: string;
    content: string;
    toolCallId?: string;
}): Record<string, string>;
export declare function appendPlanStepDecisionHint(toolDecisionPrompt: string, taskPlan: TaskPlanSnapshot | null | undefined): string;
export declare function stringifyForPrompt(value: unknown): string;
export declare function extractRequiredParamNames(inputSchema: unknown): string[];
export declare function buildTaskPlanTraceForLlmStep(taskPlan: TaskPlanSnapshot | null | undefined): Record<string, unknown> | null;
export declare function extractAiMessageText(message: AIMessage): string;
export declare function extractToolCalls(message: AIMessage): GraphToolCall[];
export declare function buildDecisionPrompt(deps: AgentGraphDeps, promptMessages: LlmChatMessage[], tools: Array<{
    id: number;
    name: string;
    description: string;
    inputSchema: unknown;
    schema: unknown;
    responseProfile: unknown;
    agentMetadata: unknown;
    method: string;
}>, observationSplit: SplitToolObservationsOutput, enableToolCall: boolean, scope: {
    appClientId: number;
    agentId: number;
}, activeSkillPrompt?: string | null, taskPlan?: TaskPlanSnapshot | null, hostToolsForPrompt?: HostToolDecisionDefinition[]): Promise<{
    toolDecisionPrompt: string;
    toolSchemaJson: string;
    hostToolSchemaJson: string;
    observationsJson: string;
    agentPrompt: string | null;
}>;
export declare function renderToolDecisionTemplate(deps: AgentGraphDeps, scope: {
    appClientId: number;
    agentId: number;
}, toolCallInstruction: string): Promise<string>;
export declare function createAgentGraphDecisionHelpers(deps: AgentGraphDeps): AgentGraphDecisionHelpers;
