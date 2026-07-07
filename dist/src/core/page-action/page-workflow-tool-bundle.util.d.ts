import type { Prisma } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { buildEngineToolsFromAllowed } from '../agent-engine/engine/main/runtime/agent-tool-runtime.util';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import type { ToolBuildContext, ToolExecutionDefinition } from '../tool-engine/tool-engine.types';
declare const TOOL_WITH_INTEGRATION_INCLUDE: {
    readonly integration: true;
};
export type PageWorkflowPrismaTool = Prisma.ToolGetPayload<{
    include: typeof TOOL_WITH_INTEGRATION_INCLUDE;
}>;
export type PageWorkflowToolBundle = {
    allowedToolIds: number[];
    prismaTools: PageWorkflowPrismaTool[];
    toolById: Map<number, PageWorkflowPrismaTool>;
    engineTools: ReturnType<typeof buildEngineToolsFromAllowed>['tools'];
    toolBuildCtx: ToolBuildContext;
};
export declare function loadPageWorkflowToolBundle(input: {
    prisma: PrismaService;
    toolEngine: ToolEngineService;
    userId: number;
    appClientId: number;
    allowedToolIds: number[];
}): Promise<PageWorkflowToolBundle>;
export declare function toToolExecutionDefinition(tool: PageWorkflowPrismaTool): ToolExecutionDefinition;
export {};
