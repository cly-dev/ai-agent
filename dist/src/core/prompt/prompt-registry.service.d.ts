import { OnApplicationBootstrap } from '@nestjs/common';
import type { PromptTemplate } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { PromptTemplateKey } from './prompt-template.keys';
import { PromptTemplateStore } from './prompt-template.store';
import type { PromptResolveScope, ResolvedPrompt } from './prompt-registry.types';
export declare class PromptRegistryService implements OnApplicationBootstrap {
    private readonly prisma;
    private readonly promptStore;
    private readonly logger;
    constructor(prisma: PrismaService, promptStore: PromptTemplateStore);
    onApplicationBootstrap(): Promise<void>;
    reloadAllActiveFromDb(): Promise<void>;
    syncActiveRowToRedis(row: PromptTemplate): Promise<void>;
    render(key: PromptTemplateKey | string, scope?: PromptResolveScope, variables?: Record<string, string | number | boolean | undefined>): Promise<string>;
    resolve(key: PromptTemplateKey | string, scope?: PromptResolveScope): Promise<ResolvedPrompt>;
    private resolveFromRedis;
    private findActiveRow;
    private toResolved;
    private resolveCodeFallback;
    private scopeLabel;
}
