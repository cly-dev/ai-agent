import type { AgentEngineTool, ToolObservation } from './main/types/agent-engine.types';
import type { RunAssistantArtifact } from './main/run/run-assistant-artifact.store';
import type { WriteConfirmationToolCall } from './write-confirmation-gate.util';
export declare function hasUserVisibleMutationPreview(input: {
    artifact: RunAssistantArtifact | null;
    observations: ToolObservation[];
}): boolean;
export declare function buildMutationArgsInvalidUserMessage(): string;
export declare function buildMutationPreviewUnavailableUserMessage(): string;
export declare function buildMutationPreviewMarkdownFromWriteCalls(writeCalls: WriteConfirmationToolCall[], scopedTools: AgentEngineTool[]): string;
