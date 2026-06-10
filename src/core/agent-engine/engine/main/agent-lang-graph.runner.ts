import { Injectable, Logger } from '@nestjs/common';
import { AIMessage } from '@langchain/core/messages';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { AgentRunStatus, type ToolLevel } from '../../../../../generated/prisma/client';
import type { Prisma } from '../../../../../generated/prisma/client';
import { normalizeToolCallArgs } from '../../../llm/tool-call-args.util';
import { LlmService } from '../../../llm/llm.service';
import type { LlmChatMessage } from '../../../llm/llm.types';
import {
  extractAgentPromptMessages,
  extractSessionHistoryForDecision,
  extractSessionMemoryForDecision,
  joinAgentPromptText,
} from '../prompt-message.util';
import {
  dedupeObservationPayloads,
  formatObservationForLlm,
  serializeObservationsBlock,
} from '../observation-format.util';
import { estimateMessagesTokens } from '../../../llm/message-token-budget.util';
import { summarizeToolsForLlmSchema } from '../tool/tool-schema-compact.util';
import {
  ToolEngineService,
} from '../../../tool-engine/tool-engine.service';
import type {
  BuiltLangChainTools,
} from '../../../tool-engine/tool-engine.service';
import {
  classifySummarizeScenario,
  isUserRequestingFullDetail,
} from '../user-response-style.util';
import { PROMPT_KEYS } from '../../../prompt/prompt-template.keys';
import { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import { formatFieldLabelsForPrompt } from '../../../tool-engine/tool-output-projection.util';
import type { ToolResponseProfile } from '../../../tool-engine/tool-response-profile.types';
import {
  buildLlmFailureUserMessage,
  extractToolErrorCode,
  extractToolErrorUserHint,
  formatResponseSourceForDisplay,
  isAgentToolErrorObservation,
  resolveLlmFailureCode,
} from '../agent-run-user-messages.util';
import type { AgentMachineCode } from '../agent-run-user-messages.util';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ChatEventsService } from '../../../../modules/chat/chat-events.service';
import { PendingWriteConfirmationStore } from '../../../../modules/chat/pending-write-confirmation.store';
import type { PendingWriteResumeContext } from '../../../../modules/chat/pending-write-confirmation.types';
import {
  buildWriteConfirmationUserMessage,
  partitionToolCallsByWriteConfirmation,
} from '../write-confirmation-gate.util';
import { SessionGoaService } from '../../../memory/goa/session-goa.service';
import { SessionResumeGateService } from '../../../memory/resume/session-resume-gate.service';
import type { SessionGoaPayload } from '../../../memory/goa/session-goa.types';
import { CategoryIntentRecallService } from '../../../intent/category-intent-recall.service';
import {
  recordLlmUsage,
  recordMachineCodeUsage,
  recordToolUsage,
} from '../run-metrics.util';
import type { MessageBlock } from '../message/message-blocks.types';
import {
  buildRuleBasedMessageBlocks,
  ensureAtLeastOneTextBlock,
  mergeSummarizeBlocksForStorage,
  mergeToolOutputsForSummary,
  messageBlocksToPlainText,
  sanitizeStoredFinalOutput,
  serializeMessageBlocksForStorage,
  textBlock,
  tryParseStoredMessageBlocks,
} from '../message/message-blocks.util';
import { isEmptyListToolObservation } from '../tool/tool-observation.util';
import {
  allToolObservations,
  mergeRunRoundObservations,
} from '../graph-tool-observations.util';
import type {
  ToolErrorDisposition,
  ToolExecutionStatus,
} from '../tool/tool-execution-status.util';
import {
  isMutationTool,
  resolveToolStepMachineCode,
} from '../tool/tool-execution-status.util';
import {
  formatWriteConfirmResumeSummarizeUserMessage,
  isWriteConfirmResumeSummaryObservation,
  type WriteConfirmResumeSummaryPayload,
} from '../write-confirm-resume-summary.util';
import { executeToolCallsRound } from './agent-tool-runtime.util';
import { formatMapReduceFetchStatusNote } from '../gather/list-map-reduce.util';
import { resolvePagedGatherAnalyzeObjective } from '../gather/plan-paged-gather.util';
import {
  expandPagedListGather,
  resumeIncompletePagedGather,
  shouldResumePagedGather,
  shouldRouteGraphToTools,
  type PagedGatherHttpBudget,
  type PagedGatherLlmContext,
} from '../gather/paged-list-gather.util';
import { resolveMaxListHttpPerTurn } from '../../../mcp-utils/pagination';
import {
  buildDuplicateSkipToolSteps,
  inferResultCheckPhase,
  resolvePostToolsResultCheck,
  resolvePreToolsResultCheck,
  resolveSummaryObservationForCheck,
} from '../tool/tool-result-check.util';
import {
  extractLlmUserFacingText,
} from '../llm-output-sanitize.util';
import { detectIntentKind as classifyIntentKind } from '../../intent-kind.util';
import { loadSmallTalkHints } from '../../../intent/smalltalk-hints.util';
import {
  buildIntentClarificationGuidance,
  buildUnsupportedIntentGuidance,
  isUserIntentClear as isUserIntentMessageClear,
} from '../../../intent/intent-scope.util';
import { IntentScopeService } from '../../../intent/intent-scope.service';
import {
  emitLlmPromptDebug,
  isLlmPromptDebugEnabled,
} from '../llm-prompt-debug.util';
import { AgentRunSseEmitter } from './agent-run-sse.emitter';
import { AgentSessionScopeService } from './agent-session-scope.service';
import { SkillService } from '../../../skill/skill.service';
import {
  buildDecisionUserFrame,
  buildPlanSummarizeObservation,
  filterScopedToolsForPlanStep,
  formatPlanContextForSummarize,
  getPendingPlanToolStep,
  isPendingPlanAnswerStep,
  resolveSummarizeUserMessageForPlan,
  finalizePlanAfterSummarize,
  isPlanToolStepSatisfiedByObservations,
  reprioritizePlanForPendingWriteStep,
  shouldDeferSummarizeForPendingWritePlan,
  resolveTaskPlanAdvance,
  resolveTaskPlanInitialAdvance,
  shouldContinuePlanAfterSummarize,
  summarizeScopedToolsForPlan,
} from './task-plan.util';
import { resolveTaskPlan } from './task-plan-llm.util';
import type { TaskPlanSnapshot } from './task-plan.types';
import { fromStoredTaskPlan } from './session-graph-resume.util';
import { serializeObservationsForPending } from '../agent-write-confirmation.util';
import type {
  AgentEngineTool,
  AgentGraphState,
  AgentLangGraphRunInput,
  AgentRunStep,
  GraphToolCall,
  ParsedIntentPayload,
  ToolObservation,
} from './agent-engine.types';

@Injectable()
export class AgentLangGraphRunner {
  private readonly logger = new Logger(AgentLangGraphRunner.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly promptRegistry: PromptRegistryService,
    private readonly toolEngine: ToolEngineService,
    private readonly sse: AgentRunSseEmitter,
    private readonly goaService: SessionGoaService,
    private readonly resumeGate: SessionResumeGateService,
    private readonly categoryIntentRecall: CategoryIntentRecallService,
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
    private readonly chatEvents: ChatEventsService,
    private readonly sessionScope: AgentSessionScopeService,
    private readonly skillService: SkillService,
  ) {}

  private async updateRun(
    runId: number,
    steps: AgentRunStep[],
    currentStep: number,
    status: AgentRunStatus,
  ): Promise<void> {
    await this.prisma.agentRun.update({
      where: { id: runId },
      data: {
        steps: steps as unknown as Prisma.InputJsonValue,
        currentStep,
        status,
      },
    });
  }

  private normalizeJsonLike(
    value: unknown,
  ): Record<string, unknown> | string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return String(value);
  }

  private tryParseJsonObject(value: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(value);
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  /** 主推理调用：Agent → Memory → Observations → Tool schema → User。 */
  private buildLlmInvokeMessages(
    promptMessages: LlmChatMessage[],
    observations: ToolObservation[],
    latestUserMessage: string,
    toolSchemaJson: string,
    toolDecisionPrompt: string,
    messageTokenBudget: number,
    taskPlan?: TaskPlanSnapshot | null,
  ): {
    messages: Array<{ role: string; content: string; toolCallId?: string }>;
    trimMeta: {
      configuredBudget: number;
      effectiveBudget: number;
      estimatedTokensBefore: number;
      estimatedTokensAfter: number;
      trimmed: boolean;
      droppedMessageIndexes: number[];
      truncatedMessageIndexes: number[];
    };
  } {
    const messages: LlmChatMessage[] = [];

    for (const item of extractAgentPromptMessages(promptMessages)) {
      messages.push({ role: item.role, content: item.content });
    }

    for (const item of extractSessionMemoryForDecision(promptMessages)) {
      messages.push({ role: item.role, content: item.content });
    }

    for (const item of extractSessionHistoryForDecision(
      promptMessages,
      latestUserMessage,
    )) {
      messages.push({ role: item.role, content: item.content });
    }

    const observationPayloads = dedupeObservationPayloads(
      observations.map(
        (observation) =>
          observation.llmPayload ??
          formatObservationForLlm({
            toolName: observation.name,
            output: observation.output,
            fieldLabels: observation.fieldLabels,
          }),
      ),
    );
    if (observationPayloads.length > 0) {
      messages.push({
        role: 'assistant',
        content: `<observations>\nEach entry has executed=true and reuseNote — already run in this turn; do not repeat the same tool+args.\n${serializeObservationsBlock(observationPayloads)}\n</observations>`,
      });
    }

    messages.push({
      role: 'tool',
      content: `<tool_schema>\n${toolSchemaJson}\n</tool_schema>`,
      toolCallId: 'decision_tool_schema',
    });
    messages.push({
      role: 'system',
      content: `<tool_decision>\n${toolDecisionPrompt}\n</tool_decision>`,
    });

    const pinnedUser = buildDecisionUserFrame({
      taskPlan,
      observationCount: observations.length,
      latestUserMessage,
    });
    if (pinnedUser) {
      messages.push(pinnedUser);
    }

    const estimatedTokens = estimateMessagesTokens(messages);

    return {
      messages: messages.map((item) => ({
        role: item.role,
        content: item.content,
        ...(item.toolCallId ? { toolCallId: item.toolCallId } : {}),
      })),
      trimMeta: {
        configuredBudget: messageTokenBudget,
        effectiveBudget: messageTokenBudget,
        estimatedTokensBefore: estimatedTokens,
        estimatedTokensAfter: estimatedTokens,
        trimmed: false,
        droppedMessageIndexes: [],
        truncatedMessageIndexes: [],
      },
    };
  }

  private toLangChainInvokeMessage(message: {
    role: string;
    content: string;
    toolCallId?: string;
  }): Record<string, string> {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        content: message.content,
        tool_call_id: message.toolCallId ?? 'decision_tool_schema',
      };
    }
    return {
      role: message.role,
      content: message.content,
    };
  }

  /** 工具决策提示 + 精简 schema（观测与用户问句由 buildLlmInvokeMessages 单独注入）。 */
  private async buildDecisionPrompt(
    promptMessages: LlmChatMessage[],
    tools: Array<{
      id: number;
      name: string;
      description: string;
      inputSchema: unknown;
      schema: unknown;
      responseProfile: unknown;
      agentMetadata: unknown;
      method: string;
    }>,
    observations: ToolObservation[],
    enableToolCall: boolean,
    scope: { appClientId: number; agentId: number },
    activeSkillPrompt?: string | null,
  ): Promise<{
    toolDecisionPrompt: string;
    toolSchemaJson: string;
    observationsJson: string;
    agentPrompt: string | null;
  }> {
    const agentPrompt = joinAgentPromptText(promptMessages);
    const toolSchema = summarizeToolsForLlmSchema(
      tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        schema: tool.schema,
        responseProfile: tool.responseProfile,
        agentMetadata: tool.agentMetadata,
        method: tool.method,
      })),
    );
    const toolCallInstruction = enableToolCall
      ? 'If a tool is needed, use native tool_calls. If not needed, answer in message content with empty tool_calls.'
      : 'Tool calling is disabled. Reply directly in message content with empty tool_calls.';
    let toolDecisionPrompt = await this.renderToolDecisionTemplate(
      scope,
      toolCallInstruction,
    );
    const skillPrompt = activeSkillPrompt?.trim();
    if (skillPrompt) {
      toolDecisionPrompt = `<active_skill>\n${skillPrompt}\n</active_skill>\n\n${toolDecisionPrompt}`;
    }
    const observationPayloads = observations.map((observation) =>
      observation.llmPayload ??
      formatObservationForLlm({
        toolName: observation.name,
        output: observation.output,
        fieldLabels: observation.fieldLabels,
      }),
    );
    return {
      toolDecisionPrompt,
      toolSchemaJson: JSON.stringify(toolSchema),
      observationsJson: serializeObservationsBlock(observationPayloads),
      agentPrompt,
    };
  }

  private async renderToolDecisionTemplate(
    scope: { appClientId: number; agentId: number },
    toolCallInstruction: string,
  ): Promise<string> {
    const variables = { toolCallInstruction };
    return this.promptRegistry.render(
      PROMPT_KEYS.AGENT_TOOL_DECISION,
      scope,
      variables,
    );
  }

  private stringifyForPrompt(value: unknown): string {
    const maxChars = 6000;
    try {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);
      if (serialized.length <= maxChars) {
        return serialized;
      }
      return `${serialized.slice(0, maxChars)}...(truncated)`;
    } catch {
      return String(value);
    }
  }

  private extractRequiredParamNames(inputSchema: unknown): string[] {
    if (!inputSchema || typeof inputSchema !== 'object' || Array.isArray(inputSchema)) {
      return [];
    }
    const row = inputSchema as Record<string, unknown>;
    const params = row.parameters;
    if (!Array.isArray(params)) {
      return [];
    }
    return params
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const param = item as Record<string, unknown>;
        const required = param.required === true;
        const name =
          typeof param.name === 'string' && param.name.trim().length > 0
            ? param.name.trim()
            : null;
        if (!required || !name) {
          return null;
        }
        return name;
      })
      .filter((name): name is string => name != null);
  }

  /** 读取 agent.config 中的 fallbackReply。 */
  private resolveFallbackReply(config: unknown): string | null {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return null;
    }
    const row = config as Record<string, unknown>;
    const fallback = row.fallbackReply;
    if (typeof fallback !== 'string') {
      return null;
    }
    return fallback.trim().length > 0 ? fallback.trim() : null;
  }

  /** LLM step 记录用：序列化当前 taskPlan 快照，便于排查拆步是否合理。 */
  private buildTaskPlanTraceForLlmStep(
    taskPlan: TaskPlanSnapshot | null | undefined,
  ): Record<string, unknown> | null {
    if (!taskPlan) {
      return null;
    }
    return {
      source: taskPlan.source,
      deliverable: taskPlan.deliverable,
      goal: taskPlan.goal,
      currentStepId: taskPlan.currentStepId,
      currentObjective: taskPlan.currentObjective,
      taskPhase: taskPlan.taskPhase,
      pendingStepIds: taskPlan.pendingStepIds,
      completedStepIds: taskPlan.completedStepIds,
      steps: taskPlan.steps.map((step) => ({
        id: step.id,
        phase: step.phase,
        kind: step.kind,
        toolRole: step.toolRole ?? null,
        objective: step.objective,
        stopWhen: step.stopWhen ?? 'observation_non_empty',
      })),
    };
  }

  private sanitizeFinalOutput(value: string): string {
    return sanitizeStoredFinalOutput(value);
  }
  async run(input: AgentLangGraphRunInput): Promise<AgentGraphState> {
    const promptScope = {
      appClientId: input.appClientId,
      agentId: input.agentId,
    };
    let sessionGoa: SessionGoaPayload | null = input.resumeFromWriteConfirm
      ? null
      : await this.goaService.ensurePayload(input.sessionId);
    const sessionPriorObservations = input.resumeFromWriteConfirm
      ? []
      : this.goaService.buildPriorToolObservationsForGraph(sessionGoa);
    const buildDirectUserObservation = (
      userMessage: string,
      guidanceHint?: string,
    ): ToolObservation => ({
      name: 'direct_user',
      output: guidanceHint
        ? { userMessage, guidanceHint }
        : { userMessage },
    });

    const buildNoIntentSummarizeState = (
      state: AgentGraphState,
      steps: AgentRunStep[],
      guidanceHint?: string,
    ): AgentGraphState => ({
      ...state,
      steps,
      pendingSummaryObservation: buildDirectUserObservation(
        input.latestUserMessage,
        guidanceHint,
      ),
      scopedTools: [],
      scopedLangChainTools: [],
      scopedToolBundle: null,
      scopedAllowedToolIds: [],
    });

    /** 类目意图召回命中（任一 intent 步 matchedCategoryIds 非空）才进入 LLM 决策环。 */
    const isIntentMatched = (state: AgentGraphState): boolean => {
      if (state.skillApplied) {
        return true;
      }
      if (allToolObservations(state).length > 0) {
        return true;
      }
      for (let i = state.steps.length - 1; i >= 0; i -= 1) {
        const step = state.steps[i];
        if (step.type !== 'intent') {
          continue;
        }
        const output = step.output;
        if (output == null || typeof output !== 'object' || Array.isArray(output)) {
          continue;
        }
        const row = output as Record<string, unknown>;
        if (row.intentClear === false) {
          continue;
        }
        const matched = row.matchedCategoryIds;
        if (Array.isArray(matched) && matched.length > 0) {
          return true;
        }
      }
      return false;
    };

    // LangGraph 状态定义：每个字段的 reducer 采用“直接覆盖最新值”。
    const State = Annotation.Root({
      iteration: Annotation<number>({
        default: () => 0,
        reducer: (_state, update) => update,
      }),
      steps: Annotation<AgentRunStep[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      toolObservations: Annotation<Array<{ name: string; output: unknown }>>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      preloadedToolObservations: Annotation<
        Array<{ name: string; output: unknown }> | undefined
      >({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      pendingToolCalls: Annotation<GraphToolCall[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      pendingSummaryObservation: Annotation<{
        name: string;
        output: unknown;
      } | null>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      intentKind: Annotation<'task' | 'smalltalk' | 'unclear'>({
        default: () => 'task',
        reducer: (_state, update) => update,
      }),
      finalOutput: Annotation<string>({
        default: () => '',
        reducer: (_state, update) => update,
      }),
      status: Annotation<AgentRunStatus>({
        default: () => AgentRunStatus.running,
        reducer: (_state, update) => update,
      }),
      finished: Annotation<boolean>({
        default: () => false,
        reducer: (_state, update) => update,
      }),
      scopedTools: Annotation<AgentEngineTool[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      scopedLangChainTools: Annotation<DynamicStructuredTool[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      scopedAllowedToolIds: Annotation<number[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      scopedToolBundle: Annotation<BuiltLangChainTools | null>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      toolProfilesByName: Annotation<Record<string, ToolResponseProfile | null>>({
        default: () => ({}),
        reducer: (_state, update) => update,
      }),
      hasExpandedOnce: Annotation<boolean>({
        default: () => false,
        reducer: (_state, update) => update,
      }),
      awaitingWriteConfirmation: Annotation<boolean | undefined>({
        default: () => undefined,
        reducer: (_state, update) => update,
      }),
      skillApplied: Annotation<boolean | undefined>({
        default: () => false,
        reducer: (_state, update) => update,
      }),
      activeSkillId: Annotation<number | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      activeSkillPrompt: Annotation<string | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      activeSkillName: Annotation<string | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      activeSkillDescription: Annotation<string | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      activeSkillConfig: Annotation<unknown>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      activeSkillRiskLevel: Annotation<ToolLevel | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      taskPlan: Annotation<TaskPlanSnapshot | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      lastToolRoundMeta: Annotation<{
        toolCalls: GraphToolCall[];
        executionStatuses: ToolExecutionStatus[];
        errorDispositions: ToolErrorDisposition[];
        roundObservationIndices: number[];
      } | null>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      pagedListHttpUsed: Annotation<number | undefined>({
        default: () => undefined,
        reducer: (_state, update) => update,
      }),
    });

    // 节点：Skill 召回 + gate（命中则跳过 intent，直连 llm）。
    const skill = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const idx = state.steps.length + 1;
      if (!input.enableToolCall || input.tools.length === 0) {
        const step: AgentRunStep = {
          step: idx,
          type: 'skill',
          output: this.normalizeJsonLike({
            skipped: true,
            reason: 'tools_disabled',
          }),
        };
        await this.updateRun(
          input.runId,
          [...state.steps, step],
          state.iteration,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps: [...state.steps, step],
          skillApplied: false,
          activeSkillId: null,
          activeSkillPrompt: null,
          activeSkillName: null,
          activeSkillDescription: null,
          activeSkillConfig: null,
        };
      }

      this.sse.emitThink(
        input.sessionId,
        input.runId,
        '正在匹配技能场景…\n',
        'replace',
      );

      const resolved = await this.skillService.resolveForRun({
        agentId: input.agentId,
        userId: input.userId,
        appClientId: input.appClientId,
        userMessage: input.latestUserMessage,
        allowedTools: input.tools,
        toolBuildCtx: input.toolBuildCtx,
      });

      if (resolved.hit === false) {
        const skillStep: AgentRunStep = {
          step: idx,
          type: 'skill',
          output: this.normalizeJsonLike({
            hit: false,
            reason: resolved.reason,
            candidateCount: resolved.candidateCount ?? null,
            recallStage: resolved.recallStage ?? null,
            recallSource: resolved.recallSource ?? null,
            recallMatches: resolved.recallMatches ?? null,
            recallStageAttempts: resolved.recallStageAttempts ?? null,
          }),
        };
        await this.updateRun(
          input.runId,
          [...state.steps, skillStep],
          state.iteration,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps: [...state.steps, skillStep],
          skillApplied: false,
          activeSkillId: null,
          activeSkillPrompt: null,
          activeSkillName: null,
          activeSkillDescription: null,
          activeSkillConfig: null,
        };
      }

      const skillStep: AgentRunStep = {
        step: idx,
        type: 'skill',
        output: this.normalizeJsonLike({
          hit: true,
          skillId: resolved.skill.id,
          skillName: resolved.skill.name,
          recallSource: resolved.recallSource,
          recallStage: resolved.recallStage,
          recallScore: resolved.recallScore,
          recallMatches: resolved.recallMatches,
          recallStageAttempts: resolved.recallStageAttempts,
          roleSkillFiltered: resolved.roleSkillFiltered,
          allowedToolCount: resolved.allowedToolCount,
          gatedToolCount: resolved.gatedToolCount,
        }),
      };
      await this.updateRun(
        input.runId,
        [...state.steps, skillStep],
        state.iteration,
        AgentRunStatus.running,
      );
      this.sse.emitThink(
        input.sessionId,
        input.runId,
        `已启用技能：${resolved.skill.name}\n`,
        'delta',
      );
      return {
        ...state,
        steps: [...state.steps, skillStep],
        skillApplied: true,
        activeSkillId: resolved.skill.id,
        activeSkillPrompt: resolved.skill.prompt,
        activeSkillName: resolved.skill.name,
        activeSkillDescription: resolved.skill.description,
        activeSkillConfig: resolved.skill.config,
        activeSkillRiskLevel: resolved.skill.riskLevel,
        intentKind: 'task',
        scopedTools: resolved.scopedTools,
        scopedLangChainTools: resolved.scopedToolBundle.tools,
        scopedToolBundle: resolved.scopedToolBundle,
        scopedAllowedToolIds: resolved.scopedAllowedToolIds,
      };
    };

    // 节点：Plan — 拆 deliverable + steps，写入 currentObjective（每 turn 一次）。
    const plan = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const idx = state.steps.length + 1;
      if (state.taskPlan) {
        return state;
      }
      if (sessionGoa) {
        const resumeDecision = await this.resumeGate.evaluate({
          sessionId: input.sessionId,
          appClientId: input.appClientId,
          agentId: input.agentId,
          latestUserMessage: input.latestUserMessage,
          goa: sessionGoa,
        });
        if (resumeDecision.action === 'abandon_and_fresh') {
          sessionGoa = await this.goaService.getPayload(input.sessionId);
        }
        if (resumeDecision.action === 'resume') {
          const taskPlan = fromStoredTaskPlan(resumeDecision.plan);
          const planStep: AgentRunStep = {
            step: idx,
            type: 'plan',
            output: this.normalizeJsonLike({
              method: 'session_resume',
              source: taskPlan.source,
              deliverable: taskPlan.deliverable,
              goal: taskPlan.goal,
              stepIds: taskPlan.steps.map((step) => step.id),
              pendingStepIds: taskPlan.pendingStepIds,
              currentStepId: taskPlan.currentStepId,
              currentObjective: taskPlan.currentObjective,
              taskPhase: taskPlan.taskPhase,
              resumedFromRunId: resumeDecision.resumedFromRunId,
              followUpReason: resumeDecision.followUpReason,
            }),
          };
        const initialAdvance = resolveTaskPlanInitialAdvance({
          plan: taskPlan,
          observations: allToolObservations(state),
          userMessage: input.latestUserMessage,
          buildMergedObservation: (observations) =>
            this.mergeObservationsForSummary(observations),
        });
        const stepsWithPlan = [...state.steps, planStep];
        await this.updateRun(
          input.runId,
          stepsWithPlan,
          state.iteration,
          AgentRunStatus.running,
        );
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          '续接上次未完成任务步骤…\n',
          'replace',
        );
        if (initialAdvance) {
          return {
            ...state,
            steps: stepsWithPlan,
            taskPlan: initialAdvance.updatedPlan,
            pendingSummaryObservation:
              initialAdvance.summaryObservation as ToolObservation,
          };
        }
        return {
          ...state,
          steps: stepsWithPlan,
          taskPlan,
        };
        }
      }
      if (!input.enableToolCall || state.scopedTools.length === 0) {
        const step: AgentRunStep = {
          step: idx,
          type: 'plan',
          output: this.normalizeJsonLike({
            skipped: true,
            reason: 'tools_disabled',
          }),
        };
        await this.updateRun(
          input.runId,
          [...state.steps, step],
          state.iteration,
          AgentRunStatus.running,
        );
        return { ...state, steps: [...state.steps, step] };
      }

      const goaForAbandon =
        sessionGoa ?? (await this.goaService.getPayload(input.sessionId));
      if (
        goaForAbandon.activeTask?.status === 'in_progress' ||
        goaForAbandon.activeTask?.status === 'awaiting_confirmation'
      ) {
        await this.goaService.abandonActiveTask(input.sessionId);
        sessionGoa = await this.goaService.getPayload(input.sessionId);
      }

      this.sse.emitThink(
        input.sessionId,
        input.runId,
        '正在规划任务步骤…\n',
        'replace',
      );

      const planInput = {
        userMessage: input.latestUserMessage,
        scopedToolSummaries: summarizeScopedToolsForPlan(state.scopedTools),
        skillApplied: state.skillApplied === true,
        skillName: state.activeSkillName,
        skillDescription: state.activeSkillDescription,
        skillConfig: state.activeSkillConfig,
        skillRiskLevel: state.activeSkillRiskLevel ?? null,
        skillPrompt: state.activeSkillPrompt,
      };

      const resolvedPlan = await resolveTaskPlan({
        llmService: this.llmService,
        promptRegistry: this.promptRegistry,
        scope: promptScope,
        planInput,
      });

      const taskPlan = resolvedPlan.plan;

      const planStep: AgentRunStep = {
        step: idx,
        type: 'plan',
        output: this.normalizeJsonLike({
          method: resolvedPlan.method,
          llmFallbackReason: resolvedPlan.llmFallbackReason ?? null,
          source: taskPlan.source,
          deliverable: taskPlan.deliverable,
          goal: taskPlan.goal,
          stepIds: taskPlan.steps.map((step) => step.id),
          pendingStepIds: taskPlan.pendingStepIds,
          currentStepId: taskPlan.currentStepId,
          currentObjective: taskPlan.currentObjective,
          taskPhase: taskPlan.taskPhase,
        }),
      };

      const initialAdvance = resolveTaskPlanInitialAdvance({
        plan: taskPlan,
        observations: allToolObservations(state),
        userMessage: input.latestUserMessage,
        buildMergedObservation: (observations) =>
          this.mergeObservationsForSummary(observations),
      });
      const stepsWithPlan = [...state.steps, planStep];
      await this.updateRun(
        input.runId,
        stepsWithPlan,
        state.iteration,
        AgentRunStatus.running,
      );
      if (initialAdvance) {
        return {
          ...state,
          steps: stepsWithPlan,
          taskPlan: initialAdvance.updatedPlan,
          pendingSummaryObservation:
            initialAdvance.summaryObservation as ToolObservation,
        };
      }
      return {
        ...state,
        steps: stepsWithPlan,
        taskPlan,
      };
    };

    // 节点1：意图识别 + 工具收窄（按 toolCategory），必要时直接结束并返回引导语。
    const intent = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const idx = state.steps.length + 1;

      const skipRecognition = !input.enableToolCall || input.tools.length === 0;
      const intentKind = classifyIntentKind(
        input.latestUserMessage,
        loadSmallTalkHints(),
      );

      if (intentKind === 'smalltalk') {
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          '正在回复…\n',
          'replace',
        );
        const intentStep: AgentRunStep = {
          step: idx,
          type: 'intent',
          output: this.normalizeJsonLike({
            intentClear: true,
            intentKind: 'smalltalk',
            matchedCategoryIds: [],
            intentMatched: false,
            smalltalk: true,
            skipped: skipRecognition || undefined,
          }),
        };
        await this.updateRun(
          input.runId,
          [...state.steps, intentStep],
          0,
          AgentRunStatus.running,
        );
        return {
          ...buildNoIntentSummarizeState(state, [...state.steps, intentStep]),
          intentKind: 'smalltalk',
        };
      }

      if (skipRecognition) {
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          '正在处理你的请求…\n',
          'replace',
        );
        const intentStep: AgentRunStep = {
          step: idx,
          type: 'intent',
          output: this.normalizeJsonLike({
            skipped: true,
            intentKind,
            matchedCategoryIds: [],
          }),
        };
        await this.updateRun(
          input.runId,
          [...state.steps, intentStep],
          0,
          AgentRunStatus.running,
        );
        return {
          ...buildNoIntentSummarizeState(state, [...state.steps, intentStep]),
          intentKind,
        };
      }

      this.sse.emitThink(
        input.sessionId,
        input.runId,
        '正在理解你的问题…\n',
        'replace',
      );

      const categoryIds = [
        ...new Set(
          input.tools
            .map((t) => t.toolCategoryId)
            .filter((id): id is number => id != null),
        ),
      ];
      const categories = await this.sessionScope.fetchToolCategoriesForAllowedTools(
        categoryIds,
      );

      const intentClear = isUserIntentMessageClear(input.latestUserMessage);
      if (!intentClear) {
        const guidance = buildIntentClarificationGuidance(
          input.latestUserMessage,
        );
        const intentStep: AgentRunStep = {
          step: idx,
          type: 'intent',
          output: this.normalizeJsonLike({
            intentClear: false,
            recallSource: 'none',
            matchedCategoryIds: [],
          }),
        };
        await this.updateRun(
          input.runId,
          [...state.steps, intentStep],
          0,
          AgentRunStatus.running,
        );
        return buildNoIntentSummarizeState(
          state,
          [...state.steps, intentStep],
          guidance,
        );
      }

      let recallResult;
      try {
        recallResult = await this.categoryIntentRecall.recallTopCategories(
          categories,
          input.latestUserMessage,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`category intent recall failed: ${message}`);
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          '正在使用备用方式理解你的问题…\n',
          'delta',
        );
        const fallbackStep: AgentRunStep = {
          step: idx,
          type: 'intent',
          output: this.normalizeJsonLike({
            error: message,
            fallback: true,
            fallbackReason: 'category_recall_error',
          }),
          meta: { code: 'INTENT_RECALL_FAILED' },
        };
        recordMachineCodeUsage(input.runMetrics, 'INTENT_RECALL_FAILED');
        fallbackStep.output = this.normalizeJsonLike({
          error: message,
          fallback: true,
          fallbackReason: 'category_recall_error',
          matchedCategoryIds: [],
        });
        await this.updateRun(
          input.runId,
          [...state.steps, fallbackStep],
          0,
          AgentRunStatus.running,
        );
        return buildNoIntentSummarizeState(
          state,
          [...state.steps, fallbackStep],
          buildUnsupportedIntentGuidance(),
        );
      }

      const validCategoryIdSet = new Set(categories.map((c) => c.id));
      const matchedCategoryIds = recallResult.matchedCategoryIds.filter((id) =>
        validCategoryIdSet.has(id),
      );

      const intentOutputBase: Record<string, unknown> = {
        intentClear: true,
        matchedCategoryIds,
        includeUncategorized: false,
        toolsBeforeIntentNarrow: input.tools.length,
        recallSource: recallResult.source,
        recallMatches: recallResult.matches.map((item) => ({
          id: item.id,
          label: item.label,
          score: Number(item.score.toFixed(4)),
          source: item.source,
        })),
      };

      if (matchedCategoryIds.length === 0) {
        const intentStep: AgentRunStep = {
          step: idx,
          type: 'intent',
          output: this.normalizeJsonLike({
            ...intentOutputBase,
            intentMatched: false,
            unsupported: true,
          }),
        };
        await this.updateRun(
          input.runId,
          [...state.steps, intentStep],
          0,
          AgentRunStatus.running,
        );
        return buildNoIntentSummarizeState(
          state,
          [...state.steps, intentStep],
          buildUnsupportedIntentGuidance(),
        );
      }

      const parsed: ParsedIntentPayload = {
        intentClear: true,
        guidance: '',
        matchedCategoryIds,
        includeUncategorized: false,
      };

      const narrowed = this.sessionScope.filterToolsByIntent(input.tools, parsed);
      if (narrowed.length === 0) {
        const intentStep: AgentRunStep = {
          step: idx,
          type: 'intent',
          output: this.normalizeJsonLike({
            ...intentOutputBase,
            toolsAfterIntentNarrow: 0,
            intentMatched: false,
            unsupported: true,
          }),
        };
        await this.updateRun(
          input.runId,
          [...state.steps, intentStep],
          0,
          AgentRunStatus.running,
        );
        return buildNoIntentSummarizeState(
          state,
          [...state.steps, intentStep],
          buildUnsupportedIntentGuidance(),
        );
      }

      const scoped = await this.sessionScope.resolveScopedToolsForIntent({
        sessionId: input.sessionId,
        userMessage: input.latestUserMessage,
        tools: narrowed,
        toolBuildCtx: input.toolBuildCtx,
        matchedCategoryIds,
      });

      const intentOutput: Record<string, unknown> = {
        ...intentOutputBase,
        intentMatched: true,
        toolsAfterIntentNarrow: narrowed.length,
        toolsAfterBindCap: scoped.scopedTools.length,
        scopeFromCache: scoped.fromCache,
      };
      if (scoped.fallbackReason) {
        intentOutput.fallback = true;
        intentOutput.fallbackReason = scoped.fallbackReason;
      }
      if (scoped.bindCap) {
        intentOutput.bindToolsCap = scoped.bindCap;
      }
      const intentStep: AgentRunStep = {
        step: idx,
        type: 'intent',
        output: this.normalizeJsonLike(intentOutput),
      };

      await this.updateRun(
        input.runId,
        [...state.steps, intentStep],
        0,
        AgentRunStatus.running,
      );
      return {
        ...state,
        steps: [...state.steps, intentStep],
        intentKind,
        scopedTools: scoped.scopedTools,
        scopedLangChainTools: scoped.scopedLangChainTools,
        scopedToolBundle: scoped.scopedToolBundle,
        scopedAllowedToolIds: scoped.scopedAllowedToolIds,
      };
    };

    // 节点2：主推理节点。基于当前 observation 决定“直接回答”或“发起 tool_calls”。
    const llm = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const graphState = state;
      if (graphState.pendingSummaryObservation) {
        return graphState;
      }
      if (
        !graphState.skillApplied &&
        graphState.toolObservations.length === 0 &&
        graphState.pendingToolCalls.length === 0 &&
        !isIntentMatched(graphState)
      ) {
        return buildNoIntentSummarizeState(graphState, graphState.steps);
      }
      const graphStateForLlm = graphState;
      const observationsForLlm = allToolObservations(graphStateForLlm);
      const writeStepReprioritized = reprioritizePlanForPendingWriteStep(
        graphStateForLlm.taskPlan,
      );
      if (writeStepReprioritized) {
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          '任务计划尚有写操作步骤，继续执行…\n',
          'delta',
        );
        return {
          ...graphStateForLlm,
          taskPlan: writeStepReprioritized,
        };
      }
      if (isPendingPlanAnswerStep(graphStateForLlm.taskPlan)) {
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          '正在按任务计划生成结果…\n',
          'delta',
        );
        return {
          ...graphStateForLlm,
          pendingSummaryObservation: buildPlanSummarizeObservation({
            userMessage: input.latestUserMessage,
            merged: this.mergeObservationsForSummary(observationsForLlm),
          }),
        };
      }
      const step = graphStateForLlm.iteration + 1;
      try {
        const planAnswerStep = isPendingPlanAnswerStep(graphStateForLlm.taskPlan);
        const decisionEnableToolCall =
          input.enableToolCall && !planAnswerStep;
        const toolsForPrompt = filterScopedToolsForPlanStep(
          graphStateForLlm.scopedTools,
          graphStateForLlm.taskPlan,
        );
        const allowedDecisionToolNames = new Set(
          toolsForPrompt.map((tool) => tool.name),
        );
        let langChainToolsForDecision = planAnswerStep
          ? []
          : graphStateForLlm.scopedLangChainTools.filter((tool) =>
              allowedDecisionToolNames.has(tool.name),
            );
        if (!planAnswerStep && langChainToolsForDecision.length === 0) {
          langChainToolsForDecision = graphStateForLlm.scopedLangChainTools;
        }
        const decision = await this.buildDecisionPrompt(
          input.promptMessages,
          toolsForPrompt,
          observationsForLlm,
          decisionEnableToolCall,
          promptScope,
          graphStateForLlm.activeSkillPrompt,
        );
        const { messages: invokeMessages, trimMeta } = this.buildLlmInvokeMessages(
          input.promptMessages,
          observationsForLlm,
          input.latestUserMessage,
          decision.toolSchemaJson,
          decision.toolDecisionPrompt,
          input.messageTokenBudget,
          graphStateForLlm.taskPlan,
        );
        const promptDebugFile = emitLlmPromptDebug(
          (message) => this.logger.log(message),
          {
            runId: input.runId,
            sessionId: input.sessionId,
            phase: 'decision',
            step,
            iteration: graphStateForLlm.iteration,
            messageTokenBudget: input.messageTokenBudget,
            meta: {
              enableToolCall: decisionEnableToolCall,
              scopedToolCount: graphStateForLlm.scopedTools.length,
              decisionToolCount: toolsForPrompt.length,
              planAnswerStep: planAnswerStep,
              planToolRoleFilter:
                getPendingPlanToolStep(graphStateForLlm.taskPlan)?.toolRole ??
                null,
              observationCount: observationsForLlm.length,
              estimatedTokens: trimMeta.estimatedTokensAfter,
              taskPlanStep: graphStateForLlm.taskPlan?.currentStepId ?? null,
              taskPlanPhase: graphStateForLlm.taskPlan?.taskPhase ?? null,
              currentObjective:
                graphStateForLlm.taskPlan?.currentObjective ?? null,
            },
            messages: invokeMessages,
          },
        );
        if (promptDebugFile) {
          this.logger.log(
            `LLM decision prompt file runId=${input.runId} step=${step} path=${promptDebugFile}`,
          );
        } else if (isLlmPromptDebugEnabled()) {
          this.logger.warn(
            `LLM decision prompt debug file write failed runId=${input.runId} step=${step}`,
          );
        }
        const llmStartedAt = Date.now();
        const langChainInvokeMessages = invokeMessages.map((message) =>
          this.toLangChainInvokeMessage(message),
        );
        const { model } =
          await this.llmService.createLangChainChatModelForMessages(
            invokeMessages.map((message) => ({
              role: message.role as LlmChatMessage['role'],
              content: message.content,
              toolCallId: message.toolCallId,
            })),
          );
        const runnable = decisionEnableToolCall
          ? model.bindTools(langChainToolsForDecision as unknown[])
          : model.bindTools([]);
        const aiMessage = await this.sse.streamRunnableMessages(
          runnable as {
            stream: (messages: unknown[]) => Promise<AsyncIterable<unknown>>;
            invoke: (messages: unknown[]) => Promise<AIMessage>;
          },
          langChainInvokeMessages,
          input.sessionId,
          input.runId,
        );
        const responseMeta = aiMessage.response_metadata as
          | Record<string, unknown>
          | undefined;
        const toolCalls = decisionEnableToolCall
          ? this.extractToolCalls(aiMessage)
          : [];
        const llmText = extractLlmUserFacingText(
          this.extractAiMessageText(aiMessage),
        );
        recordLlmUsage(input.runMetrics, {
          messages: invokeMessages.map((message) => ({
            role: message.role as LlmChatMessage['role'],
            content: message.content,
          })),
          outputText: llmText,
          durationMs: Date.now() - llmStartedAt,
          model:
            typeof responseMeta?.model_name === 'string'
              ? responseMeta.model_name
              : undefined,
          responseMeta,
        });
        const steps = [
          ...graphStateForLlm.steps,
          {
            step,
            type: 'llm' as const,
            output: this.normalizeJsonLike({
              content: llmText,
              toolCalls,
              taskPlanTrace: this.buildTaskPlanTraceForLlmStep(
                graphStateForLlm.taskPlan,
              ),
            }),
            meta: {
              model:
                typeof responseMeta?.model_name === 'string'
                  ? responseMeta.model_name
                  : undefined,
              prompt: decision.toolDecisionPrompt,
              toolSchema: decision.toolSchemaJson,
              observations: decision.observationsJson,
              agentPrompt: decision.agentPrompt ?? undefined,
              userRequest: graphStateForLlm.taskPlan?.currentObjective
                ?? input.latestUserMessage,
            },
          },
        ];
        await this.updateRun(input.runId, steps, step, AgentRunStatus.running);
        if (toolCalls.length === 0) {
          const pendingToolStep = getPendingPlanToolStep(
            graphStateForLlm.taskPlan,
          );
          const planRequiresToolCall =
            pendingToolStep?.kind === 'tool' &&
            !isPlanToolStepSatisfiedByObservations({
              step: pendingToolStep,
              observations: observationsForLlm,
              scopedTools: graphStateForLlm.scopedTools,
              taskPlan: graphStateForLlm.taskPlan,
              skillConfig: graphStateForLlm.activeSkillConfig,
            });
          if (planRequiresToolCall) {
            if (!llmText) {
              this.logger.warn(
                `llm plan tool step skipped without toolCalls runId=${input.runId} step=${step} planStep=${pendingToolStep.id}`,
              );
            }
            return {
              ...graphStateForLlm,
              iteration: step,
              steps,
              pendingToolCalls: [],
              pendingSummaryObservation: null,
            };
          }
          if (
            graphStateForLlm.taskPlan &&
            pendingToolStep?.kind === 'tool' &&
            isPlanToolStepSatisfiedByObservations({
              step: pendingToolStep,
              observations: observationsForLlm,
              scopedTools: graphStateForLlm.scopedTools,
              taskPlan: graphStateForLlm.taskPlan,
              skillConfig: graphStateForLlm.activeSkillConfig,
            })
          ) {
            return {
              ...graphStateForLlm,
              iteration: step,
              steps,
              pendingToolCalls: [],
              pendingSummaryObservation: null,
            };
          }
          const emptyReply =
            '我这次没有拿到有效结果，请你换个问法，或补充更具体的条件后我再试一次。';
          if (!llmText) {
            this.logger.warn(
              `llm returned empty content and no toolCalls runId=${input.runId} step=${step} model=${
                typeof responseMeta?.model_name === 'string'
                  ? responseMeta.model_name
                  : 'unknown'
              }`,
            );
          }
          if (
            shouldDeferSummarizeForPendingWritePlan(graphStateForLlm.taskPlan)
          ) {
            return {
              ...graphStateForLlm,
              iteration: step,
              steps,
              pendingToolCalls: [],
              pendingSummaryObservation: null,
            };
          }
          const completion = this.resolveLlmCompletionAfterTools(
            input.latestUserMessage,
            llmText || emptyReply,
            observationsForLlm,
          );
          return {
            ...graphStateForLlm,
            iteration: step,
            steps,
            pendingToolCalls: [],
            pendingSummaryObservation:
              completion?.observation ??
              this.buildDirectReplyObservation(
                input.latestUserMessage,
                emptyReply,
              ),
          };
        }
        return {
          ...graphStateForLlm,
          iteration: step,
          steps,
          // 交给 tools 节点执行（本轮可能包含多个调用）。
          pendingToolCalls: toolCalls,
        };
      } catch (error) {
        const userMessage = buildLlmFailureUserMessage(error);
        const code = resolveLlmFailureCode(error);
        this.logger.warn(
          `llm node failed runId=${input.runId} step=${step}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        const steps = [
          ...graphState.steps,
          {
            step,
            type: 'llm' as const,
            output: this.normalizeJsonLike({
              error: true,
              content: userMessage,
            }),
            meta: { code },
          },
        ];
        await this.updateRun(
          input.runId,
          steps,
          step,
          AgentRunStatus.success,
        );
        recordMachineCodeUsage(input.runMetrics, code);
        return {
          ...graphState,
          iteration: step,
          steps,
          pendingToolCalls: [],
          pendingSummaryObservation: this.buildDirectReplyObservation(
            input.latestUserMessage,
            userMessage,
          ),
        };
      }
    };
    // 节点3：工具执行。仅负责 HTTP 调用与 observation 写入；路由由 resultCheck 统一处理。
    const tools = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const pagedGatherHttpBudget: PagedGatherHttpBudget = {
        used: state.pagedListHttpUsed ?? 0,
        max: resolveMaxListHttpPerTurn(),
      };
      const gatherLlm: PagedGatherLlmContext = {
        llmService: this.llmService,
        promptRegistry: this.promptRegistry,
        scope: {
          appClientId: input.appClientId,
          agentId: input.agentId,
        },
        currentObjective:
          resolvePagedGatherAnalyzeObjective(state.taskPlan) ??
          state.taskPlan?.currentObjective ??
          undefined,
        runMetrics: input.runMetrics,
        runId: input.runId,
        sessionId: input.sessionId,
        iteration: state.iteration,
        onDebugLog: (message) => this.logger.warn(message),
      };
      const langChainBundleForResume =
        state.scopedToolBundle ??
        this.toolEngine.buildLangChainTools(state.scopedTools, {
          userId: input.userId,
          allowedToolIds: state.scopedAllowedToolIds,
        });
      const runRoundForGather = async (
        toolCalls: GraphToolCall[],
        observations: ToolObservation[],
        steps: AgentRunStep[],
      ) =>
        executeToolCallsRound({
          latestUserMessage: input.latestUserMessage,
          toolCalls,
          scopedTools: state.scopedTools,
          toolProfilesByName: state.toolProfilesByName,
          langChainBundle: langChainBundleForResume,
          toolEngine: this.toolEngine,
          observations,
          steps,
          iteration: state.iteration,
          assessObservationQuality: (output, agentMetadata) =>
            this.assessObservationQuality(output, agentMetadata),
          resolveToolStepCode: (quality, output, agentMetadata) =>
            this.resolveToolStepCode(quality, output, agentMetadata),
          runMetrics: input.runMetrics,
          runId: input.runId,
          sessionId: input.sessionId,
          onThink: (message) =>
            this.sse.emitThink(
              input.sessionId,
              input.runId,
              message,
              'delta',
            ),
          onToolDebugLog: (message) => this.logger.log(message),
        });

      if (
        state.pendingToolCalls.length === 0 &&
        shouldResumePagedGather({
          taskPlan: state.taskPlan,
          scopedTools: state.scopedTools,
          observations: allToolObservations(state),
        })
      ) {
        const resumed = await resumeIncompletePagedGather({
          taskPlan: state.taskPlan,
          scopedTools: state.scopedTools,
          observations: allToolObservations(state),
          steps: state.steps,
          runRound: runRoundForGather,
          gatherLlm,
          httpBudget: pagedGatherHttpBudget,
          onProgress: (message) =>
            this.sse.emitThink(input.sessionId, input.runId, message, 'delta'),
        });
        if (resumed) {
          const nextSteps = resumed.steps.map((row) => ({
            ...row,
            output: this.normalizeJsonLike(row.output),
          }));
          await this.updateRun(
            input.runId,
            nextSteps,
            state.iteration,
            AgentRunStatus.running,
          );
          return {
            ...state,
            steps: nextSteps,
            toolObservations: mergeRunRoundObservations(
              state,
              resumed.toolObservations,
            ),
            pendingToolCalls: [],
            pagedListHttpUsed: pagedGatherHttpBudget.used,
            lastToolRoundMeta: resumed.lastToolRoundMeta,
          };
        }
      }

      if (state.pendingToolCalls.length === 0) {
        return {
          ...state,
          lastToolRoundMeta: null,
          pagedListHttpUsed: pagedGatherHttpBudget.used,
        };
      }

      const { safeCalls, writeCallsNeedingConfirm } =
        partitionToolCallsByWriteConfirmation(
          state.pendingToolCalls,
          state.scopedTools,
          input.approvedWriteToolNames,
        );

      const langChainBundle =
        state.scopedToolBundle ??
        this.toolEngine.buildLangChainTools(state.scopedTools, {
          userId: input.userId,
          allowedToolIds: state.scopedAllowedToolIds,
        });

      const runRound = async (
        toolCalls: GraphToolCall[],
        observations: ToolObservation[],
        steps: AgentRunStep[],
      ) =>
        executeToolCallsRound({
          latestUserMessage: input.latestUserMessage,
          toolCalls,
          scopedTools: state.scopedTools,
          toolProfilesByName: state.toolProfilesByName,
          langChainBundle,
          toolEngine: this.toolEngine,
          observations,
          steps,
          iteration: state.iteration,
          assessObservationQuality: (output, agentMetadata) =>
            this.assessObservationQuality(output, agentMetadata),
          resolveToolStepCode: (quality, output, agentMetadata) =>
            this.resolveToolStepCode(quality, output, agentMetadata),
          runMetrics: input.runMetrics,
          runId: input.runId,
          sessionId: input.sessionId,
          onThink: (message) =>
            this.sse.emitThink(
              input.sessionId,
              input.runId,
              message,
              'delta',
            ),
          onToolDebugLog: (message) => this.logger.log(message),
        });

      if (writeCallsNeedingConfirm.length > 0) {
        let nextSteps = [...state.steps];
        let observations = [...allToolObservations(state)];
        let taskPlan = state.taskPlan ?? null;

        if (safeCalls.length > 0) {
          const safeRound = await expandPagedListGather({
            round: await runRound(safeCalls, observations, nextSteps),
            taskPlan: state.taskPlan,
            scopedTools: state.scopedTools,
            runRound,
            gatherLlm,
            httpBudget: pagedGatherHttpBudget,
            onProgress: (message) =>
              this.sse.emitThink(
                input.sessionId,
                input.runId,
                message,
                'delta',
              ),
          });
          nextSteps = safeRound.steps.map((row) => ({
            ...row,
            output: this.normalizeJsonLike(row.output),
          }));
          observations = safeRound.toolObservations;

          if (taskPlan && safeRound.lastToolRoundMeta.toolCalls.length > 0) {
            const advance = resolveTaskPlanAdvance({
              phase: 'post_tools',
              plan: taskPlan,
              observations,
              executionStatuses:
                safeRound.lastToolRoundMeta.executionStatuses,
              roundObservationIndices:
                safeRound.lastToolRoundMeta.roundObservationIndices,
              scopedTools: state.scopedTools,
              toolCalls: safeCalls,
              skillConfig: state.activeSkillConfig,
            });
            if (advance) {
              taskPlan = advance.updatedPlan;
            }
          }

          await this.updateRun(
            input.runId,
            nextSteps,
            state.iteration,
            AgentRunStatus.running,
          );
        }

        const message = buildWriteConfirmationUserMessage();
        await this.pendingWriteConfirmationStore.set({
          runId: input.runId,
          turnId: input.turnId,
          sessionId: input.sessionId,
          userId: input.userId,
          appClientId: input.appClientId,
          agentId: input.agentId,
          latestUserMessage: input.latestUserMessage,
          toolCalls: writeCallsNeedingConfirm,
          resumeContext: {
            steps: nextSteps as PendingWriteResumeContext['steps'],
            iteration: state.iteration,
            toolObservations: serializeObservationsForPending(observations),
            scopedToolIds: state.scopedTools.map((tool) => tool.id),
            intentKind: state.intentKind,
            hasExpandedOnce: state.hasExpandedOnce,
            skillApplied: state.skillApplied === true,
            activeSkillId: state.activeSkillId ?? null,
            activeSkillPrompt: state.activeSkillPrompt ?? null,
            activeSkillName: state.activeSkillName ?? null,
            activeSkillDescription: state.activeSkillDescription ?? null,
            activeSkillConfig: state.activeSkillConfig ?? null,
            activeSkillRiskLevel: state.activeSkillRiskLevel ?? null,
            taskPlan,
            pagedListHttpUsed: pagedGatherHttpBudget.used,
          },
          createdAt: new Date().toISOString(),
        });
        this.chatEvents.emit(input.sessionId, {
          event: 'message',
          payload: {
            source: 'agent-run',
            action: 'confirmation_required',
            runId: input.runId,
            turnId: input.turnId,
            message,
          },
        });
        this.sse.emitLlmReply(input.sessionId, input.runId, message, {
          code: 'WRITE_CONFIRMATION_REQUIRED',
          mode: 'full',
        });
        if (input.runId != null) {
          this.sse.runSseContentDelivered.add(
            this.sse.thinkBufferKey(input.sessionId, input.runId),
          );
        }
        return {
          ...state,
          steps: nextSteps,
          toolObservations: mergeRunRoundObservations(state, observations),
          taskPlan,
          pendingToolCalls: [],
          awaitingWriteConfirmation: true,
          finalOutput: message,
          status: AgentRunStatus.success,
          finished: true,
          pagedListHttpUsed: pagedGatherHttpBudget.used,
        };
      }

      const round = await expandPagedListGather({
        round: await runRound(
          state.pendingToolCalls,
          [...allToolObservations(state)],
          [...state.steps],
        ),
        taskPlan: state.taskPlan,
        scopedTools: state.scopedTools,
        runRound,
        gatherLlm,
        httpBudget: pagedGatherHttpBudget,
        onProgress: (message) =>
          this.sse.emitThink(input.sessionId, input.runId, message, 'delta'),
      });
      const nextSteps = round.steps.map((row) => ({
        ...row,
        output: this.normalizeJsonLike(row.output),
      }));

      await this.updateRun(
        input.runId,
        nextSteps,
        state.iteration,
        AgentRunStatus.running,
      );

      return {
        ...state,
        steps: nextSteps,
        toolObservations: mergeRunRoundObservations(
          state,
          round.toolObservations,
        ),
        pendingToolCalls: [],
        pendingSummaryObservation: null,
        pagedListHttpUsed: pagedGatherHttpBudget.used,
        lastToolRoundMeta: round.lastToolRoundMeta,
      };
    };

    // 节点4：结果检查。纯规则收拢 dedupe / EMPTY / ERROR / expand，不调 LLM。
    const resultCheck = async (
      state: AgentGraphState,
    ): Promise<AgentGraphState> => {
      const phase = inferResultCheckPhase(state);
      const savedRoundMeta = state.lastToolRoundMeta;
      if (phase === 'post_tools' && !savedRoundMeta) {
        const fallbackStep: AgentRunStep = {
          step: state.iteration,
          type: 'result_check',
          output: this.normalizeJsonLike({
            phase: 'post_tools',
            route: 'llm',
            reason: 'missing_tool_round_meta',
          }),
        };
        const steps = [...state.steps, fallbackStep];
        await this.updateRun(
          input.runId,
          steps,
          state.iteration,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps,
          pendingToolCalls: [],
          pendingSummaryObservation: null,
          lastToolRoundMeta: null,
        };
      }
      const outcome =
        phase === 'pre_tools'
          ? resolvePreToolsResultCheck({
              pendingToolCalls: state.pendingToolCalls,
              steps: state.steps,
              taskPlan: state.taskPlan,
              scopedTools: state.scopedTools,
              observations: allToolObservations(state),
              skillConfig: state.activeSkillConfig,
            })
          : resolvePostToolsResultCheck({
              userMessage: input.latestUserMessage,
              observations: allToolObservations(state),
              lastToolRoundMeta: savedRoundMeta!,
              scopedTools: state.scopedTools,
              taskPlan: state.taskPlan,
              skillConfig: state.activeSkillConfig,
              skillApplied: state.skillApplied,
              hasExpandedOnce: state.hasExpandedOnce,
              iteration: state.iteration,
              totalAllowedToolCount: input.tools.length,
              writeConfirmResume: input.resumeFromWriteConfirm === true,
              isLowQualityLastObservation: this.isLowQualityToolObservation(
                (() => {
                  const roundIndices = savedRoundMeta!.roundObservationIndices;
                  if (roundIndices.length === 0) {
                    return undefined;
                  }
                  return allToolObservations(state)[
                    roundIndices[roundIndices.length - 1]!
                  ];
                })(),
              ),
            });

      const planAdvance =
        state.taskPlan && (phase === 'pre_tools' || savedRoundMeta)
          ? resolveTaskPlanAdvance(
              phase === 'post_tools' && savedRoundMeta
                ? {
                    phase: 'post_tools',
                    plan: state.taskPlan,
                    observations: allToolObservations(state),
                    executionStatuses: savedRoundMeta.executionStatuses,
                    roundObservationIndices:
                      savedRoundMeta.roundObservationIndices,
                    scopedTools: state.scopedTools,
                    toolCalls: savedRoundMeta.toolCalls,
                    skillConfig: state.activeSkillConfig,
                  }
                : {
                    phase: 'pre_tools',
                    plan: state.taskPlan,
                    observations: allToolObservations(state),
                    scopedTools: state.scopedTools,
                    skillConfig: state.activeSkillConfig,
                  },
            )
          : null;
      const taskPlanNext = planAdvance?.updatedPlan ?? state.taskPlan ?? null;
      const abortPlanOnEmptyResults =
        outcome.reason === 'empty_tool_results' && state.taskPlan != null;
      const abortPlanOnDuplicateSummarize =
        state.taskPlan != null &&
        planAdvance == null &&
        (outcome.reason === 'duplicate_tool_call_round' ||
          outcome.reason === 'all_tool_calls_duplicate');
      const abortPlanOnToolStepExhausted =
        outcome.reason === 'plan_tool_step_exhausted' && state.taskPlan != null;
      const abortPlanOnWriteStepExhausted =
        outcome.reason === 'plan_write_step_exhausted' && state.taskPlan != null;
      const taskPlanAfterCheck =
        abortPlanOnEmptyResults ||
        abortPlanOnDuplicateSummarize ||
        abortPlanOnToolStepExhausted ||
        abortPlanOnWriteStepExhausted
          ? null
          : taskPlanNext;

      const skipSteps =
        outcome.duplicateSkipCalls.length > 0
          ? buildDuplicateSkipToolSteps(
              outcome.duplicateSkipCalls,
              state.iteration,
              outcome.reason,
            )
          : [];
      const resultCheckStep: AgentRunStep = {
        step: state.iteration,
        type: 'result_check',
        output: this.normalizeJsonLike({
          phase: outcome.phase,
          route: outcome.route,
          reason: outcome.reason,
          duplicateSkipCount: outcome.duplicateSkipCalls.length,
          pendingToolCallCount: outcome.pendingToolCalls.length,
          supersededPendingToolCallCount:
            outcome.supersededPendingToolCallCount ?? 0,
          planAdvanceRoute: planAdvance?.route ?? null,
          planAdvanceReason: planAdvance?.reason ?? null,
          planAbortedEmpty: abortPlanOnEmptyResults,
          planAbortedDuplicate: abortPlanOnDuplicateSummarize,
          planAbortedToolStepExhausted: abortPlanOnToolStepExhausted,
          planAbortedWriteStepExhausted: abortPlanOnWriteStepExhausted,
          taskPlanStep: taskPlanAfterCheck?.currentStepId ?? null,
        }),
      };
      let steps = [...state.steps, ...skipSteps, resultCheckStep];

      const emitRouteThink = (message: string): void => {
        this.sse.emitThink(input.sessionId, input.runId, message, 'delta');
      };

      const mustRunToolsBeforeSummarize =
        outcome.route === 'tools' && outcome.pendingToolCalls.length > 0;

      const effectivePlanAdvance = planAdvance;
      const effectiveTaskPlanNext = taskPlanNext;

      if (
        effectivePlanAdvance?.route === 'summarize' &&
        !mustRunToolsBeforeSummarize &&
        shouldDeferSummarizeForPendingWritePlan(effectiveTaskPlanNext)
      ) {
        const deferredWrite =
          reprioritizePlanForPendingWriteStep(effectiveTaskPlanNext) ??
          effectiveTaskPlanNext;
        emitRouteThink('任务计划尚有写操作步骤，继续执行…\n');
        await this.updateRun(
          input.runId,
          steps,
          state.iteration,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps,
          taskPlan: deferredWrite,
          pendingToolCalls: outcome.pendingToolCalls,
          pendingSummaryObservation: null,
          lastToolRoundMeta: null,
        };
      }

      if (
        effectivePlanAdvance?.route === 'summarize' &&
        !mustRunToolsBeforeSummarize
      ) {
        const mergedObservation = this.mergeObservationsForSummary(
          allToolObservations(state),
        );
        const summaryObservation =
          resolveSummaryObservationForCheck({
            reason: effectivePlanAdvance.reason,
            observations: allToolObservations(state),
            savedRoundMeta,
            mergedObservation,
          }) ??
          buildPlanSummarizeObservation({
            userMessage: input.latestUserMessage,
            merged: mergedObservation,
          });
        if (effectivePlanAdvance.reason === 'plan_advance_summarize') {
          emitRouteThink('数据已就绪，正在按任务计划生成结果…\n');
        } else if (effectivePlanAdvance.reason === 'plan_complete') {
          emitRouteThink('任务计划已完成，正在生成最终结果…\n');
        }
        await this.updateRun(
          input.runId,
          steps,
          state.iteration,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps,
          taskPlan: effectiveTaskPlanNext,
          pendingToolCalls: [],
          pendingSummaryObservation: summaryObservation,
          lastToolRoundMeta: null,
        };
      }

      if (
        effectivePlanAdvance?.route === 'llm' &&
        effectivePlanAdvance.reason === 'plan_defer_summarize_pending_write'
      ) {
        emitRouteThink('任务计划尚有写操作步骤，继续执行…\n');
        await this.updateRun(
          input.runId,
          steps,
          state.iteration,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps,
          taskPlan: effectiveTaskPlanNext,
          pendingToolCalls: outcome.pendingToolCalls,
          pendingSummaryObservation: null,
          lastToolRoundMeta: null,
        };
      }

      if (effectivePlanAdvance?.route === 'llm' && outcome.route === 'summarize') {
        if (effectivePlanAdvance.reason === 'plan_advance_tool_step') {
          emitRouteThink('进入下一任务步骤…\n');
        }
        await this.updateRun(
          input.runId,
          steps,
          state.iteration,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps,
          taskPlan: effectiveTaskPlanNext,
          pendingToolCalls: [],
          pendingSummaryObservation: null,
          lastToolRoundMeta: null,
        };
      }

      if (outcome.route === 'expand_tools') {
        const allToolIds = input.tools.map((tool) => tool.id);
        const expandedBundle = this.toolEngine.buildLangChainTools(input.tools, {
          userId: input.userId,
          allowedToolIds: allToolIds,
        });
        const expandedStep: AgentRunStep = {
          step: state.iteration,
          type: 'intent',
          output: this.normalizeJsonLike({
            fallback: true,
            fallbackReason: outcome.reason,
            toolsBeforeExpand: state.scopedTools.length,
            toolsAfterExpand: input.tools.length,
          }),
        };
        steps = [...steps, expandedStep];
        await this.updateRun(
          input.runId,
          steps,
          state.iteration,
          AgentRunStatus.running,
        );
        emitRouteThink('首轮结果信息不足，正在放宽工具范围再尝试一次…\n');
        const expandedPlanInput = {
          userMessage: input.latestUserMessage,
          scopedToolSummaries: summarizeScopedToolsForPlan(input.tools),
          skillApplied: state.skillApplied === true,
          skillName: state.activeSkillName,
          skillDescription: state.activeSkillDescription,
          skillConfig: state.activeSkillConfig,
          skillRiskLevel: state.activeSkillRiskLevel ?? null,
          skillPrompt: state.activeSkillPrompt,
        };
        const expandedResolvedPlan = await resolveTaskPlan({
          llmService: this.llmService,
          promptRegistry: this.promptRegistry,
          scope: promptScope,
          planInput: expandedPlanInput,
        });
        return {
          ...state,
          steps,
          pendingToolCalls: [],
          pendingSummaryObservation: null,
          lastToolRoundMeta: null,
          scopedTools: input.tools,
          scopedLangChainTools: expandedBundle.tools,
          scopedToolBundle: expandedBundle,
          scopedAllowedToolIds: allToolIds,
          hasExpandedOnce: true,
          taskPlan: expandedResolvedPlan.plan,
        };
      }

      if (outcome.route === 'summarize') {
        if (
          shouldDeferSummarizeForPendingWritePlan(
            taskPlanAfterCheck,
            outcome.reason,
          )
        ) {
          const deferredWrite =
            reprioritizePlanForPendingWriteStep(taskPlanAfterCheck) ??
            taskPlanAfterCheck;
          emitRouteThink('任务计划尚有写操作步骤，继续执行…\n');
          await this.updateRun(
            input.runId,
            steps,
            state.iteration,
            AgentRunStatus.running,
          );
          return {
            ...state,
            steps,
            taskPlan: deferredWrite,
            pendingToolCalls: [],
            pendingSummaryObservation: null,
            lastToolRoundMeta: null,
          };
        }
        const planStepExhausted =
          outcome.reason === 'plan_tool_step_exhausted' ||
          outcome.reason === 'plan_write_step_exhausted';
        const summaryObservation = planStepExhausted
          ? null
          : resolveSummaryObservationForCheck({
              reason: outcome.reason,
              observations: allToolObservations(state),
              savedRoundMeta,
              mergedObservation:
                outcome.reason === 'tool_error_summarize'
                  ? null
                  : this.mergeObservationsForSummary(allToolObservations(state)),
            });
        if (summaryObservation) {
          if (
            outcome.reason === 'duplicate_tool_call_round' ||
            outcome.reason === 'all_tool_calls_duplicate'
          ) {
            emitRouteThink(
              '检测到与上一轮完全相同的工具调用，强制汇总已有结果…\n',
            );
          } else if (outcome.reason === 'empty_tool_results') {
            emitRouteThink(
              '查询成功，但未找到符合条件的数据，正在生成说明…\n',
            );
          }
          await this.updateRun(
            input.runId,
            steps,
            state.iteration,
            AgentRunStatus.running,
          );
          return {
            ...state,
            steps,
            taskPlan: taskPlanAfterCheck,
            pendingToolCalls: [],
            pendingSummaryObservation: summaryObservation,
            lastToolRoundMeta: null,
          };
        }
        const exhaustedFallback =
          outcome.reason === 'plan_write_step_exhausted'
            ? '未能按任务计划发起写操作（未生成有效的工具调用）。请确认需要提交回复或修改数据后，我再试一次。'
            : outcome.reason === 'plan_tool_step_exhausted'
              ? '我未能按任务计划调用所需工具获取数据，请补充更具体的查询条件后我再试一次。'
              : '我暂时无法根据已有工具结果给出汇总，请补充更具体的条件后我再试一次。';
        emitRouteThink(
          outcome.reason === 'plan_write_step_exhausted'
            ? '未能完成写操作步骤，正在生成说明…\n'
            : '无法从已有工具结果生成汇总，正在生成说明…\n',
        );
        await this.updateRun(
          input.runId,
          steps,
          state.iteration,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps,
          taskPlan: taskPlanAfterCheck,
          pendingToolCalls: [],
          pendingSummaryObservation: this.buildDirectReplyObservation(
            input.latestUserMessage,
            exhaustedFallback,
          ),
          lastToolRoundMeta: null,
        };
      }

      if (
        outcome.route === 'tools' &&
        outcome.reason === 'paged_gather_resume'
      ) {
        emitRouteThink(
          outcome.pagedGatherResumeKind === 'map_summary'
            ? '页内摘要未完成，正在重试（复用已拉取数据）…\n'
            : '分页数据未拉取完整，正在继续拉取…\n',
        );
        await this.updateRun(
          input.runId,
          steps,
          state.iteration,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps,
          taskPlan: taskPlanAfterCheck,
          pendingToolCalls: [],
          pendingSummaryObservation: null,
          lastToolRoundMeta: null,
        };
      }

      if (outcome.reason === 'duplicate_off_plan_step') {
        emitRouteThink('当前任务步骤需要其他工具，正在重新决策…\n');
      }
      if (outcome.reason === 'plan_tool_step_required') {
        emitRouteThink('当前任务步骤需要先调用工具，正在重新决策…\n');
      }
      if (outcome.reason === 'plan_write_step_required') {
        emitRouteThink('当前任务步骤需要执行写操作，正在重新决策…\n');
      }
      if (outcome.reason === 'plan_write_step_exhausted') {
        emitRouteThink('多次未能发起写操作，正在生成说明…\n');
      }
      if (outcome.reason === 'plan_tool_step_exhausted') {
        emitRouteThink(
          '多次未能按任务计划调用工具，正在根据已有信息生成说明…\n',
        );
      }

      await this.updateRun(
        input.runId,
        steps,
        state.iteration,
        AgentRunStatus.running,
      );

      return {
        ...state,
        steps,
        taskPlan: taskPlanAfterCheck,
        pendingToolCalls: outcome.pendingToolCalls,
        pendingSummaryObservation: null,
        lastToolRoundMeta: null,
      };
    };

     // 节点5：汇总节点。将本轮工具执行结果汇总为最终答案。
    const summarize = async (
      state: AgentGraphState,
    ): Promise<AgentGraphState> => {
      const pendingObservation = state.pendingSummaryObservation;
      if (!pendingObservation) {
        return state;
      }
      if (isWriteConfirmResumeSummaryObservation(pendingObservation)) {
        const payload = pendingObservation.output as WriteConfirmResumeSummaryPayload;
        const mergedObservation = this.mergeObservationsForSummary(
          allToolObservations(state),
        );
        const summarized = await this.summarizeWriteConfirmResume(
          payload,
          mergedObservation?.output,
          input.promptMessages,
          input.sessionId,
          input.runId,
          promptScope,
          state.taskPlan,
        );
        const storedSummarized = this.sanitizeFinalOutput(summarized);
        const storedBlocks = tryParseStoredMessageBlocks(storedSummarized);
        const stepPlain =
          storedBlocks && storedBlocks.length > 0
            ? messageBlocksToPlainText(storedBlocks)
            : storedSummarized;
        const summaryStep: AgentRunStep = {
          step: state.iteration + 1,
          type: 'summarize',
          name: 'write_confirm_resume',
          output: stepPlain,
        };
        const nextSteps = [...state.steps, summaryStep];
        const taskPlanAfterSummarize = finalizePlanAfterSummarize(state.taskPlan);
        await this.updateRun(
          input.runId,
          nextSteps,
          state.iteration,
          AgentRunStatus.success,
        );
        return {
          ...state,
          steps: nextSteps,
          pendingSummaryObservation: null,
          taskPlan: taskPlanAfterSummarize,
          finalOutput: storedSummarized,
          status: AgentRunStatus.success,
          finished: true,
        };
      }
      const toolDef = state.scopedTools.find(
        (tool) => tool.name === pendingObservation.name,
      );
      const toolErrorObs = isAgentToolErrorObservation(pendingObservation.output)
        ? pendingObservation.output
        : null;
      const shouldSummarizeToolErrorWithLlm =
        toolErrorObs != null &&
        (toolErrorObs.responseSource != null ||
          isMutationTool(toolDef?.agentMetadata) ||
          state.taskPlan?.taskPhase === 'mutate');
      const toolErrorHint = extractToolErrorUserHint(pendingObservation.output);
      if (toolErrorHint && !shouldSummarizeToolErrorWithLlm) {
        const errorBlocks = buildRuleBasedMessageBlocks({
          output: pendingObservation.output,
          userMessage: input.latestUserMessage,
          fieldLabels: {},
          toolErrorHint,
          downstreamResponseSource: toolErrorObs?.responseSource,
        });
        const stored = serializeMessageBlocksForStorage(errorBlocks);
        const summaryStep: AgentRunStep = {
          step: state.iteration + 1,
          type: 'summarize',
          name: pendingObservation.name,
          output: toolErrorHint,
        };
        const nextSteps = [...state.steps, summaryStep];
        await this.updateRun(
          input.runId,
          nextSteps,
          state.iteration,
          AgentRunStatus.success,
        );
        return {
          ...state,
          steps: nextSteps,
          pendingSummaryObservation: null,
          taskPlan: finalizePlanAfterSummarize(state.taskPlan),
          finalOutput: stored,
          status: AgentRunStatus.success,
          finished: true,
        };
      }
      const planSummarizeUserMessage = resolveSummarizeUserMessageForPlan(
        input.latestUserMessage,
        state.taskPlan,
      );
      const mergedPlanObservation = isPendingPlanAnswerStep(state.taskPlan)
        ? this.mergeObservationsForSummary(allToolObservations(state))
        : null;
      const summarized =
        pendingObservation.name === 'direct_user' ||
        pendingObservation.name === 'smalltalk'
          ? mergedPlanObservation
            ? await this.summarizeToolOutputForUser(
                mergedPlanObservation.name,
                state.scopedTools.find(
                  (tool) => tool.name === mergedPlanObservation.name,
                )?.description,
                planSummarizeUserMessage,
                mergedPlanObservation.output,
                mergedPlanObservation.fieldLabels ?? {},
                mergedPlanObservation.fieldDescriptions ?? {},
                mergedPlanObservation.enumLabelsByPath ?? {},
                input.promptMessages,
                input.sessionId,
                input.runId,
                promptScope,
                state.taskPlan,
              )
            : await this.summarizeDirectUserMessage(
                planSummarizeUserMessage,
                pendingObservation.output,
                input.promptMessages,
                input.sessionId,
                input.runId,
                promptScope,
                state.taskPlan,
              )
          : pendingObservation.name === 'direct_reply'
            ? await this.summarizeDirectLlmReply(
                input.latestUserMessage,
                pendingObservation.output,
                input.promptMessages,
                input.sessionId,
                input.runId,
                promptScope,
              )
            : await this.summarizeToolOutputForUser(
              pendingObservation.name,
              toolDef?.description,
              planSummarizeUserMessage,
              pendingObservation.output,
              pendingObservation.fieldLabels ?? {},
              pendingObservation.fieldDescriptions ?? {},
              pendingObservation.enumLabelsByPath ?? {},
              input.promptMessages,
              input.sessionId,
              input.runId,
              promptScope,
              state.taskPlan,
              toolDef?.agentMetadata,
              pendingObservation.llmPayload?.args,
            );
      if (!summarized || summarized.trim().length === 0) {
        const fallback = messageBlocksToPlainText(
          ensureAtLeastOneTextBlock([], '抱歉，我暂时无法整理出有效回复。'),
        );
        this.logger.warn(
          `summarize returned empty runId=${input.runId} observation=${pendingObservation.name}`,
        );
        const summaryStep: AgentRunStep = {
          step: state.iteration + 1,
          type: 'summarize',
          name: pendingObservation.name,
          output: fallback,
        };
        const nextSteps = [...state.steps, summaryStep];
        const stored = serializeMessageBlocksForStorage([
          textBlock(fallback),
        ]);
        await this.updateRun(
          input.runId,
          nextSteps,
          state.iteration,
          AgentRunStatus.success,
        );
        this.sse.emitMessageBlocks(input.sessionId, input.runId, [textBlock(fallback)], {
          action: 'stream',
          mode: 'full',
        });
        return {
          ...state,
          steps: nextSteps,
          pendingSummaryObservation: null,
          taskPlan: finalizePlanAfterSummarize(state.taskPlan),
          finalOutput: stored,
          status: AgentRunStatus.success,
          finished: true,
        };
      }
      const storedSummarized = this.sanitizeFinalOutput(summarized);
      const storedBlocks = tryParseStoredMessageBlocks(storedSummarized);
      const stepPlain =
        storedBlocks && storedBlocks.length > 0
          ? messageBlocksToPlainText(storedBlocks)
          : storedSummarized;
      const summaryStep: AgentRunStep = {
        step: state.iteration + 1,
        type: 'summarize',
        name: this.resolveSummarizeStepName(
          state.taskPlan,
          pendingObservation.name,
        ),
        output: stepPlain,
      };
      const nextSteps = [...state.steps, summaryStep];
      const taskPlanAfterSummarize = finalizePlanAfterSummarize(state.taskPlan);
      const continuePlan = shouldContinuePlanAfterSummarize(taskPlanAfterSummarize);
      if (continuePlan) {
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          '中间结果已生成，继续执行后续任务步骤…\n',
          'delta',
        );
      }
      await this.updateRun(
        input.runId,
        nextSteps,
        state.iteration,
        continuePlan ? AgentRunStatus.running : AgentRunStatus.success,
      );
      return {
        ...state,
        steps: nextSteps,
        pendingSummaryObservation: null,
        taskPlan: taskPlanAfterSummarize,
        finalOutput: continuePlan ? state.finalOutput : storedSummarized,
        status: continuePlan ? AgentRunStatus.running : AgentRunStatus.success,
        finished: !continuePlan,
      };
    };
    // 图路由：
    // START -> skill -> plan -> llm（命中）
    // START -> skill -> intent -> plan -> llm（未命中）
    // llm -> resultCheck -> tools | summarize | llm
    // tools -> resultCheck -> llm | summarize | expand->llm
    const graph = new StateGraph(State)
      .addNode('intent', intent)
      .addNode('plan', plan)
      .addNode('llm', llm)
      .addNode('tools', tools)
      .addNode('resultCheck', resultCheck)
      .addNode('summarize', summarize)
      .addNode('skill', skill)
      .addConditionalEdges(START, (s: AgentGraphState) => {
        if (input.resumeFromWriteConfirm) {
          if (s.pendingSummaryObservation) {
            return 'summarize';
          }
          return 'resultCheck';
        }
        if (input.resumeFromLlm) {
          return 'llm';
        }
        return 'skill';
      })
      .addConditionalEdges('skill', (s: AgentGraphState) => {
        if (s.finished) {
          return END;
        }
        if (s.pendingSummaryObservation) {
          return 'summarize';
        }
        if (s.skillApplied) {
          return 'plan';
        }
        return 'intent';
      })
      .addConditionalEdges('intent', (s: AgentGraphState) => {
        if (s.finished) {
          return END;
        }
        if (s.pendingSummaryObservation) {
          return 'summarize';
        }
        return 'plan';
      })
      .addConditionalEdges('plan', (s: AgentGraphState) => {
        if (s.finished) {
          return END;
        }
        if (s.pendingSummaryObservation) {
          return 'summarize';
        }
        return 'llm';
      })
      .addConditionalEdges('llm', (state: AgentGraphState) => {
        if (state.finished) {
          return END;
        }
        if (state.pendingSummaryObservation) {
          return 'summarize';
        }
        return 'resultCheck';
      })
      .addConditionalEdges('tools', (state: AgentGraphState) => {
        if (state.finished) {
          return END;
        }
        return 'resultCheck';
      })
      .addConditionalEdges('resultCheck', (state: AgentGraphState) => {
        if (state.finished) {
          return END;
        }
        if (state.pendingSummaryObservation) {
          return 'summarize';
        }
        if (
          shouldRouteGraphToTools({
            pendingToolCalls: state.pendingToolCalls,
            taskPlan: state.taskPlan,
            scopedTools: state.scopedTools,
            observations: allToolObservations(state),
          })
        ) {
          return 'tools';
        }
        if (state.iteration >= input.maxSteps) {
          return END;
        }
        return 'llm';
      })
      .addConditionalEdges('summarize', (state: AgentGraphState) => {
        if (state.finished || input.resumeFromWriteConfirm) {
          return END;
        }
        return 'llm';
      });
    const app = graph.compile();
    const defaultInitial: AgentGraphState = {
      iteration: 0,
      steps: [],
      toolObservations: [],
      pendingToolCalls: [],
      pendingSummaryObservation: null,
      intentKind: 'task',
      finalOutput: '',
      status: AgentRunStatus.running,
      finished: false,
      scopedTools: input.tools,
      scopedLangChainTools: input.langChainTools.tools,
      scopedToolBundle: input.langChainTools,
      scopedAllowedToolIds: input.allowedToolIds,
      toolProfilesByName: input.toolProfilesByName,
      hasExpandedOnce: false,
      skillApplied: false,
      activeSkillId: null,
      activeSkillPrompt: null,
      activeSkillName: null,
      activeSkillDescription: null,
      activeSkillConfig: null,
      activeSkillRiskLevel: null,
      taskPlan: null,
      lastToolRoundMeta: null,
      pagedListHttpUsed: 0,
      preloadedToolObservations: [],
    };
    const graphOverride = input.graphInitialState ?? {};
    const priorObservations: ToolObservation[] = sessionPriorObservations.map(
      (row) => ({
        name: row.name,
        output: row.output,
      }),
    );
    const initial = {
      ...defaultInitial,
      ...graphOverride,
      preloadedToolObservations:
        graphOverride.preloadedToolObservations ?? priorObservations,
      toolObservations: graphOverride.toolObservations ?? [],
    };
    return app.invoke(initial);
  }

  /** 判断工具观测是否“低质量”，用于触发一次性放宽重试。 */
  private isLowQualityToolObservation(observation: ToolObservation | undefined): boolean {
    if (!observation) {
      return true;
    }
    if (isAgentToolErrorObservation(observation.output)) {
      return true;
    }
    if (isEmptyListToolObservation(observation.output)) {
      return false;
    }
    const output = observation.output;
    if (output == null) {
      return true;
    }
    if (typeof output === 'string') {
      return output.trim().length === 0;
    }
    if (Array.isArray(output)) {
      return output.length === 0;
    }
    if (typeof output !== 'object') {
      return false;
    }
    const row = output as Record<string, unknown>;
    if (Object.keys(row).length === 0) {
      return true;
    }
    const data = row['data'];
    if (Array.isArray(data) && data.length === 0) {
      return false;
    }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return Object.keys(data as Record<string, unknown>).length === 0;
    }
    return false;
  }

  /** 工具 observation 质量评估：用于运行统计和后续回退策略。 */
  assessObservationQualityForResume(
    output: unknown,
    agentMetadata?: unknown,
  ): 'high' | 'medium' | 'low' {
    return this.assessObservationQuality(output, agentMetadata);
  }

  buildPendingPlanSummaryObservation(
    userMessage: string,
    observations: ToolObservation[],
  ): ToolObservation {
    return buildPlanSummarizeObservation({
      userMessage,
      merged: this.mergeObservationsForSummary(observations),
    });
  }

  private buildWriteConfirmResumeFallbackPlainText(
    payload: WriteConfirmResumeSummaryPayload,
  ): string {
    if (payload.outcome === 'failed') {
      const firstError = payload.operations.find((row) => row.errorHint)?.errorHint;
      if (firstError) {
        return firstError;
      }
      return `Write operation failed (${payload.failureCount}/${payload.totalCount}).`;
    }
    if (payload.totalCount <= 1) {
      return 'Write operation completed successfully.';
    }
    return `${payload.successCount} write operation(s) completed successfully.`;
  }

  private buildWriteConfirmResumeFallbackBlocks(
    payload: WriteConfirmResumeSummaryPayload,
  ): MessageBlock[] {
    const metrics =
      payload.totalCount > 0
        ? [
            {
              type: 'metric' as const,
              items: [
                { label: 'Confirmed writes', value: String(payload.totalCount) },
                { label: 'Succeeded', value: String(payload.successCount) },
                { label: 'Failed', value: String(payload.failureCount) },
              ],
            },
          ]
        : [];
    if (payload.outcome === 'failed') {
      const firstError = payload.operations.find((row) => row.errorHint)?.errorHint;
      return [
        {
          type: 'alert',
          severity: 'error',
          title: 'Write operation failed',
          message:
            firstError ??
            `${payload.failureCount} of ${payload.totalCount} confirmed write operation(s) failed.`,
        },
        ...metrics,
      ];
    }
    return [
      textBlock(this.buildWriteConfirmResumeFallbackPlainText(payload)),
      ...metrics,
    ];
  }

  private async summarizeWriteConfirmResume(
    payload: WriteConfirmResumeSummaryPayload,
    mergedToolOutput: unknown,
    promptMessages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    scope: { appClientId: number; agentId: number },
    taskPlan?: TaskPlanSnapshot | null,
  ): Promise<string> {
    const agentPrompts = promptMessages.filter(
      (message) =>
        message.role === 'system' && message.content.includes('<agent_prompt>'),
    );
    const toolResultsJson =
      mergedToolOutput != null ? this.stringifyForPrompt(mergedToolOutput) : undefined;
    const fallbackPlain = this.buildWriteConfirmResumeFallbackPlainText(payload);
    const fallbackBlocks = this.buildWriteConfirmResumeFallbackBlocks(payload);
    const summarizeMessages: LlmChatMessage[] = [
      ...agentPrompts,
      {
        role: 'system',
        content: await this.promptRegistry.render(
          PROMPT_KEYS.PLATFORM_MESSAGE_BLOCKS_SPEC,
          scope,
        ),
      },
      {
        role: 'system',
        content: await this.promptRegistry.render(
          PROMPT_KEYS.AGENT_SUMMARIZE_WRITE_CONFIRM_RESUME,
          scope,
        ),
      },
      {
        role: 'user',
        content: formatWriteConfirmResumeSummarizeUserMessage({
          payload,
          taskPlan,
          toolResultsJson,
        }),
      },
    ];
    try {
      const blocks = await this.sse.streamSummarizeMessageBlocks(
        summarizeMessages,
        sessionId,
        runId,
        fallbackBlocks,
        fallbackPlain,
      );
      return serializeMessageBlocksForStorage(blocks);
    } catch (error) {
      this.logger.warn(
        `write confirm resume summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return serializeMessageBlocksForStorage(fallbackBlocks);
    }
  }

  private assessObservationQuality(
    output: unknown,
    agentMetadata?: unknown,
  ): 'high' | 'medium' | 'low' {
    if (isAgentToolErrorObservation(output)) {
      return 'low';
    }
    if (isMutationTool(agentMetadata)) {
      return 'medium';
    }
    if (output == null) {
      return 'low';
    }
    if (typeof output === 'string') {
      const text = output.trim();
      if (!text) {
        return 'low';
      }
      return text.length >= 12 ? 'medium' : 'low';
    }
    if (typeof output === 'number' || typeof output === 'boolean') {
      return 'low';
    }
    if (Array.isArray(output)) {
      if (output.length === 0) {
        return 'low';
      }
      const first = output[0];
      if (!first || typeof first !== 'object' || Array.isArray(first)) {
        return 'medium';
      }
      return this.hasBusinessKeySignal(first as Record<string, unknown>)
        ? 'high'
        : 'medium';
    }
    if (typeof output !== 'object') {
      return 'low';
    }
    const row = output as Record<string, unknown>;
    if (Object.keys(row).length === 0) {
      return 'low';
    }
    const data = row['data'];
    if (Array.isArray(data) && data.length === 0) {
      return 'medium';
    }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const dataRow = data as Record<string, unknown>;
      if (Object.keys(dataRow).length === 0) {
        return 'low';
      }
      if (this.hasBusinessKeySignal(dataRow)) {
        return 'high';
      }
      return 'medium';
    }
    if (this.hasBusinessKeySignal(row)) {
      return 'high';
    }
    return 'medium';
  }

  private hasBusinessKeySignal(row: Record<string, unknown>): boolean {
    const businessKeys = [
      'id',
      'name',
      'title',
      'status',
      'code',
      'total',
      'items',
      'records',
      'list',
    ];
    const keys = Object.keys(row);
    const keyHit = keys.some((key) =>
      businessKeys.some((hint) => key.toLowerCase().includes(hint)),
    );
    if (!keyHit) {
      return false;
    }
    return keys.some((key) => {
      const value = row[key];
      if (value == null) {
        return false;
      }
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object') {
        return Object.keys(value as Record<string, unknown>).length > 0;
      }
      return true;
    });
  }

  private resolveToolStepCode(
    quality: 'high' | 'medium' | 'low',
    output: unknown,
    agentMetadata?: unknown,
  ): AgentMachineCode | null {
    return resolveToolStepMachineCode({ quality, output, agentMetadata });
  }

  private extractAiMessageText(message: AIMessage): string {
    if (typeof message.content === 'string') {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      return message.content
        .map((item) =>
          item && typeof item === 'object' && 'text' in item
            ? String(item.text ?? '')
            : '',
        )
        .join('');
    }
    return '';
  }

  /** 多笔 tool 观测合并为一条，供 summarize / 规则化 table 使用。 */
  private mergeObservationsForSummary(
    observations: ToolObservation[],
  ): ToolObservation | null {
    const usable = observations.filter(
      (row) =>
        row.output != null && !isAgentToolErrorObservation(row.output),
    );
    if (usable.length === 0) {
      return null;
    }
    if (usable.length === 1) {
      return usable[0];
    }
    const tail = usable[usable.length - 1];
    return {
      name: 'merged_tool_results',
      output: mergeToolOutputsForSummary(usable.map((row) => row.output)),
      quality: 'high',
      fieldLabels: tail.fieldLabels,
      fieldDescriptions: tail.fieldDescriptions,
      enumLabelsByPath: tail.enumLabelsByPath,
    };
  }

  /** llm 不再调工具时：一律走 summarize，统一用户可见回复口径。 */
  private resolveLlmCompletionAfterTools(
    userMessage: string,
    llmText: string,
    observations: ToolObservation[],
  ): { observation: ToolObservation } | null {
    const merged = this.mergeObservationsForSummary(observations);
    if (merged) {
      return { observation: merged };
    }
    const draft = llmText.trim();
    if (!draft) {
      return null;
    }
    return {
      observation: this.buildDirectReplyObservation(
        userMessage,
        extractLlmUserFacingText(draft),
      ),
    };
  }

  private buildDirectReplyObservation(
    userMessage: string,
    draftReply: string,
  ): ToolObservation {
    const cleanDraft = extractLlmUserFacingText(draftReply);
    return {
      name: 'direct_reply',
      output: {
        userMessage,
        draftReply: cleanDraft,
      },
      quality: 'medium',
    };
  }

  private extractDirectReplyDraft(output: unknown): string {
    if (typeof output === 'string') {
      return extractLlmUserFacingText(output);
    }
    if (output && typeof output === 'object' && !Array.isArray(output)) {
      const draft = (output as Record<string, unknown>).draftReply;
      if (typeof draft === 'string') {
        return extractLlmUserFacingText(draft);
      }
    }
    return '';
  }

  private async summarizeDirectLlmReply(
    userMessage: string,
    output: unknown,
    promptMessages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    scope: { appClientId: number; agentId: number },
  ): Promise<string> {
    const draftReply = this.extractDirectReplyDraft(output);
    const fallback = draftReply || '抱歉，我暂时无法回答这个问题。';
    const agentPrompts = promptMessages.filter(
      (message) =>
        message.role === 'system' && message.content.includes('<agent_prompt>'),
    );
    const summarizeMessages: LlmChatMessage[] = [
      ...agentPrompts,
      {
        role: 'system',
        content: await this.promptRegistry.render(
          PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS,
          scope,
        ),
      },
      {
        role: 'user',
        content: [
          `User request: ${userMessage}`,
          `Assistant draft (polish and format as message blocks; do not invent facts beyond the draft): ${draftReply}`,
        ].join('\n'),
      },
    ];
    try {
      const blocks = await this.sse.streamSummarizeMessageBlocks(
        summarizeMessages,
        sessionId,
        runId,
        [],
        fallback,
      );
      return serializeMessageBlocksForStorage(blocks);
    } catch (error) {
      this.logger.warn(
        `direct reply summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const blocks = [textBlock(fallback)];
      this.sse.emitMessageBlocks(sessionId, runId, blocks, {
        action: 'stream',
        mode: 'full',
      });
      return serializeMessageBlocksForStorage(blocks);
    }
  }

  private extractDirectUserGuidanceHint(output: unknown): string | undefined {
    if (output && typeof output === 'object' && !Array.isArray(output)) {
      const hint = (output as Record<string, unknown>).guidanceHint;
      if (typeof hint === 'string' && hint.trim().length > 0) {
        return hint.trim();
      }
    }
    return undefined;
  }

  private async summarizeDirectUserMessage(
    userMessage: string,
    output: unknown,
    promptMessages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    scope: { appClientId: number; agentId: number },
    taskPlan?: TaskPlanSnapshot | null,
  ): Promise<string> {
    const guidanceHint = this.extractDirectUserGuidanceHint(output);
    const planContext = formatPlanContextForSummarize(taskPlan);
    const planAnswerStep = isPendingPlanAnswerStep(taskPlan);
    const fallback = guidanceHint || 'Hello! How can I help you?';
    const agentPrompts = promptMessages.filter(
      (message) =>
        message.role === 'system' && message.content.includes('<agent_prompt>'),
    );
    const summarizeMessages: LlmChatMessage[] = [...agentPrompts];
    if (planAnswerStep) {
      summarizeMessages.push({
        role: 'system',
        content: await this.promptRegistry.render(
          PROMPT_KEYS.PLATFORM_MESSAGE_BLOCKS_SPEC,
          scope,
        ),
      });
    }
    summarizeMessages.push({
      role: 'system',
      content: await this.promptRegistry.render(
        planAnswerStep || guidanceHint
          ? PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS
          : PROMPT_KEYS.AGENT_SUMMARIZE_SMALLTALK,
        scope,
      ),
    });
    summarizeMessages.push({
        role: 'user',
        content: planAnswerStep
          ? [
              `User request: ${userMessage}`,
              planContext ? `<plan_context>\n${planContext}\n</plan_context>` : null,
              guidanceHint ? `Guidance: ${guidanceHint}` : null,
            ]
              .filter((line): line is string => line != null && line.length > 0)
              .join('\n')
          : guidanceHint
            ? [`User request: ${userMessage}`, `Guidance: ${guidanceHint}`].join(
                '\n',
              )
            : userMessage,
    });
    try {
      const blocks = await this.sse.streamSummarizeMessageBlocks(
        summarizeMessages,
        sessionId,
        runId,
        [],
        fallback,
      );
      return serializeMessageBlocksForStorage(blocks);
    } catch (error) {
      this.logger.warn(
        `direct user summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const blocks = [textBlock(fallback)];
      this.sse.emitMessageBlocks(sessionId, runId, blocks, {
        action: 'stream',
        mode: 'full',
      });
      return serializeMessageBlocksForStorage(blocks);
    }
  }

  private resolveSummarizeStepName(
    taskPlan: TaskPlanSnapshot | null | undefined,
    observationName: string,
  ): string {
    const stepId = taskPlan?.currentStepId?.trim();
    if (stepId) {
      return `plan:${stepId}`;
    }
    return observationName;
  }

  private resolveSummarizePromptKey(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    fullDetail: boolean;
    summarizeScenario: ReturnType<typeof classifySummarizeScenario>;
  }): (typeof PROMPT_KEYS)[keyof typeof PROMPT_KEYS] {
    if (isPendingPlanAnswerStep(input.taskPlan)) {
      return PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS;
    }
    if (input.fullDetail) {
      return PROMPT_KEYS.AGENT_SUMMARIZE_TOOL_FULL;
    }
    if (input.summarizeScenario === 'action') {
      return PROMPT_KEYS.AGENT_SUMMARIZE_ACTION;
    }
    return PROMPT_KEYS.AGENT_SUMMARIZE_READ;
  }

  private async summarizeToolOutputForUser(
    toolName: string,
    toolDescription: string | undefined,
    userMessage: string,
    output: unknown,
    fieldLabels: Record<string, string>,
    fieldDescriptions: Record<string, string>,
    enumLabelsByPath: Record<string, Record<string, string>>,
    promptMessages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    scope: { appClientId: number; agentId: number },
    taskPlan?: TaskPlanSnapshot | null,
    agentMetadata?: unknown,
    executedArgs?: Record<string, unknown>,
  ): Promise<string> {
    const fullDetail = isUserRequestingFullDetail(userMessage);
    const toolErrorObs = isAgentToolErrorObservation(output) ? output : null;
    const summarizeScenario =
      isMutationTool(agentMetadata) ||
      classifySummarizeScenario(userMessage) === 'action'
        ? ('action' as const)
        : ('read' as const);
    const planContext = formatPlanContextForSummarize(taskPlan);

    const serialized = this.stringifyForPrompt(output);
    const fieldLabelText = formatFieldLabelsForPrompt(
      fieldLabels,
      enumLabelsByPath,
      fieldDescriptions,
    );
    const agentPrompts = promptMessages.filter(
      (message) =>
        message.role === 'system' && message.content.includes('<agent_prompt>'),
    );
    const ruleBlocks = buildRuleBasedMessageBlocks({
      output,
      userMessage,
      fieldLabels,
    });
    const planAnswerStep = isPendingPlanAnswerStep(taskPlan);
    const summarizeMessages: LlmChatMessage[] = [...agentPrompts];
    if (planAnswerStep || summarizeScenario === 'action') {
      summarizeMessages.push({
        role: 'system',
        content: await this.promptRegistry.render(
          PROMPT_KEYS.PLATFORM_MESSAGE_BLOCKS_SPEC,
          scope,
        ),
      });
    }
    summarizeMessages.push({
      role: 'system',
      content: await this.promptRegistry.render(
        this.resolveSummarizePromptKey({
          taskPlan,
          fullDetail,
          summarizeScenario,
        }),
        scope,
      ),
    });
    const downstreamSourceText =
      toolErrorObs?.responseSource != null
        ? formatResponseSourceForDisplay(toolErrorObs.responseSource)
        : '';
    const mapReduceFetchNote = formatMapReduceFetchStatusNote(output);
    summarizeMessages.push({
      role: 'user',
      content: [
        `User request: ${userMessage}`,
        planContext ? `<plan_context>\n${planContext}\n</plan_context>` : null,
        mapReduceFetchNote ? `Fetch status: ${mapReduceFetchNote}` : null,
        `Tool: ${toolName}`,
        toolDescription ? `Tool description: ${toolDescription}` : null,
        executedArgs && Object.keys(executedArgs).length > 0
          ? `Executed arguments: ${JSON.stringify(executedArgs)}`
          : null,
        fieldLabelText ? `Field labels:\n${fieldLabelText}` : null,
        ruleBlocks.length > 0
          ? `Suggested rule-based blocks (avoid duplicating the same table): ${JSON.stringify(ruleBlocks)}`
          : null,
        toolErrorObs
          ? `Tool error summary: ${toolErrorObs.userHint}${
              toolErrorObs.httpStatus != null
                ? ` (HTTP ${toolErrorObs.httpStatus})`
                : ''
            }`
          : null,
        downstreamSourceText
          ? `Downstream response (source data — base your answer on this, include key fields in the user message):\n${downstreamSourceText}`
          : null,
        `Tool result: ${serialized}`,
      ]
        .filter((line): line is string => line != null && line.length > 0)
        .join('\n'),
    });
    const fallbackPlainText = this.buildSummarizeFallbackPlainText(
      toolName,
      output,
      ruleBlocks,
    );

    try {
      const blocks = await this.sse.streamSummarizeMessageBlocks(
        summarizeMessages,
        sessionId,
        runId,
        ruleBlocks,
        fallbackPlainText,
      );
      return serializeMessageBlocksForStorage(blocks);
    } catch (error) {
      this.logger.warn(
        `tool result summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const fallbackBlocks = mergeSummarizeBlocksForStorage(
      ruleBlocks,
      [],
      fallbackPlainText,
    );
    return serializeMessageBlocksForStorage(fallbackBlocks);
  }

  /** LLM summarize failure fallback: rule blocks or raw payload — no locale-specific templates. */
  private buildSummarizeFallbackPlainText(
    toolName: string,
    output: unknown,
    ruleBlocks: MessageBlock[],
  ): string {
    if (ruleBlocks.length > 0) {
      const fromBlocks = messageBlocksToPlainText(ruleBlocks);
      if (fromBlocks.trim().length > 0) {
        return fromBlocks;
      }
    }
    if (typeof output === 'string') {
      const trimmed = output.trim();
      return trimmed.length > 0 ? trimmed : `[${toolName}] (empty result)`;
    }
    const serialized = this.stringifyForPrompt(output);
    return `[${toolName}]\n${serialized}`;
  }

  private extractToolCalls(message: AIMessage): GraphToolCall[] {
    const value = (message.tool_calls ??
      message.additional_kwargs?.tool_calls ??
      []) as unknown[];
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const row = item as Record<string, unknown>;
        const directName = row.name;
        const directArgs = row.args;
        if (typeof directName === 'string') {
          return {
            name: directName,
            arguments: normalizeToolCallArgs(directArgs),
          };
        }
        const fn = row.function;
        if (!fn || typeof fn !== 'object' || Array.isArray(fn)) {
          return null;
        }
        const fnRow = fn as Record<string, unknown>;
        const name = fnRow.name;
        if (typeof name !== 'string') {
          return null;
        }
        return {
          name,
          arguments: normalizeToolCallArgs(fnRow.arguments),
        };
      })
      .filter((item) => item !== null) as GraphToolCall[];
  }
}
