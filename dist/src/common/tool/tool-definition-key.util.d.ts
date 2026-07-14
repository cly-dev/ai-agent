import { HttpMethod } from '../../../generated/prisma/client';
export declare function slugDefinitionKeySegment(value: string): string;
export declare function slugDefinitionKeyPath(urlPath: string): string;
export declare function normalizeDefinitionKey(raw: string): string;
export declare function legacyToolDefinitionKey(toolId: number): string;
export type BuildToolDefinitionKeyInput = {
    method: HttpMethod | string;
    path: string;
    categoryLabel?: string | null;
    name?: string | null;
    operationId?: string | null;
};
export declare function buildToolDefinitionKey(input: BuildToolDefinitionKeyInput): string;
export declare function resolveToolDefinitionKeyForCreate(input: {
    definitionKey?: string | null;
    method: HttpMethod;
    path: string;
    name: string;
    categoryLabel?: string | null;
}): string;
