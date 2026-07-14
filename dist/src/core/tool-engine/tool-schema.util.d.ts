import { z } from 'zod';
export type ToolDefinitionInput = {
    id: number;
    name: string;
    description: string;
    inputSchema: unknown;
    schema: unknown;
};
export declare function resolveToolZodSchema(inputSchema: unknown, fallbackSchema: unknown): z.ZodTypeAny;
export declare function resolveToolJsonSchema(inputSchema: unknown, fallbackSchema: unknown): Record<string, unknown>;
