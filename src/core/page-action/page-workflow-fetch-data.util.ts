import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { AIMessage } from '@langchain/core/messages';
import type { PageWorkflowToolBundle } from './page-workflow-tool-bundle.util';
import { toToolExecutionDefinition } from './page-workflow-tool-bundle.util';
import type { PrismaService } from '../../prisma/prisma.service';
import { resolvePageContextEntityId } from '../host-bridge/page-context-metadata-scan.util';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import { extractToolCalls } from '../agent-engine/engine/main/agent-graph/runtime/decision.util';
import { resolveFetchDataToolIds } from '../workflow/resolve-workflow-node-tool-refs.util';
import type { FetchDataNodeInput } from '../workflow/workflow-node-input.types';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import {
  buildToolCallRequestAudit,
  buildToolCallResultAudit,
} from './page-action-run-audit.util';

export type PageWorkflowFetchObservation = {
  name: string;
  output: unknown;
  args: Record<string, unknown>;
  toolId: number;
  toolName: string;
  agentMetadata: unknown;
};

type ResolvedFetchTool = Awaited<ReturnType<typeof resolveFetchDataTool>>;

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
    message: 'fetch_data node requires toolIds/toolId or definitionKey',
  });
}

async function resolveFetchToolsForNode(input: {
  prisma: PrismaService;
  appClientId: number;
  nodeInput: FetchDataNodeInput;
  toolBundle?: PageWorkflowToolBundle | null;
}): Promise<ResolvedFetchTool[]> {
  const toolIds = resolveFetchDataToolIds(input.nodeInput);
  if (toolIds.length === 0) {
    return [
      await resolveFetchDataTool(input.prisma, {
        appClientId: input.appClientId,
        definitionKey: input.nodeInput.definitionKey,
      }),
    ];
  }
  const tools: ResolvedFetchTool[] = [];
  for (const toolId of toolIds) {
    const cached = input.toolBundle?.toolById.get(toolId);
    if (cached) {
      tools.push(cached);
      continue;
    }
    tools.push(
      await resolveFetchDataTool(input.prisma, {
        appClientId: input.appClientId,
        toolId,
      }),
    );
  }
  return tools;
}

/**
 * 多候选时：bindTools 白名单，由模型选一个 tool_call（与 Chat ReAct 同语义）。
 */
async function selectFetchToolViaLlm(input: {
  llmService: LlmService;
  toolEngine: ToolEngineService;
  tools: ResolvedFetchTool[];
  messages: LlmChatMessage[];
  toolBuildCtx: NonNullable<PageWorkflowToolBundle>['toolBuildCtx'];
  objective?: string;
}): Promise<ResolvedFetchTool> {
  const defs = input.tools.map((tool) => toToolExecutionDefinition(tool));
  const bundle = input.toolEngine.buildLangChainTools(defs, input.toolBuildCtx);
  const promptMessages: LlmChatMessage[] = [...input.messages];
  if (input.objective?.trim()) {
    promptMessages.push({
      role: 'user',
      content: [
        `Select and call exactly one of the bound read tools to satisfy: ${input.objective.trim()}`,
        'Do not answer in prose — emit a single tool_call.',
      ].join(' '),
    });
  }
  const { model, messages: fitted } =
    await input.llmService.createLangChainChatModelForMessages(promptMessages, {
      budgetHints: { callKind: 'decision' },
    });
  const bound = model.bindTools(bundle.tools);
  const aiMessage = (await bound.invoke(fitted)) as AIMessage;
  const calls = extractToolCalls(aiMessage);
  const allowed = new Set(input.tools.map((tool) => tool.name));
  const selected = calls.find((call) => allowed.has(call.name));
  if (!selected) {
    throw new BadRequestException({
      code: 'FETCH_TOOL_CHOICE_FAILED',
      message: 'LLM did not select a bound fetch_data tool',
    });
  }
  const tool = input.tools.find((row) => row.name === selected.name);
  if (!tool) {
    throw new BadRequestException({
      code: 'FETCH_TOOL_CHOICE_FAILED',
      message: `Selected tool ${selected.name} not in candidates`,
    });
  }
  return tool;
}

export async function executePageWorkflowFetchData(input: {
  prisma: PrismaService;
  toolEngine: ToolEngineService;
  userId: number;
  appClientId: number;
  nodeInput: FetchDataNodeInput;
  pageContext: AgentChatPageContext | null;
  stepRecorder?: PageActionRunStepRecorder;
  nodeId?: string;
  toolBundle?: PageWorkflowToolBundle | null;
  /** 多 toolIds 时必填：用于 ReAct 选 tool */
  llmService?: LlmService;
  messages?: LlmChatMessage[];
  nodeObjective?: string;
}): Promise<PageWorkflowFetchObservation> {
  const tools = await resolveFetchToolsForNode({
    prisma: input.prisma,
    appClientId: input.appClientId,
    nodeInput: input.nodeInput,
    toolBundle: input.toolBundle,
  });
  let tool = tools[0];
  if (!tool) {
    throw new BadRequestException({
      code: 'FETCH_TOOL_UNRESOLVED',
      message: 'fetch_data node has no resolvable tools',
    });
  }
  if (tools.length > 1) {
    if (!input.llmService || !input.toolBundle) {
      throw new BadRequestException({
        code: 'FETCH_TOOL_CHOICE_UNAVAILABLE',
        message: 'fetch_data with multiple toolIds requires LLM tool choice',
      });
    }
    tool = await selectFetchToolViaLlm({
      llmService: input.llmService,
      toolEngine: input.toolEngine,
      tools,
      messages: input.messages ?? [],
      toolBuildCtx: input.toolBundle.toolBuildCtx,
      objective: input.nodeObjective,
    });
  }

  const args = buildReadToolInputFromPageContext(
    input.pageContext,
    tool.path,
  );
  const toolStepId = input.nodeId ?? 'fetch_data';
  input.stepRecorder?.record({
    type: 'workflow',
    name: `${toolStepId}:tool:start`,
    detail: buildToolCallRequestAudit({
      toolName: tool.name,
      toolId: tool.id,
      arguments: args,
      httpMethod: tool.method,
      httpPath: tool.path,
    }),
  });
  const result = await input.toolEngine.executeFromDefinition(
    toToolExecutionDefinition(tool),
    args,
    input.userId,
    {
      integrationCredentialCache:
        input.toolBundle?.toolBuildCtx.integrationCredentialCache,
    },
  );
  input.stepRecorder?.record({
    type: 'workflow',
    name: `${toolStepId}:tool:complete`,
    detail: buildToolCallResultAudit(result),
    status: 'ok',
  });
  return {
    name: tool.name,
    output: result.output,
    args,
    toolId: tool.id,
    toolName: tool.name,
    agentMetadata: tool.agentMetadata,
  };
}
