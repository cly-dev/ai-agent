import type { Prisma } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { buildEngineToolsFromAllowedWithCredentials } from '../agent-engine/engine/main/runtime/agent-tool-runtime.util';
import type { AgentEngineTool } from '../agent-engine/engine/main/types/agent-engine.types';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import type {
  ToolBuildContext,
  ToolExecutionDefinition,
} from '../tool-engine/tool-engine.types';

const TOOL_WITH_INTEGRATION_INCLUDE = { integration: true } as const;

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

export async function loadPageWorkflowToolBundle(input: {
  prisma: PrismaService;
  toolEngine: ToolEngineService;
  userId: number;
  appClientId: number;
  allowedToolIds: number[];
}): Promise<PageWorkflowToolBundle> {
  const allowedToolIds = [...new Set(input.allowedToolIds)];
  if (allowedToolIds.length === 0) {
    return {
      allowedToolIds: [],
      prismaTools: [],
      toolById: new Map(),
      engineTools: [],
      toolBuildCtx: {
        userId: input.userId,
        allowedToolIds: [],
        integrationCredentialCache: new Map(),
      },
    };
  }

  const prismaTools = await input.prisma.tool.findMany({
    where: {
      id: { in: allowedToolIds },
      appClientId: input.appClientId,
      isActive: true,
    },
    include: TOOL_WITH_INTEGRATION_INCLUDE,
  });

  const { tools: engineTools, toolBuildCtx } =
    await buildEngineToolsFromAllowedWithCredentials(
      prismaTools,
      input.userId,
      input.toolEngine,
      input.prisma,
    );

  return {
    allowedToolIds,
    prismaTools,
    toolById: new Map(prismaTools.map((tool) => [tool.id, tool])),
    engineTools,
    toolBuildCtx,
  };
}

export function toToolExecutionDefinition(
  tool: PageWorkflowPrismaTool,
): ToolExecutionDefinition {
  return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    schema: tool.schema,
    method: tool.method,
    path: tool.path,
    timeout: tool.timeout,
    integration: {
      id: tool.integration.id,
      name: tool.integration.name,
      baseUrl: tool.integration.baseUrl,
      authMode: tool.integration.authMode,
      apiKey: tool.integration.apiKey,
    },
    agentMetadata: tool.agentMetadata,
    responseProfile: tool.responseProfile,
  };
}
