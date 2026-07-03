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
    draftRetryMax: number;
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
