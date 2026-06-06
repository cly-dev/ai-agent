import type { ToolLevel } from '../../../../../generated/prisma/client';
import {
  ToolEngineService,
  type BuiltLangChainTools,
  type ToolBuildContext,
  type ToolExecutionDefinition,
} from '../../../tool-engine/tool-engine.service';
import type { ToolExecutionResult } from '../../../tool-engine/tool-engine.types';
import { formatObservationForLlm } from '../observation-format.util';
import { projectToolOutput, parseResponseProfile } from '../../../tool-engine/tool-output-projection.util';
import type { ToolResponseProfile } from '../../../tool-engine/tool-response-profile.types';
import { buildToolErrorObservation } from '../agent-run-user-messages.util';
import type {
  AgentEngineTool,
  AgentRunStep,
  GraphToolCall,
  ToolObservation,
} from './agent-engine.types';
import type { AgentService } from '../../../../modules/agent/agent.service';

export function buildEngineToolsFromAllowed(
  allowedTools: Awaited<ReturnType<AgentService['getAllowedTools']>>,
  userId: number,
  toolEngine: ToolEngineService,
): {
  tools: AgentEngineTool[];
  toolProfilesByName: Record<string, ToolResponseProfile | null>;
  allowedToolIds: number[];
  langChainTools: BuiltLangChainTools;
  toolBuildCtx: ToolBuildContext;
} {
  const tools: AgentEngineTool[] = allowedTools.map((tool) => ({
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
    toolCategoryId: tool.toolCategoryId ?? null,
    riskLevel: tool.riskLevel,
    responseProfile: tool.responseProfile,
    agentMetadata: tool.agentMetadata,
  }));
  const toolProfilesByName = Object.fromEntries(
    tools.map((tool) => [
      tool.name,
      parseResponseProfile(tool.responseProfile),
    ]),
  ) as Record<string, ToolResponseProfile | null>;
  const allowedToolIds = tools.map((tool) => tool.id);
  const toolBuildCtx: ToolBuildContext = {
    userId,
    allowedToolIds,
  };
  const langChainTools = toolEngine.buildLangChainTools(tools, toolBuildCtx);
  return {
    tools,
    toolProfilesByName,
    allowedToolIds,
    langChainTools,
    toolBuildCtx,
  };
}

export function maxStepFromSteps(
  steps: Array<{ step?: number | string }>,
): number {
  return steps.reduce(
    (max, row) => Math.max(max, typeof row.step === 'number' ? row.step : 0),
    0,
  );
}

export async function executePendingWriteToolCalls(input: {
  latestUserMessage: string;
  toolCalls: Array<{ name: string; arguments: Record<string, unknown> }>;
  tools: AgentEngineTool[];
  langChainBundle: BuiltLangChainTools;
  afterStep: number;
  toolEngine: ToolEngineService;
  assessObservationQuality: (output: unknown) => 'high' | 'medium' | 'low';
}): Promise<{ observations: ToolObservation[]; steps: AgentRunStep[] }> {
  const toolProfilesByName = Object.fromEntries(
    input.tools.map((tool) => [
      tool.name,
      parseResponseProfile(tool.responseProfile),
    ]),
  ) as Record<string, ToolResponseProfile | null>;
  const pendingCalls: GraphToolCall[] = input.toolCalls.map((call) => ({
    name: call.name,
    arguments: call.arguments,
  }));
  const toolResults = await Promise.all(
    pendingCalls.map((toolCall) =>
      invokeToolSafely(
        input.toolEngine,
        input.langChainBundle,
        input.tools,
        toolCall,
      ),
    ),
  );

  const observations: ToolObservation[] = [];
  const steps: AgentRunStep[] = [];
  for (let idx = 0; idx < toolResults.length; idx += 1) {
    const toolResult = toolResults[idx];
    const toolCall = pendingCalls[idx];
    const profile = toolProfilesByName[toolResult.name] ?? null;
    const projected = projectToolOutput(
      toolResult.output,
      input.latestUserMessage,
      profile,
    );
    const llmPayload = formatObservationForLlm({
      toolName: toolResult.name,
      output: projected.data,
      fieldLabels: projected.fieldLabels,
    });
    observations.push({
      name: toolResult.name,
      output: projected.data,
      llmPayload,
      quality: input.assessObservationQuality(projected.data),
      fieldLabels: projected.fieldLabels,
      fieldDescriptions: projected.fieldDescriptions,
      enumLabelsByPath: projected.enumLabelsByPath,
    });
    steps.push({
      step: input.afterStep + idx + 1,
      type: 'tool',
      name: toolCall.name,
      input: toolCall.arguments,
      output: projected.data as Record<string, unknown>,
      meta: { latency: toolResult.latency },
    });
  }
  return { observations, steps };
}

async function invokeToolSafely(
  toolEngine: ToolEngineService,
  bundle: BuiltLangChainTools,
  scopedTools: AgentEngineTool[],
  toolCall: GraphToolCall,
): Promise<ToolExecutionResult> {
  const startedAt = Date.now();
  try {
    return await toolEngine.invokeLangChainTool(
      bundle,
      toolCall.name,
      toolCall.arguments,
    );
  } catch (error) {
    const def = scopedTools.find((tool) => tool.name === toolCall.name);
    return {
      toolId: def?.id ?? 0,
      name: toolCall.name,
      input: toolCall.arguments,
      output: buildToolErrorObservation(error),
      latency: Date.now() - startedAt,
    };
  }
}
