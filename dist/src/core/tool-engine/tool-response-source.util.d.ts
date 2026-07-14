import type { ToolExecutionResult, ToolHttpResponseSource } from './tool-engine.types';
export declare class ToolHttpResponseError extends Error {
    readonly httpResponse: ToolHttpResponseSource;
    constructor(message: string, httpResponse: ToolHttpResponseSource);
}
export declare function buildHttpResponseSource(response: Pick<Response, 'ok' | 'status' | 'statusText'>, bodyText: string, bodyParsed: unknown): ToolHttpResponseSource;
export declare function extractRawInvokeError(error: unknown): unknown;
export declare function resolveToolResponseSource(input: {
    toolResult: Pick<ToolExecutionResult, 'responseSource' | 'httpResponse'>;
}): unknown;
