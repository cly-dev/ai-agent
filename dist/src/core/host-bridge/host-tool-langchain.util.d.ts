import type { DynamicStructuredTool } from '@langchain/core/tools';
import type { HostToolDecisionDefinition } from './host-tool-decision.types';
export declare function buildHostLangChainTools(definitions: HostToolDecisionDefinition[]): {
    tools: DynamicStructuredTool[];
    byName: Map<string, DynamicStructuredTool>;
};
export declare function summarizeHostToolsForLlmSchema(definitions: HostToolDecisionDefinition[]): Array<{
    name: string;
    description: string;
    argsSchema: Record<string, unknown>;
    execution: 'browser';
}>;
