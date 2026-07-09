import type { HttpMethod } from '../../../generated/prisma/client';
export type ToolHttpParameterPlacement = {
    header: Record<string, unknown>;
    path: Record<string, unknown>;
    query: Record<string, unknown>;
    body: Record<string, unknown>;
};
export type ToolHttpRequestLayout = {
    method: string;
    pathTemplate: string;
    resolvedPath: string;
    baseUrl: string;
    url: string;
    parameters: ToolHttpParameterPlacement;
    bodyJson?: string;
};
export declare function buildToolHttpRequestLayout(def: {
    method: HttpMethod;
    path: string;
    inputSchema?: unknown;
    schema?: unknown;
    baseUrl: string;
}, input: Record<string, unknown>): ToolHttpRequestLayout;
