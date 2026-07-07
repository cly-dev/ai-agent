import type { ToolLevel } from '../../../../../../generated/prisma/client';
import {
  ToolEngineService,
  type BuiltLangChainTools,
  type ToolBuildContext,
  type ToolExecutionDefinition,
} from '../../../../tool-engine/tool-engine.service';
import type { ToolExecutionResult } from '../../../../tool-engine/tool-engine.types';
import {
  formatObservationForLlm,
  isSameObservationPayload,
} from '../../observation-format.util';
import { projectToolOutput, parseResponseProfile } from '../../../../tool-engine/tool-output-projection.util';
import type { ToolResponseProfile } from '../../../../tool-engine/tool-response-profile.types';
import {
  buildToolErrorObservation,
  isAgentToolErrorObservation,
  type AgentMachineCode,
} from '../../agent-run-user-messages.util';
import type { ToolRoundMeta } from '../../tool/tool-result-check.util';
import {
  recordMachineCodeUsage,
  recordToolUsage,
  type RunMetricsAccumulator,
} from '../../run-metrics.util';
import type {
  AgentEngineTool,
  AgentRunStep,
  GraphToolCall,
  ToolObservation,
} from '../types/agent-engine.types';
import type { AgentService } from '../../../../../modules/agent/agent.service';
import type { PrismaService } from '../../../../../prisma/prisma.service';
import { warmupIntegrationCredentials } from '../../../../tool-engine/integration-credential-resolver.util';
import {
  classifyToolExecutionStatus,
  finalizeToolErrorDispositionAfterInvoke,
  isMutationTool,
  readRetryBackoffMs,
  readToolInvokeMaxRetries,
  resolveToolErrorDisposition,
  resolveToolExecutionStatusAfterInvoke,
  resolveToolObservationOutputForStore,
  resolveToolStepMachineCode,
  type ToolErrorDisposition,
  type ToolExecutionStatus,
} from '../../tool/tool-execution-status.util';
import { buildToolHttpRequestLayout } from '../../../../tool-engine/tool-http-request-layout.util';
import {
  extractRawInvokeError,
  resolveToolResponseSource,
  ToolHttpResponseError,
} from '../../../../tool-engine/tool-response-source.util';
import {
  applyToolParameterDefaults,
  collectOpenApiParameterSpecs,
  sanitizeToolInvokeInput,
} from '../../../../tool-engine/tool-input-sanitize.util';
import {
  emitToolExecutionDebug,
  serializeAgentRunStepPayload,
} from '../../tool/tool-execution-debug.util';
import {
  maxRunStepNumber,
  nextRunStepNumber,
} from '../run/agent-run-steps.util';

export type ToolExecutionResultWithMeta = ToolExecutionResult & {
  attempts: number;
  executionStatus: ToolExecutionStatus;
  errorDisposition?: ToolErrorDisposition;
};

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

function rebuildLangChainToolsWithCredentialCache(
  built: ReturnType<typeof buildEngineToolsFromAllowed>,
  toolEngine: ToolEngineService,
  integrationCredentialCache: ReadonlyMap<string, string>,
): ReturnType<typeof buildEngineToolsFromAllowed> {
  const toolBuildCtx: ToolBuildContext = {
    ...built.toolBuildCtx,
    integrationCredentialCache,
  };
  return {
    ...built,
    toolBuildCtx,
    langChainTools: toolEngine.buildLangChainTools(built.tools, toolBuildCtx),
  };
}

export async function buildEngineToolsFromAllowedWithCredentials(
  allowedTools: Awaited<ReturnType<AgentService['getAllowedTools']>>,
  userId: number,
  toolEngine: ToolEngineService,
  prisma: PrismaService,
): Promise<ReturnType<typeof buildEngineToolsFromAllowed>> {
  const built = buildEngineToolsFromAllowed(allowedTools, userId, toolEngine);
  const integrationIds = [
    ...new Set(built.tools.map((tool) => tool.integration.id)),
  ];
  if (integrationIds.length === 0) {
    return built;
  }
  const integrationCredentialCache = await warmupIntegrationCredentials({
    prisma,
    userId,
    integrationIds,
  });
  return rebuildLangChainToolsWithCredentialCache(
    built,
    toolEngine,
    integrationCredentialCache,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolveOpenApiParameterSpecs(
  def: AgentEngineTool,
): ReturnType<typeof collectOpenApiParameterSpecs> {
  const fromInput = collectOpenApiParameterSpecs(def.inputSchema);
  if (fromInput.length > 0) {
    return fromInput;
  }
  return collectOpenApiParameterSpecs(def.schema);
}

function prepareLangChainToolInput(
  def: AgentEngineTool | undefined,
  input: Record<string, unknown>,
): Record<string, unknown> {
  if (!def) {
    return input;
  }
  const specs = resolveOpenApiParameterSpecs(def);
  if (specs.length === 0) {
    return input;
  }
  const withDefaults = applyToolParameterDefaults(input, specs, {
    agentMetadata: def.agentMetadata,
    responseProfile: def.responseProfile,
  });
  return sanitizeToolInvokeInput(withDefaults, specs);
}

async function invokeToolOnce(
  toolEngine: ToolEngineService,
  bundle: BuiltLangChainTools,
  scopedTools: AgentEngineTool[],
  toolCall: GraphToolCall,
): Promise<ToolExecutionResult> {
  const startedAt = Date.now();
  const def = scopedTools.find((tool) => tool.name === toolCall.name);
  const invokeInput = prepareLangChainToolInput(def, toolCall.arguments);
  try {
    return await toolEngine.invokeLangChainTool(
      bundle,
      toolCall.name,
      invokeInput,
    );
  } catch (error) {
    return {
      toolId: def?.id ?? 0,
      name: toolCall.name,
      input: invokeInput,
      output: buildToolErrorObservation(error, {
        isMutation: def ? isMutationTool(def.agentMetadata) : false,
      }),
      latency: Date.now() - startedAt,
      responseSource: extractRawInvokeError(error),
      httpResponse:
        error instanceof ToolHttpResponseError
          ? error.httpResponse
          : undefined,
    };
  }
}

/** 可重试错误最多重试 TOOL_INVOKE_MAX_RETRIES 次；mutation tool 不重试。 */
export async function invokeToolWithRetry(
  toolEngine: ToolEngineService,
  bundle: BuiltLangChainTools,
  scopedTools: AgentEngineTool[],
  toolCall: GraphToolCall,
): Promise<ToolExecutionResultWithMeta> {
  const def = scopedTools.find((tool) => tool.name === toolCall.name);
  const maxRetries = readToolInvokeMaxRetries();
  const maxAttempts = maxRetries + 1;
  const skipRetry = def ? isMutationTool(def.agentMetadata) : false;

  let lastResult: ToolExecutionResult | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    lastResult = await invokeToolOnce(
      toolEngine,
      bundle,
      scopedTools,
      toolCall,
    );
    const executionStatus = classifyToolExecutionStatus(lastResult.output, {
      agentMetadata: def?.agentMetadata,
    });
    if (executionStatus !== 'ERROR') {
      return {
        ...lastResult,
        attempts: attempt,
        executionStatus,
      };
    }

    const errorDisposition = resolveToolErrorDisposition(lastResult.output);
    const canRetry =
      !skipRetry &&
      errorDisposition === 'retry' &&
      attempt < maxAttempts;
    if (!canRetry) {
      return {
        ...lastResult,
        attempts: attempt,
        executionStatus: 'ERROR',
        errorDisposition: finalizeToolErrorDispositionAfterInvoke(errorDisposition),
      };
    }
    await sleep(readRetryBackoffMs(attempt));
  }

  const fallback = lastResult ?? {
    toolId: def?.id ?? 0,
    name: toolCall.name,
    input: toolCall.arguments,
    output: buildToolErrorObservation(new Error('tool invoke failed')),
    latency: 0,
  };
  return {
    ...fallback,
    attempts: maxAttempts,
    executionStatus: 'ERROR',
    errorDisposition: finalizeToolErrorDispositionAfterInvoke(
      resolveToolErrorDisposition(fallback.output),
    ),
  };
}

export type ExecuteToolCallsRoundInput = {
  latestUserMessage: string;
  toolCalls: GraphToolCall[];
  scopedTools: AgentEngineTool[];
  toolProfilesByName: Record<string, ToolResponseProfile | null>;
  langChainBundle: BuiltLangChainTools;
  toolEngine: ToolEngineService;
  observations: ToolObservation[];
  steps: AgentRunStep[];
  iteration: number;
  assessObservationQuality: (
    output: unknown,
    agentMetadata?: unknown,
  ) => 'high' | 'medium' | 'low';
  resolveToolStepCode?: (
    quality: 'high' | 'medium' | 'low',
    output: unknown,
    agentMetadata?: unknown,
  ) => AgentMachineCode | null;
  runMetrics?: RunMetricsAccumulator;
  runId?: number;
  sessionId?: string;
  onThink?: (message: string) => void;
  onToolDebugLog?: (message: string) => void;
  /** 每轮 tool 调用前检查；应抛出 AgentRunAbortedError 以协作式中止。 */
  assertContinue?: () => void;
};

export type ExecuteToolCallsRoundResult = {
  steps: AgentRunStep[];
  toolObservations: ToolObservation[];
  lastToolRoundMeta: ToolRoundMeta;
};

function resolveDefaultToolStepCode(
  quality: 'high' | 'medium' | 'low',
  output: unknown,
  agentMetadata?: unknown,
): AgentMachineCode | null {
  return resolveToolStepMachineCode({ quality, output, agentMetadata });
}

/** 执行一轮 tool_calls：HTTP 调用、observation 去重写入、steps 与 round meta。 */
export async function executeToolCallsRound(
  input: ExecuteToolCallsRoundInput,
): Promise<ExecuteToolCallsRoundResult> {
  if (input.toolCalls.length === 0) {
    return {
      steps: input.steps,
      toolObservations: input.observations,
      lastToolRoundMeta: {
        toolCalls: [],
        executionStatuses: [],
        errorDispositions: [],
        roundObservationIndices: [],
      },
    };
  }

  const toolCalls = input.toolCalls;

  input.assertContinue?.();

  for (const toolCall of toolCalls) {
    input.onThink?.(`\n正在调用工具：${toolCall.name}\n`);
  }

  const toolResults = await Promise.all(
    toolCalls.map((toolCall) =>
      invokeToolWithRetry(
        input.toolEngine,
        input.langChainBundle,
        input.scopedTools,
        toolCall,
      ),
    ),
  );

  const observations = [...input.observations];
  const steps = [...input.steps];
  const executionStatuses: ToolExecutionStatus[] = [];
  const errorDispositions: ToolErrorDisposition[] = [];
  const roundObservationIndices: number[] = [];
  const resolveToolStepCode =
    input.resolveToolStepCode ?? resolveDefaultToolStepCode;

  for (let idx = 0; idx < toolResults.length; idx += 1) {
    const toolResult = toolResults[idx];
    const toolCall = toolCalls[idx];
    const toolDef = input.scopedTools.find((tool) => tool.name === toolResult.name);
    const profile = input.toolProfilesByName[toolResult.name] ?? null;
    const statusContext = { agentMetadata: toolDef?.agentMetadata };

    const projected = projectToolOutput(
      toolResult.output,
      input.latestUserMessage,
      profile,
    );
    const executionStatus = resolveToolExecutionStatusAfterInvoke(
      toolResult.output,
      projected.data,
      statusContext,
    );
    executionStatuses.push(executionStatus);
    const rawErrorDisposition =
      executionStatus === 'ERROR'
        ? (toolResult.errorDisposition ??
          resolveToolErrorDisposition(toolResult.output))
        : 'llm';
    const errorDisposition =
      executionStatus === 'ERROR'
        ? finalizeToolErrorDispositionAfterInvoke(rawErrorDisposition)
        : 'llm';
    errorDispositions.push(errorDisposition);

    const observationOutput = resolveToolObservationOutputForStore(
      toolResult.output,
      projected.data,
    );
    const llmPayload = formatObservationForLlm({
      toolName: toolResult.name,
      output: observationOutput,
      fieldLabels: projected.fieldLabels,
      args: toolCall.arguments,
    });
    const nextObservation: ToolObservation = {
      name: toolResult.name,
      output: observationOutput,
      llmPayload,
      quality: input.assessObservationQuality(
        observationOutput,
        toolDef?.agentMetadata,
      ),
      fieldLabels: projected.fieldLabels,
      fieldDescriptions: projected.fieldDescriptions,
      enumLabelsByPath: projected.enumLabelsByPath,
    };
    const duplicateObservationIndex = observations.findIndex(
      (row) =>
        row.llmPayload != null &&
        isSameObservationPayload(row.llmPayload, llmPayload),
    );
    let observationIndex: number;
    if (duplicateObservationIndex >= 0) {
      observations[duplicateObservationIndex] = nextObservation;
      observationIndex = duplicateObservationIndex;
    } else {
      observations.push(nextObservation);
      observationIndex = observations.length - 1;
    }
    roundObservationIndices.push(observationIndex);

    const quality = input.assessObservationQuality(
      observationOutput,
      toolDef?.agentMetadata,
    );
    const toolCode = resolveToolStepCode(
      quality,
      observationOutput,
      toolDef?.agentMetadata,
    );
    const executedInput = toolResult.input;
    const rawOutput = toolResult.output;
    const responseSource = resolveToolResponseSource({ toolResult });
    const httpRequest = toolDef
      ? buildToolHttpRequestLayout(
          {
            method: toolDef.method,
            path: toolDef.path,
            inputSchema: toolDef.inputSchema,
            schema: toolDef.schema,
            baseUrl: toolDef.integration.baseUrl,
          },
          executedInput,
        )
      : undefined;
    const toolStepNumber = nextRunStepNumber(steps);
    const debugFile = emitToolExecutionDebug(
      input.onToolDebugLog ?? (() => {}),
      {
        runId: input.runId,
        sessionId: input.sessionId,
        toolName: toolResult.name,
        step: toolStepNumber,
        iteration: input.iteration,
        latencyMs: toolResult.latency,
        executionStatus,
        llmArguments: toolCall.arguments,
        executedInput,
        httpRequest,
        responseSource,
        rawOutput,
        observationOutput,
      },
    );
    if (debugFile && input.onToolDebugLog) {
      input.onToolDebugLog(
        `Tool execution debug file runId=${input.runId ?? '-'} tool=${toolResult.name} path=${debugFile}`,
      );
    }
    steps.push({
      step: toolStepNumber,
      type: 'tool',
      name: toolResult.name,
      input: executedInput,
      output: serializeAgentRunStepPayload(rawOutput),
      meta: {
        latency: toolResult.latency,
        quality,
        code: toolCode ?? undefined,
        executionStatus,
        attempt: toolResult.attempts,
        errorDisposition:
          executionStatus === 'ERROR' ? errorDisposition : undefined,
        llmArguments: toolCall.arguments,
        observationOutput: serializeAgentRunStepPayload(observationOutput),
        httpRequest,
        responseSource,
      },
    });
    if (input.runMetrics) {
      recordMachineCodeUsage(input.runMetrics, toolCode);
      recordToolUsage(input.runMetrics, {
        name: toolResult.name,
        latencyMs: toolResult.latency,
        quality,
      });
    }
    const toolFailed = isAgentToolErrorObservation(toolResult.output);
    input.onThink?.(
      toolFailed
        ? `工具 ${toolCall.name} 未能返回可用数据\n`
        : `工具 ${toolCall.name} 调用完成\n`,
    );
  }

  return {
    steps,
    toolObservations: observations,
    lastToolRoundMeta: {
      toolCalls: [...toolCalls],
      executionStatuses,
      errorDispositions,
      roundObservationIndices,
    },
  };
}

export async function executePendingWriteToolCalls(input: {
  latestUserMessage: string;
  toolCalls: Array<{ name: string; arguments: Record<string, unknown> }>;
  tools: AgentEngineTool[];
  langChainBundle: BuiltLangChainTools;
  priorSteps?: AgentRunStep[];
  priorObservations?: ToolObservation[];
  toolEngine: ToolEngineService;
  assessObservationQuality: (
    output: unknown,
    agentMetadata?: unknown,
  ) => 'high' | 'medium' | 'low';
  runId?: number;
  sessionId?: string;
  onToolDebugLog?: (message: string) => void;
  assertContinue?: () => void;
}): Promise<{
  observations: ToolObservation[];
  steps: AgentRunStep[];
  lastToolRoundMeta: ToolRoundMeta;
}> {
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
  const priorObservations = input.priorObservations ?? [];
  const priorSteps = input.priorSteps ?? [];
  const round = await executeToolCallsRound({
    latestUserMessage: input.latestUserMessage,
    toolCalls: pendingCalls,
    scopedTools: input.tools,
    toolProfilesByName,
    langChainBundle: input.langChainBundle,
    toolEngine: input.toolEngine,
    observations: priorObservations,
    steps: [...priorSteps],
    iteration: maxRunStepNumber(priorSteps),
    assessObservationQuality: input.assessObservationQuality,
    runId: input.runId,
    sessionId: input.sessionId,
    onToolDebugLog: input.onToolDebugLog,
    assertContinue: input.assertContinue,
  });
  const newObservations = round.toolObservations.slice(
    priorObservations.length,
  );
  return {
    observations: newObservations,
    steps: round.steps,
    lastToolRoundMeta: round.lastToolRoundMeta,
  };
}
