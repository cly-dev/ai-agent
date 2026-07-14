export declare function extractJsonObjectFromLlmText(content: string): Record<string, unknown> | null;
export declare function softValidateHostToolArgsAgainstSchema(args: Record<string, unknown>, argsSchema: Record<string, unknown>): boolean;
export declare function unwrapHostToolArgsEnvelope(parsed: Record<string, unknown>, argsSchema: Record<string, unknown>): Record<string, unknown>;
export type ParseHostToolArgsFromLlmResult = {
    ok: true;
    args: Record<string, unknown>;
} | {
    ok: false;
    reason: 'parse_failed' | 'validate_failed';
    preview: string;
};
export declare function parseHostToolArgsFromLlmTextDetailed(input: {
    text: string;
    argsSchema: Record<string, unknown>;
}): ParseHostToolArgsFromLlmResult;
export declare function parseHostToolArgsFromLlmText(input: {
    text: string;
    argsSchema: Record<string, unknown>;
}): Record<string, unknown> | null;
export declare function parseHostToolArgsFromLlmTextCandidates(input: {
    candidates: Array<string | null | undefined>;
    argsSchema: Record<string, unknown>;
}): ParseHostToolArgsFromLlmResult;
export declare function buildHostToolArgsDisplayText(args: Record<string, unknown>): string;
