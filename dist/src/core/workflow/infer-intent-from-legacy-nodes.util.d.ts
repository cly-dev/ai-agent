import { type WorkflowIntent } from './workflow-intent.types';
import type { WorkflowNodeDef, WorkflowProfile } from './workflow.types';
export type InferIntentFromLegacyResult = {
    intent: WorkflowIntent;
    warnings: string[];
    matchedPattern: 'mutation' | 'fetch_fill_speak' | 'fill_speak' | 'fetch_speak' | 'speak_only' | 'custom';
};
export declare function inferWorkflowIntentFromLegacyNodes(input: {
    profile: WorkflowProfile;
    nodes: WorkflowNodeDef[];
}): InferIntentFromLegacyResult;
