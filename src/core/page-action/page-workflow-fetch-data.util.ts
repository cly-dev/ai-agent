import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { resolvePageContextEntityId } from '../host-bridge/page-context-metadata-scan.util';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import type { FetchDataNodeInput } from '../workflow/workflow-node-input.types';

export type PageWorkflowFetchObservation = {
  name: string;
  output: unknown;
  args: Record<string, unknown>;
  toolId: number;
  toolName: string;
  agentMetadata: unknown;
};

function buildReadToolInputFromPageContext(
  pageContext: AgentChatPageContext | null,
  pathTemplate: string,
): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  const entity = pageContext?.entity;
  if (entity && typeof entity === 'object' && !Array.isArray(entity)) {
    Object.assign(input, entity as Record<string, unknown>);
  }
  const entityId = resolvePageContextEntityId(pageContext);
  if (entityId) {
    input.id = entityId;
  }
  const pathKeys =
    pathTemplate.match(/\{([^/{}]+)\}/g)?.map((match) => match.slice(1, -1)) ??
    [];
  for (const key of pathKeys) {
    if (input[key] == null && entityId) {
      input[key] = entityId;
    }
  }
  return input;
}

async function resolveFetchDataTool(
  prisma: PrismaService,
  input: {
    appClientId: number;
    toolId?: number;
    definitionKey?: string;
  },
) {
  const include = { integration: true } as const;
  if (input.toolId != null) {
    const tool = await prisma.tool.findFirst({
      where: {
        id: input.toolId,
        appClientId: input.appClientId,
        isActive: true,
      },
      include,
    });
    if (!tool) {
      throw new NotFoundException({
        code: 'FETCH_TOOL_NOT_FOUND',
        message: `Tool id=${input.toolId} not found for app`,
      });
    }
    return tool;
  }
  const definitionKey = input.definitionKey?.trim();
  if (definitionKey) {
    const tool = await prisma.tool.findFirst({
      where: {
        definitionKey,
        appClientId: input.appClientId,
        isActive: true,
      },
      include,
    });
    if (!tool) {
      throw new NotFoundException({
        code: 'FETCH_TOOL_NOT_FOUND',
        message: `Tool definitionKey="${definitionKey}" not found for app`,
      });
    }
    return tool;
  }
  throw new BadRequestException({
    code: 'FETCH_TOOL_UNRESOLVED',
    message: 'fetch_data node requires toolId or definitionKey',
  });
}

export async function executePageWorkflowFetchData(input: {
  prisma: PrismaService;
  toolEngine: ToolEngineService;
  userId: number;
  appClientId: number;
  nodeInput: FetchDataNodeInput;
  pageContext: AgentChatPageContext | null;
}): Promise<PageWorkflowFetchObservation> {
  const tool = await resolveFetchDataTool(input.prisma, {
    appClientId: input.appClientId,
    toolId: input.nodeInput.toolId,
    definitionKey: input.nodeInput.definitionKey,
  });
  const args = buildReadToolInputFromPageContext(
    input.pageContext,
    tool.path,
  );
  const result = await input.toolEngine.executeFromDefinition(
    {
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
    },
    args,
    input.userId,
  );
  return {
    name: tool.name,
    output: result.output,
    args,
    toolId: tool.id,
    toolName: tool.name,
    agentMetadata: tool.agentMetadata,
  };
}
