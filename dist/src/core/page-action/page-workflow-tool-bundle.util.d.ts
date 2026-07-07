import type { Prisma } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { AgentEngineTool } from '../agent-engine/engine/main/types/agent-engine.types';
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
    engineTools: AgentEngineTool[];
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
