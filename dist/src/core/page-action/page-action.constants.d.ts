export declare const PAGE_ACTION_STREAM_REASON: "page_action_host_fill";
export declare const PAGE_ACTION_PROMPT_LIMITS: {
    readonly systemPromptMax: 8192;
    readonly instructionMax: 32768;
    readonly contextJsonMax: 65536;
};
export declare function buildPageActionStreamId(input: {
    actionRunId: number;
    actionKey: string;
}): string;
