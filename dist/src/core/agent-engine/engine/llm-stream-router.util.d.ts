export type LlmStreamRouterState = {
    pending: string;
    inThink: boolean;
};
export declare function createLlmStreamRouterState(): LlmStreamRouterState;
export declare function routeLlmStreamChunk(state: LlmStreamRouterState, chunk: string): {
    state: LlmStreamRouterState;
    think: string;
    message: string;
};
export declare function extractRoutedMessageFromLlmText(source: string): string;
