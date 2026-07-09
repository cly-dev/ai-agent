import { AIMessage } from '@langchain/core/messages';
import { AgentRunSseGateway } from '../../../../session-run/agent-run-sse.gateway';
import type { AgentMachineCode } from '../../agent-run-user-messages.util';
import type { MessageBlock, MessageBlockPatch } from '../../message/message-blocks.types';
import type { LlmChatMessage } from '../../../../llm/llm.types';
import { LlmService } from '../../../../llm/llm.service';
import { type SummarizeProseStreamSession } from '../../summarize-prose-stream.util';
import type { SummarizeLlmDelivery } from '../summarize/summarize-llm-delivery.util';
import { RunAssistantArtifactStore, type RunAssistantArtifactPhase } from './run-assistant-artifact.store';
import type { PlanSummarizePublishMode } from '../plan/task-plan.types';
export declare class AgentRunSseEmitter {
    private readonly runSse;
    private readonly llmService;
    private readonly assistantArtifact;
    private readonly logger;
    private readonly streamSeq;
    private readonly runProseDeltaEmitted;
    private readonly runAuthoritativeFullSerialized;
    constructor(runSse: AgentRunSseGateway, llmService: LlmService, assistantArtifact: RunAssistantArtifactStore);
    private shouldEmitForRun;
    thinkBufferKey(sessionId: string, runId: number): string;
    clearThinkBuffer(sessionId: string, runId: number): void;
    emitRunMessageBlocksIfNeeded(sessionId: string, runId: number, turnId: number): void;
    publishRuleBlocksOnly(sessionId: string, runId: number, blocks: MessageBlock[], turnId?: number): MessageBlock[];
    emitThink(sessionId: string, runId: number | undefined, chunk: string, mode?: 'delta' | 'replace'): void;
    emitMessageBlocks(sessionId: string, runId: number | undefined, blocks: MessageBlock[], options?: {
        code?: AgentMachineCode;
        mode?: 'delta' | 'full';
        action?: 'stream';
        turnId?: number;
        debugSource?: Record<string, unknown>;
    }): void;
    emitBlockPatch(sessionId: string, runId: number, patch: MessageBlockPatch): void;
    streamRunnableMessages(runnable: {
        stream: (messages: unknown[]) => Promise<AsyncIterable<unknown>>;
        invoke: (messages: unknown[]) => Promise<AIMessage>;
    }, messages: Array<Record<string, string>>, sessionId: string, runId: number, abortSignal?: AbortSignal): Promise<AIMessage>;
    summarizeMessageBlocks(messages: LlmChatMessage[], sessionId: string, runId: number, ruleBlocks: MessageBlock[], fallbackPlainText: string, _delivery: SummarizeLlmDelivery, publishMode?: PlanSummarizePublishMode): Promise<{
        blocks: MessageBlock[];
        rawOutput: string;
    }>;
    commitAssistantArtifact(sessionId: string, runId: number, blocks: MessageBlock[], phase?: RunAssistantArtifactPhase): MessageBlock[];
    private replayStaticProseBeforeFull;
    private emitRuleBlockPlaceholders;
    private finishSummarizeBlocks;
    private emitAuthoritativeFullFromArtifact;
    streamProseLlm(messages: LlmChatMessage[], sessionId: string, runId: number, options?: {
        turnId?: number;
        beforeStream?: () => void;
        abortSignal?: AbortSignal;
        messageTokenBudget?: number;
    }): Promise<{
        userMarkdown: string;
        routedMessage: string;
        rawLlmSource: string;
        proseSession: SummarizeProseStreamSession;
        model: string;
        turnId?: number;
    }>;
    private streamSummarizeProseOnly;
    publishAssistantBlocks(sessionId: string, runId: number, blocks: MessageBlock[], options?: {
        turnId?: number;
        phase?: RunAssistantArtifactPhase;
        code?: AgentMachineCode;
        commitArtifact?: boolean;
    }): MessageBlock[];
    private throwRunAborted;
    private extractAiMessageText;
}
