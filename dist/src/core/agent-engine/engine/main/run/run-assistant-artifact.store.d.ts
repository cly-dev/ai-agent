import type { MessageBlock } from '../../message/message-blocks.types';
export type RunAssistantArtifactPhase = 'draft' | 'final';
export type RunAssistantArtifact = {
    runId: number;
    turnId: number;
    blocks: MessageBlock[];
    serialized: string;
    phase: RunAssistantArtifactPhase;
};
export declare class RunAssistantArtifactStore {
    private readonly logger;
    private readonly slots;
    runKey(sessionId: string, runId: number): string;
    reset(sessionId: string, runId: number, turnId: number): void;
    clear(sessionId: string, runId: number): void;
    commit(sessionId: string, runId: number, blocks: MessageBlock[], phase?: RunAssistantArtifactPhase): RunAssistantArtifact | null;
    peek(sessionId: string, runId: number): RunAssistantArtifact | null;
    peekSerialized(sessionId: string, runId: number): string | null;
    peekBlocks(sessionId: string, runId: number): MessageBlock[];
    peekTurnId(sessionId: string, runId: number): number | null;
    isPersistableAssistantArtifact(sessionId: string, runId: number): boolean;
    appendBlocks(sessionId: string, runId: number, blocks: MessageBlock[]): RunAssistantArtifact | null;
    shouldPersistAtFinish(sessionId: string, runId: number): boolean;
    formatOutput(sessionId: string, runId: number, fallbackSerialized: string): {
        serialized: string;
        stepPlain: string;
    };
    rephase(sessionId: string, runId: number, phase: RunAssistantArtifactPhase): void;
}
