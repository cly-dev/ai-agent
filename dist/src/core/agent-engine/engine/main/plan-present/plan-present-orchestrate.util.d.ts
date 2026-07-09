import type { LlmChatMessage } from '../../../../llm/llm.types';
import type { LlmService } from '../../../../llm/llm.service';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import type { AgentEngineTool, ToolObservation } from '../types/agent-engine.types';
import type { AgentRunSseEmitter } from '../run/agent-run-sse.emitter';
import { type PlanPresentSummarizeResult } from './plan-draft-summarize.util';
import { type PlanPresentUserLayerPublishDeps } from './plan-present-user-message.util';
import type { RunAssistantArtifactStore } from '../run/run-assistant-artifact.store';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';
export type PlanPresentOrchestrateDeps = PlanPresentUserLayerPublishDeps & {
    llmService: LlmService;
    promptRegistry: PromptRegistryService;
    logger: {
        warn: (message: string) => void;
        log: (message: string) => void;
    };
    sse: Pick<AgentRunSseEmitter, 'emitThink' | 'emitMessageBlocks' | 'publishAssistantBlocks' | 'streamProseLlm'>;
    assistantArtifact: Pick<RunAssistantArtifactStore, 'peekTurnId' | 'peekBlocks'>;
};
export type RunPlanPresentSummarizeInput = {
    toolName: string;
    toolDescription?: string;
    userMessage: string;
    mergedObservation: ToolObservation;
    toolObservations: ToolObservation[];
    promptMessages: LlmChatMessage[];
    sessionId: string;
    runId: number;
    scope: {
        appClientId: number;
        agentId: number;
    };
    taskPlan: TaskPlanSnapshot | null | undefined;
    scopedTools: AgentEngineTool[];
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
};
export declare function runPlanPresentSummarize(deps: PlanPresentOrchestrateDeps, input: RunPlanPresentSummarizeInput): Promise<PlanPresentSummarizeResult>;
