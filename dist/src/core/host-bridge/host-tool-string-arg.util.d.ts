export declare const HOST_TOOL_STRING_ARG_KEYS: readonly ["text", "content", "value", "draft", "body"];
export declare function pickHostToolStringArgKey(properties: Record<string, unknown>): string | null;
export declare function readHostToolStringArg(args: Record<string, unknown>): string | null;
export declare function resolveHostToolStringArgKey(args: Record<string, unknown>): string;
