import type { LlmService } from '../../../../llm/llm.service';
import type { LlmChatMessage, LlmChatResult } from '../../../../llm/llm.types';
import type { PromptBudgetHints } from '../../../../llm/prompt-budget/prompt-budget.types';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import { type HostToolStreamToolTarget, type PlanReasonHostStreamDelivery } from '../../../../host-bridge/host-tool-stream-target.util';
import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import type { AgentRunSseGateway } from '../../../../session-run/agent-run-sse.gateway';
import type { ToolObservation } from '../types/agent-engine.types';
import type { PlanHostFillEntry } from './plan-host-fill.util';
export type PlanReasonHostMachineLayerContext = {
    agentPrompts: LlmChatMessage[];
    userContext: string;
    allowedToolNames: Set<string>;
    hostTools: HostToolDecisionDefinition[];
    pageContext: AgentChatPageContext | null | undefined;
    sessionId: string;
    runId: number;
    turnId: number;
    scope: {
        appClientId: number;
        agentId: number;
    };
    hostStepId: string;
    reasonStepId: string | null;
};
export type PlanReasonHostMachineLayerDeps = {
    llmService: LlmService;
    promptRegistry: PromptRegistryService;
    runSseGateway: Pick<AgentRunSseGateway, 'emitHostAction' | 'getBoundRunGeneration' | 'canPublishRun' | 'getRunAbortSignal'>;
    logger: {
        warn: (message: string) => void;
        log: (message: string) => void;
    };
};
export type PlanReasonHostMachineLayerResult = {
    fills: PlanHostFillEntry[];
    delivery: PlanReasonHostStreamDelivery['mode'];
    dslOutcome?: 'dispatched' | 'failed';
    hostToolStreamObservation?: ToolObservation;
    hostToolDispatchObservations?: ToolObservation[];
};
export declare function sanitizeMachineFillText(raw: string): string;
export declare function buildPlanHostFillsFromMachineText(input: {
    text: string;
    fillTools: HostToolStreamToolTarget[];
    allowedToolNames: Set<string>;
}): PlanHostFillEntry[];
type PlanReasonHostFillStreamTextSession = {
    ingestLlmDelta: (delta: string) => void;
    reconcileStreamResult: (fullContent: string) => boolean;
    resolveFillText: () => string;
    getRawAccumulatedLength: () => number;
    getRawAccumulatedText: () => string;
    readonly appendCount: number;
    readonly routedMessageChars: number;
};
export declare function createPlanReasonHostFillStreamTextSession(callbacks: {
    onSanitizedDelta?: (delta: string) => void;
}): PlanReasonHostFillStreamTextSession;
export type HostFillLlmStreamResult = {
    model: string | null;
    streamResult: LlmChatResult;
    fillText: string;
    appendCount: number;
    routedMessageChars: number;
    rawAccumulatedLen: number;
    rawAccumulatedText: string;
    reconciledFromStreamResult: boolean;
};
export declare function runHostFillLlmStream(input: {
    llmService: LlmService;
    messages: LlmChatMessage[];
    textSession: PlanReasonHostFillStreamTextSession;
    signal?: AbortSignal;
    budgetHints?: PromptBudgetHints;
    onLlmDelta?: (delta: {
        contentDelta: string;
        model?: string;
        done?: boolean;
    }) => void;
}): Promise<HostFillLlmStreamResult>;
export declare function runPlanReasonHostMachineLayer(deps: PlanReasonHostMachineLayerDeps, context: PlanReasonHostMachineLayerContext): Promise<PlanReasonHostMachineLayerResult>;
export declare function buildPlanReasonHostMachineContext(input: {
    agentPrompts: LlmChatMessage[];
    userMessage: string;
    planContext: string | null;
    hostTools: HostToolDecisionDefinition[];
    splitObservationsText: string | null;
    serializedOutput: string;
    allowedToolNames: Set<string>;
    pageContext: AgentChatPageContext | null | undefined;
    sessionId: string;
    runId: number;
    turnId: number;
    scope: {
        appClientId: number;
        agentId: number;
    };
    hostStepId: string;
    reasonStepId: string | null;
}): PlanReasonHostMachineLayerContext;
export {};
