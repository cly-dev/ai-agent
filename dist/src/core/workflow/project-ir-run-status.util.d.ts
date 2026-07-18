import type { WorkflowIrNodeType } from './workflow-ir.types';
import type { WorkflowNodeStatus, WorkflowRunState } from './workflow.types';
export type IrRunNodeProjection = {
    irNodeId: string;
    irType?: WorkflowIrNodeType;
    stepNodeIds: string[];
    status: WorkflowNodeStatus;
    current: boolean;
};
export declare function projectIrRunNodeStatuses(run: WorkflowRunState): IrRunNodeProjection[];
export declare function resolveCurrentIrNodeId(run: WorkflowRunState): string | null;
