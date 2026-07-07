export declare class UpdateIntentRecallConfigDto {
    recallMode?: 'auto' | 'vector' | 'keyword';
    vectorTopK?: number;
    vectorMinScore?: number;
    bindToolsMax?: number;
    fallbackToKeyword?: boolean;
}
