import type { PromptTemplateKey } from './prompt-template.keys';
export type PromptResolveScope = {
    appClientId?: number | null;
    agentId?: number | null;
    locale?: string;
};
export type ResolvedPrompt = {
    key: PromptTemplateKey | string;
    version: number;
    content: string;
    scope: 'agent' | 'app_client' | 'global';
    templateId: number;
};
