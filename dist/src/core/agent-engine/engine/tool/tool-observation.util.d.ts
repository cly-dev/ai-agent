export declare function isEmptyListToolObservation(output: unknown): boolean;
export declare function observationsAreOnlyEmptyLists(observations: Array<{
    output: unknown;
}>): boolean;
export declare function hasSummarizableToolObservations(observations: Array<{
    output: unknown;
}>): boolean;
export declare function shouldPreferSummarizeOverObservedTools(llmText: string, observations: Array<{
    output: unknown;
}>): boolean;
