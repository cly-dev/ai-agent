import type { WorkflowIntent } from './workflow-intent.types';
import type { WorkflowIrDocument } from './workflow-ir.types';
import type { WorkflowPresetKind } from './workflow-preset.types';
import type { WorkflowEdge, WorkflowNodeDef, WorkflowProfile } from './workflow.types';
export type ResolvedWorkflowIntentPersist = {
    intent: WorkflowIntent;
    ir: WorkflowIrDocument;
    legacyGraph: {
        nodes: WorkflowNodeDef[];
        edges: WorkflowEdge[];
        entryNodeId: string;
    };
};
export declare function resolveWorkflowIntentForPersist(input: {
    profile: WorkflowProfile;
    preset?: WorkflowPresetKind;
    presetConfig?: Record<string, unknown>;
    intent?: unknown;
}): ResolvedWorkflowIntentPersist;
