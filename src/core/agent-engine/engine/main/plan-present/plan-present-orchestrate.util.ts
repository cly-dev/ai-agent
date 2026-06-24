import type { LlmChatMessage } from '../../../../llm/llm.types';
import type { LlmService } from '../../../../llm/llm.service';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import {
  extractSubmitTextFromDraftReply,
  extractSubmitTextFromWriteArguments,
  injectDraftIntoWriteToolArguments,
  writeToolArgsContainSubmitText,
} from '../../../../tool-engine/write-tool-draft-injection.util';
import { formatFieldLabelsForPrompt } from '../../../../tool-engine/tool-output-projection.util';
import { emitLlmPromptDebug } from '../../llm-prompt-debug.util';
import { summarizeToolsForLlmSchema } from '../../tool/tool-schema-compact.util';
import {
  formatSplitToolObservationsForSummarize,
  isSplitToolObservationsOutput,
  resolvePrimaryObservationForSummarize,
} from '../../observation-format.util';
import type { AgentEngineTool, ToolObservation } from '../types/agent-engine.types';
import type { AgentRunSseEmitter } from '../run/agent-run-sse.emitter';
import {
  resolveLatestPlanComposeWrite,
  type PlanComposeWriteObservationOutput,
} from './plan-compose-write.util';
import {
  buildPlanDraftSummarizeUserContent,
  invokePlanDraftProseSupplement,
  renderPlanPresentFromComposeSystemPrompt,
} from './plan-draft-summarize-llm.util';
import {
  type PlanPresentSummarizeResult,
} from './plan-draft-summarize.util';
import {
  finalizePlanPresentUserLayer,
  publishPlanPresentUserLayer,
  type PlanPresentUserLayerPublishDeps,
} from './plan-present-user-message.util';
import type { RunAssistantArtifactStore } from '../run/run-assistant-artifact.store';
import {
  filterScopedToolsForPlanStep,
  finalizePlanAfterSummarize,
} from '../plan/task-plan.util';
import { buildPlanContextForSummarize } from '../host-tool/host-tool-fill-alignment.util';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';

export type PlanPresentOrchestrateDeps = PlanPresentUserLayerPublishDeps & {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  logger: { warn: (message: string) => void; log: (message: string) => void };
  sse: Pick<
    AgentRunSseEmitter,
    | 'emitThink'
    | 'emitMessageBlocks'
    | 'publishAssistantBlocks'
    | 'streamProseLlm'
  >;
  assistantArtifact: Pick<
    RunAssistantArtifactStore,
    'peekTurnId' | 'peekBlocks'
  >;
};

export type RunPlanPresentSummarizeInput = {
  toolName: string;
  toolDescription?: string;
  userMessage: string;
  mergedObservation: ToolObservation;
  toolObservations: ToolObservation[];
  promptMessages: LlmChatMessage[];
  sessionId: string;
  runId: number;
  scope: { appClientId: number; agentId: number };
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
};

/**
 * Plan present 完整编排：机器层准备 → 流式用户层 LLM → 单出口 publish + 返回值。
 */
export async function runPlanPresentSummarize(
  deps: PlanPresentOrchestrateDeps,
  input: RunPlanPresentSummarizeInput,
): Promise<PlanPresentSummarizeResult> {
  const {
    toolName,
    toolDescription,
    userMessage,
    mergedObservation,
    toolObservations,
    promptMessages,
    sessionId,
    runId,
    scope,
    taskPlan,
    scopedTools,
  } = input;

  const planContext = buildPlanContextForSummarize(taskPlan, toolObservations);
  const taskPlanAfterFinalize = taskPlan
    ? finalizePlanAfterSummarize(taskPlan)
    : null;
  const writeTools = taskPlanAfterFinalize
    ? filterScopedToolsForPlanStep(scopedTools, taskPlanAfterFinalize)
    : [];
  const composed = resolveLatestPlanComposeWrite(toolObservations);
  const splitOutput = isSplitToolObservationsOutput(mergedObservation.output)
    ? mergedObservation.output
    : null;
  const primaryObservation = splitOutput
    ? resolvePrimaryObservationForSummarize(splitOutput)
    : null;
  const primaryOutput = primaryObservation?.output ?? mergedObservation.output;
  const splitObservationsText = splitOutput
    ? formatSplitToolObservationsForSummarize(splitOutput)
    : null;
  const fieldLabels = mergedObservation.fieldLabels ?? {};
  const fieldDescriptions = mergedObservation.fieldDescriptions ?? {};
  const enumLabelsByPath = mergedObservation.enumLabelsByPath ?? {};
  const fieldLabelText = formatFieldLabelsForPrompt(
    fieldLabels,
    enumLabelsByPath,
    fieldDescriptions,
  );
  const agentPrompts = promptMessages.filter(
    (message) =>
      message.role === 'system' && message.content.includes('<agent_prompt>'),
  );
  const writeToolNames = writeTools.map((tool) => tool.name);
  const writeToolDescriptions = writeTools
    .map((tool) =>
      tool.description ? `${tool.name}: ${tool.description}` : tool.name,
    )
    .join('\n');
  const toolSchemaJson = JSON.stringify(
    summarizeToolsForLlmSchema(
      writeTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        schema: tool.schema,
        responseProfile: tool.responseProfile,
        agentMetadata: tool.agentMetadata,
        method: tool.method,
      })),
    ),
  );
  const turnId =
    deps.assistantArtifact.peekTurnId(sessionId, runId) ?? undefined;
  const logDraftWarn = (message: string) => {
    deps.logger.warn(`${message} runId=${runId}`);
  };

  const emptyResult = (): PlanPresentSummarizeResult => {
    const published = publishPlanPresentUserLayer(deps, {
      sessionId,
      runId,
      turnId,
      userMarkdown: '',
    });
    return {
      draftReply: published.draftReply,
      submitText: '',
      pendingWriteToolCall: null,
      machineLayer: null,
      machineLayerDirty: false,
      serialized: published.serialized,
    };
  };

  if (writeTools.length === 0) {
    logDraftWarn('plan present skipped: no write tools in plan step');
    return emptyResult();
  }
  if (!composed) {
    logDraftWarn('plan present skipped: missing plan_compose_write observation');
    return emptyResult();
  }

  const userContextBase = {
    userMessage,
    planContext: planContext || null,
    toolSchemaJson,
    writeToolNames,
    writeToolDescriptions,
    toolName,
    toolDescription,
    fieldLabelText: fieldLabelText || undefined,
    splitObservationsText,
    serializedOutput: JSON.stringify(primaryOutput),
  };

  let composedArgs = { ...composed.arguments };
  let machineLayerDirty = false;
  const writeToolDef = writeTools.find((tool) => tool.name === composed.tool);
  const argsNeedProse =
    writeToolDef != null &&
    !writeToolArgsContainSubmitText(composedArgs, writeToolDef);
  if (argsNeedProse) {
    logDraftWarn(
      'plan present: composed args lack submit text; prose supplement',
    );
    const supplemented = await invokePlanDraftProseSupplement({
      llmService: deps.llmService,
      agentPrompts,
      promptRegistry: deps.promptRegistry,
      scope,
      userContext: buildPlanDraftSummarizeUserContent({
        ...userContextBase,
        composedWritePayload: composed,
      }),
      logWarn: logDraftWarn,
    });
    if (supplemented && writeToolDef) {
      const proseSubmit =
        extractSubmitTextFromDraftReply(supplemented) || supplemented;
      composedArgs = injectDraftIntoWriteToolArguments(
        composedArgs,
        proseSubmit,
        writeToolDef,
      );
      if (writeToolArgsContainSubmitText(composedArgs, writeToolDef)) {
        machineLayerDirty = true;
      }
    }
  }

  const machineLayer: PlanComposeWriteObservationOutput = {
    tool: composed.tool,
    arguments: composedArgs,
    planStepId: composed.planStepId ?? null,
  };

  const userContext = buildPlanDraftSummarizeUserContent({
    ...userContextBase,
    composedWritePayload: machineLayer,
  });
  const presentSystemPrompt = await renderPlanPresentFromComposeSystemPrompt({
    promptRegistry: deps.promptRegistry,
    scope,
  });
  const summarizeDebugFile = emitLlmPromptDebug(
    (message) => deps.logger.log(message),
    {
      runId,
      sessionId,
      phase: 'summarize',
      messages: [
        ...agentPrompts,
        { role: 'system', content: presentSystemPrompt },
        { role: 'user', content: userContext },
      ],
      meta: { planPresentFromCompose: true },
    },
  );
  if (summarizeDebugFile) {
    deps.logger.log(
      `LLM plan present prompt file runId=${runId} path=${summarizeDebugFile}`,
    );
  }

  deps.sse.emitThink(sessionId, runId, '正在整理写操作草稿…\n', 'delta');

  const presentMessages: LlmChatMessage[] = [
    ...agentPrompts,
    { role: 'system', content: presentSystemPrompt },
    { role: 'user', content: userContext },
  ];
  const { userMarkdown } = await deps.sse.streamProseLlm(
    presentMessages,
    sessionId,
    runId,
    { turnId },
  );

  const published = finalizePlanPresentUserLayer(deps, {
    sessionId,
    runId,
    turnId,
    machineLayer,
    userMarkdown,
    taskPlanBeforeFinalize: taskPlan,
    scopedTools,
  });

  return {
    ...published,
    pendingWriteToolCall: null,
    machineLayer,
    machineLayerDirty,
  };
}
