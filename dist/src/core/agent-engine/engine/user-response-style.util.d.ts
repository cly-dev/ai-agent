export declare function isUserRequestingFullDetail(userMessage: string): boolean;
export declare function isLikelyWriteOperation(userMessage: string): boolean;
export declare function isLikelyReadOnlyQuestion(userMessage: string): boolean;
export type SummarizeScenario = 'read' | 'action';
export declare function classifySummarizeScenario(userMessage: string): SummarizeScenario;
