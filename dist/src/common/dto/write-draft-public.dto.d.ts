export declare class MessageBlockDto {
    type: string;
    content?: string;
    format?: string;
    title?: string;
    language?: string;
}
export declare class WriteDraftToolPublicDto {
    name: string;
    toolId?: number;
    riskLevel: string;
}
export declare class WriteDraftPresentationPublicDto {
    summaryText?: string | null;
    previewBlocks: MessageBlockDto[];
}
export declare class WriteDraftProvenancePublicDto {
    draftRetryCount: number;
    draftRetryMax: number | null;
    canRetry: boolean;
    composedAt: string;
    lastEvent: 'composed' | 'suspended' | 'user_edit' | 'retry';
}
export declare class WriteDraftPublicDto {
    version: number;
    tool: WriteDraftToolPublicDto;
    arguments: Record<string, unknown>;
    presentation: WriteDraftPresentationPublicDto;
    provenance: WriteDraftProvenancePublicDto;
}
export declare class WriteDraftFieldPolicyDto {
    path: string;
    label: string;
    role: string;
    widget: string;
    editable: boolean;
    required: boolean;
    value?: unknown;
    reason?: string;
}
export declare class WriteDraftEditPolicyDto {
    editMode: string;
    submitPath: string | null;
    allowArgumentsPatch: boolean;
    fields: WriteDraftFieldPolicyDto[];
}
