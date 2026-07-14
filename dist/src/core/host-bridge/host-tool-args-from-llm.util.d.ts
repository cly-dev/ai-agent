export declare function extractJsonObjectFromLlmText(content: string): Record<string, unknown> | null;
export declare function softValidateHostToolArgsAgainstSchema(args: Record<string, unknown>, argsSchema: Record<string, unknown>): boolean;
export declare function parseHostToolArgsFromLlmText(input: {
    text: string;
    argsSchema: Record<string, unknown>;
}): Record<string, unknown> | null;
export declare function buildHostToolArgsDisplayText(args: Record<string, unknown>): string;
