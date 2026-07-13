import type { PromptTemplate, PrismaClient } from '../../../generated/prisma/client';
import { type PromptTemplateKey } from './prompt-template.keys';
export type EnsureGlobalPromptTemplatesResult = {
    created: PromptTemplateKey[];
    skipped: PromptTemplateKey[];
};
export type PublishGlobalPromptsFromDefaultsResult = {
    published: Array<{
        key: PromptTemplateKey;
        version: number;
        templateId: number;
    }>;
    unchanged: PromptTemplateKey[];
    missing: PromptTemplateKey[];
};
export declare const DEFAULT_RUNTIME_PROMPT_PUBLISH_KEYS: PromptTemplateKey[];
export declare function ensureGlobalPromptTemplates(prisma: PrismaClient, locale?: string): Promise<EnsureGlobalPromptTemplatesResult>;
export declare function publishGlobalPromptsFromDefaults(prisma: PrismaClient, input: {
    keys: PromptTemplateKey[];
    locale?: string;
    onlyIfOutdated?: boolean;
}): Promise<PublishGlobalPromptsFromDefaultsResult>;
export declare function toResolvedGlobalPrompt(row: Pick<PromptTemplate, 'id' | 'key' | 'version' | 'content'>): {
    key: string;
    version: number;
    content: string;
    scope: "global";
    templateId: number;
};
