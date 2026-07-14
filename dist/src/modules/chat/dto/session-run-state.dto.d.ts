import { WriteDraftEditPolicyDto, WriteDraftPublicDto } from '../../../common/dto/write-draft-public.dto';
export declare class PendingWriteGatePublicStateDto {
    runId: number;
    turnId: number;
    draftRetryCount: number;
    draftRetryMax: number | null;
    canRetry: boolean;
    writeDraft?: WriteDraftPublicDto;
    writeDrafts?: WriteDraftPublicDto[];
    editPolicy?: WriteDraftEditPolicyDto | null;
    editPolicies?: WriteDraftEditPolicyDto[];
}
export declare class SessionRunStateResponseDto {
    generation: number;
    activeRunId: number | null;
    activeTurnId: number | null;
    pendingJobCount: number;
    redisBacked: boolean;
    pendingWriteGate: PendingWriteGatePublicStateDto | null;
}
