import type { AgentChatPageContext } from '../host-bridge/page-context.types';
type WriteToolDef = {
    inputSchema?: unknown;
    schema?: unknown;
    agentMetadata?: unknown;
};
export declare function isUsablePlanDraftSubmitText(text: string): boolean;
export declare function extractSubmitTextFromDraftReply(draft: string): string;
export declare function extractSubmitTextFromWriteArguments(args: Record<string, unknown>, writeTool: WriteToolDef): string | null;
export declare function writeToolHasSubmitBodyPath(writeTool: WriteToolDef): boolean;
export declare function formatWriteToolArgumentsForUserPreview(args: Record<string, unknown>, writeTool: WriteToolDef, toolDescription?: string, options?: {
    excludeSubmitBody?: boolean;
}): string;
export declare function writeToolArgsContainSubmitText(args: Record<string, unknown>, writeTool: WriteToolDef): boolean;
export declare function injectDraftIntoWriteToolArguments(args: Record<string, unknown>, submitText: string, writeTool: WriteToolDef): Record<string, unknown>;
export declare function satisfiesRequiredWriteToolArgs(args: Record<string, unknown>, writeTool: WriteToolDef): boolean;
export declare function enrichWriteToolArgumentsFromReadObservations(args: Record<string, unknown>, writeTool: WriteToolDef, observations: Array<{
    name: string;
    output: unknown;
}>, input: {
    isReadToolObservation: (toolName: string) => boolean;
}): Record<string, unknown>;
export declare function enrichWriteArgumentsFromSelf(args: Record<string, unknown>, writeTool: WriteToolDef): Record<string, unknown>;
export declare function enrichWriteArgumentsFromPageContext(args: Record<string, unknown>, writeTool: WriteToolDef, pageContext: AgentChatPageContext | null | undefined, input?: {
    observations?: Array<{
        name: string;
        output: unknown;
    }>;
    isReadToolObservation?: (toolName: string) => boolean;
}): Record<string, unknown>;
export declare function normalizeWriteToolArguments(args: Record<string, unknown>, writeTool: WriteToolDef, observations: Array<{
    name: string;
    output: unknown;
}>, input: {
    isReadToolObservation: (toolName: string) => boolean;
    pageContext?: AgentChatPageContext | null;
}): Record<string, unknown>;
export declare function findMissingRequiredWriteToolArgPath(args: Record<string, unknown>, writeTool: WriteToolDef): string | null;
export {};
