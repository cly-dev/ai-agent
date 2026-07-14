import type { AgentRunStep } from '../main/types/agent-engine.types';
export type GatherPipelineAudit = {
    planStepId: string | null;
    toolResolve: {
        strategy: string | null;
        candidateCount: number;
        candidateNames: string[];
    } | null;
    llm: {
        toolCallCount: number;
        toolNames: string[];
    } | null;
    paramGate: {
        status: string;
        missingFieldCount: number;
    } | null;
    toolsStepCount: number;
    prematureClarification: boolean;
    invariantViolations: string[];
};
export declare function buildGatherPipelineAudit(input: {
    steps: AgentRunStep[];
    planStepId?: string | null;
    pendingClarification?: boolean;
}): GatherPipelineAudit;
export declare function pendingClarificationFromRespond(pending: unknown): boolean;
