import type { WorkflowProfile } from './workflow.types';
export declare const WORKFLOW_INTENT_VERSION: 1;
export type WorkflowIntentOperation = 'read' | 'judge' | 'deliver' | 'mutate';
export type WorkflowDeliverChannel = 'speak' | 'fill';
export type WorkflowImageEvidenceCapability = {
    enabled: boolean;
    hint?: string;
    from?: 'upstream' | 'page_context' | 'all';
};
export type WorkflowIntentCapabilities = {
    images?: WorkflowImageEvidenceCapability;
    policyHint?: string;
};
export type WorkflowIntentSlots = {
    readToolIds?: number[];
    fillHostToolIds?: number[];
    writeToolId?: number;
};
export type WorkflowIntentStepBase = {
    id: string;
    name?: string;
    objective?: string;
};
export type WorkflowIntentReadStep = WorkflowIntentStepBase & {
    operation: 'read';
    slots?: Pick<WorkflowIntentSlots, 'readToolIds'>;
    capabilities?: Pick<WorkflowIntentCapabilities, 'images'>;
};
export type WorkflowIntentJudgeStep = WorkflowIntentStepBase & {
    operation: 'judge';
    capabilities?: Pick<WorkflowIntentCapabilities, 'policyHint'>;
};
export type WorkflowIntentDeliverStep = WorkflowIntentStepBase & {
    operation: 'deliver';
    channel: WorkflowDeliverChannel;
    slots?: Pick<WorkflowIntentSlots, 'fillHostToolIds'>;
};
export type WorkflowIntentMutateStep = WorkflowIntentStepBase & {
    operation: 'mutate';
    slots: {
        writeToolId: number;
        readToolIds?: number[];
    };
    explainBeforeConfirm?: boolean;
    summarizeAfter?: boolean;
};
export type WorkflowIntentStep = WorkflowIntentReadStep | WorkflowIntentJudgeStep | WorkflowIntentDeliverStep | WorkflowIntentMutateStep;
export type WorkflowIntentEdgeKind = 'always' | 'state' | 'default';
export type WorkflowIntentStateDef = {
    key: string;
    description: string;
};
export type WorkflowIntentEdge = {
    id: string;
    from: string;
    to: string;
    kind?: WorkflowIntentEdgeKind;
    state?: WorkflowIntentStateDef;
};
export type WorkflowIntent = {
    version: typeof WORKFLOW_INTENT_VERSION;
    profile: WorkflowProfile;
    entryStepId: string;
    steps: WorkflowIntentStep[];
    edges: WorkflowIntentEdge[];
};
export declare function isWorkflowIntentOperation(value: unknown): value is WorkflowIntentOperation;
