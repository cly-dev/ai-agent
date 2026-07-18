import type { WorkflowActionKind } from './workflow.types';
import type { WorkflowIrNodeType } from './workflow-ir.types';
export type IrToLegacyActionMapping = {
    kind: 'direct';
    action: WorkflowActionKind;
} | {
    kind: 'expand';
    actions: readonly WorkflowActionKind[];
    note: string;
} | {
    kind: 'none';
    note: string;
};
export declare const IR_DIRECT_EXECUTOR_TYPES: readonly ["data_query", "structured_output", "host_effect", "message_send", "tool_call"];
export type IrDirectExecutorType = (typeof IR_DIRECT_EXECUTOR_TYPES)[number];
export declare function mapIrTypeToLegacyAction(type: WorkflowIrNodeType): IrToLegacyActionMapping;
export declare function isIrDirectExecutorType(type: WorkflowIrNodeType): type is IrDirectExecutorType;
export declare function legacyActionForDirectIrType(type: WorkflowIrNodeType): WorkflowActionKind | null;
