export type ToolCategoryRecallRow = {
    id: number;
    label: string;
    description: string | null;
};
export type ToolBindRecallRow = {
    id: number;
    name: string;
    description: string;
    toolCategoryId: number | null;
    agentMetadata?: unknown;
};
export type CategoryRecallMatch = {
    id: number;
    label: string;
    score: number;
    source: 'vector' | 'keyword';
};
export type CategoryRecallResult = {
    matchedCategoryIds: number[];
    matches: CategoryRecallMatch[];
    source: 'vector' | 'keyword' | 'none';
    debug?: {
        mode: 'vector' | 'keyword' | 'none';
        topK: number;
        minScore: number;
        candidateCount: number;
        scoredTop: Array<{
            id: number;
            label: string;
            score: number;
            source: 'vector' | 'keyword';
        }>;
    };
};
export type ToolBindRecallMatch = {
    id: number;
    name: string;
    description?: string;
    score: number;
    source: 'vector' | 'keyword';
};
export type ToolBindRecallResult = {
    tools: ToolBindRecallRow[];
    matches: ToolBindRecallMatch[];
    source: 'vector' | 'keyword' | 'none';
    capped: boolean;
};
