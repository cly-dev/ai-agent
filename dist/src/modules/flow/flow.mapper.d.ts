import type { FlowDetailRow, FlowListItem, FlowListRow, FlowResponse, FlowRevisionResponse, FlowRevisionSummaryResponse } from './flow.types';
export declare function toFlowResponse(row: FlowDetailRow): FlowResponse;
export declare function toFlowListItem(row: FlowListRow): FlowListItem;
export declare function toFlowRevisionResponse(row: {
    id: number;
    flowId: number;
    version: number;
    deliverable: string;
    intent: unknown;
    ir: unknown;
    constraints: unknown;
    changeNote: string | null;
    createdAt: Date;
}, currentVersion: number): FlowRevisionResponse;
export declare function toFlowRevisionSummaryResponse(row: {
    id: number;
    flowId: number;
    version: number;
    deliverable: string;
    changeNote: string | null;
    createdAt: Date;
}, currentVersion: number): FlowRevisionSummaryResponse;
