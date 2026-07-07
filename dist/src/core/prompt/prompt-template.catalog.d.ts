import { type PromptTemplateKey } from './prompt-template.keys';
export type PromptTemplateCatalogItem = {
    key: PromptTemplateKey;
    category: string;
    title: string;
    description: string;
};
export declare const PROMPT_TEMPLATE_CATALOG: readonly PromptTemplateCatalogItem[];
export declare function isAllowedPromptTemplateKey(key: string): key is PromptTemplateKey;
export declare function listCreatablePromptTemplateKeys(): PromptTemplateCatalogItem[];
export declare function getPromptTemplateCatalogItem(key: string): PromptTemplateCatalogItem | undefined;
