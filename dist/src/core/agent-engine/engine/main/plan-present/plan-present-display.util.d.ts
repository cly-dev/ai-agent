import type { AgentEngineTool } from '../types/agent-engine.types';
export declare function isBareMachineSubmitDisplay(displayDraft: string, machineSubmit: string | null | undefined): boolean;
export declare function buildDeterministicMutationPresentMarkdown(input: {
    arguments: Record<string, unknown>;
    writeTool: AgentEngineTool;
}): string;
