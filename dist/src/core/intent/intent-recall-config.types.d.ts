export type IntentRecallMode = 'auto' | 'vector' | 'keyword';
export type ResolvedIntentRecallConfig = {
    recallMode: IntentRecallMode;
    vectorTopK: number;
    vectorMinScore: number;
    bindToolsMax: number;
    fallbackToKeyword: boolean;
    source: 'database' | 'env';
};
