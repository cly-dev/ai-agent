import { Injectable, Logger } from '@nestjs/common';
import { AIMessage } from '@langchain/core/messages';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { AgentRunStatus } from '../../../../../generated/prisma/client';
import type { Prisma } from '../../../../../generated/prisma/client';
import { normalizeToolCallArgs } from '../../../llm/tool-call-args.util';
import { LlmService } from '../../../llm/llm.service';
import type { LlmChatMessage } from '../../../llm/llm.types';
import {
  extractAgentPromptMessages,
  extractWorkingMemoryMessages,
  joinAgentPromptText,
} from '../prompt-message.util';
import {
  dedupeObservationPayloads,
  formatObservationForLlm,
  isSameObservationPayload,
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
import type { ToolExecutionResult } from '../../../tool-engine/tool-engine.types';
import {
  classifySummarizeScenario,
  isUserRequestingFullDetail,
} from '../user-response-style.util';
import { PROMPT_KEYS } from '../../../prompt/prompt-template.keys';
import { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import {
  formatFieldLabelsForPrompt,
  projectToolOutput,
} from '../../../tool-engine/tool-output-projection.util';
import type { ProjectedToolOutput } from '../../../tool-engine/tool-response-profile.types';
import type { ToolResponseProfile } from '../../../tool-engine/tool-response-profile.types';
import {
  buildToolErrorObservation,
  buildLlmFailureUserMessage,
  extractToolErrorCode,
  extractToolErrorUserHint,
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
  collectWriteConfirmationRequired,
} from '../write-confirmation-gate.util';
import type { WorkingMemoryState } from '../../../memory/session-context.types';
import { WorkingMemoryService } from '../../../memory/working-memory.service';
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
  extractLlmUserFacingText,
} from '../llm-output-sanitize.util';
import {
  areToolCallRoundsIdentical,
  getLastToolRoundFromSteps,
} from '../tool/tool-call-dedupe.util';
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
import { serializeObservationsForPending } from '../agent-write-confirmation.util';
import type {
  AgentEngineTool,
  AgentGraphState,
  AgentLangGraphRunInput,
  AgentRunStep,
  GraphToolCall,
  ParsedIntentPayload,
  PrecheckReasonCode,
  ScopedToolsResult,
  ToolObservation,
} from './agent-engine.types';
import {
  precheckDecisionSchema,
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
    private readonly workingMemoryService: WorkingMemoryService,
    private readonly intentScopeService: IntentScopeService,
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

  private buildWorkingMemoryHintForPrecheck(
    workingMemory: WorkingMemoryState | null,
  ): string {
    if (!workingMemory) {
      return '';
    }
    const parts: string[] = [];
    if (workingMemory.lastToolSummary?.trim()) {
      parts.push(`lastToolSummary=${workingMemory.lastToolSummary.trim()}`);
    }
    const facts = Array.isArray(workingMemory.facts)
      ? workingMemory.facts
          .filter((item) => item && item.key && item.value)
          .slice(-6)
          .map((item) => `${item.key}: ${item.value}`)
      : [];
    if (facts.length > 0) {
      parts.push(`facts=${facts.join(' | ')}`);
    }
    return parts.join('; ');
  }

  private buildWorkingMemoryObservationForSummary(
    workingMemory: WorkingMemoryState | null,
  ): ToolObservation | null {
    if (!workingMemory) {
      return null;
    }
    const facts = Array.isArray(workingMemory.facts)
      ? workingMemory.facts.slice(-10)
      : [];
    const entities =
      workingMemory.entities &&
      typeof workingMemory.entities === 'object' &&
      !Array.isArray(workingMemory.entities)
        ? workingMemory.entities
        : {};
    if (!workingMemory.lastToolSummary?.trim() && facts.length === 0) {
      return null;
    }
    return {
      name: 'working_memory',
      output: {
        summary: workingMemory.lastToolSummary ?? '',
        facts,
        entities,
        updatedAt: workingMemory.updatedAt,
      },
      quality: 'medium',
    };
  }

  /** 主推理调用：Agent → Memory → Observations → Tool schema → User。 */
  private buildLlmInvokeMessages(
    promptMessages: LlmChatMessage[],
    observations: ToolObservation[],
    latestUserMessage: string,
    toolSchemaJson: string,
    toolDecisionPrompt: string,
    messageTokenBudget: number,
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

    for (const item of extractWorkingMemoryMessages(promptMessages)) {
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
        content: `<observations>\n${serializeObservationsBlock(observationPayloads)}\n</observations>`,
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

    const pinnedUser = this.buildPinnedUserRequestMessage(latestUserMessage);
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

  private buildPinnedUserRequestMessage(
    latestUserMessage: string,
  ): LlmChatMessage | null {
    const trimmed = latestUserMessage.trim();
    if (!trimmed) {
      return null;
    }
    return {
      role: 'user',
      content: `<current_user_request>\n${trimmed}\n</current_user_request>`,
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
    const toolDecision = await this.promptRegistry.render(
      PROMPT_KEYS.AGENT_TOOL_DECISION,
      scope,
      variables,
    );
    if (toolDecision.trim().length > 0) {
      return toolDecision;
    }
    return this.promptRegistry.render(
      PROMPT_KEYS.AGENT_DECISION_LOOP,
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

  private sanitizeFinalOutput(value: string): string {
    return sanitizeStoredFinalOutput(value);
  }
  async run(input: AgentLangGraphRunInput): Promise<AgentGraphState> {
    const promptScope = {
      appClientId: input.appClientId,
      agentId: input.agentId,
    };

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
      if (state.toolObservations.length > 0) {
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
    });
    // 节点0：前置短路检查。仅在已有 observation 时，借助 LLM 判断是否可直接进入 summarize。
    const preCheck = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const step = state.steps.length + 1;
      const workingMemory = await this.workingMemoryService.get(input.sessionId);
      const workingMemoryHint = this.buildWorkingMemoryHintForPrecheck(workingMemory);
      // 仅按 working memory 决定是否触发 precheck。
      if (!workingMemoryHint) {
        return state;
      }

      try {
        const startedAt = Date.now();
        const precheckPrompt = await this.promptRegistry.render(
          PROMPT_KEYS.AGENT_PRECHECK_HISTORY_ANSWERABLE,
          promptScope,
        );
        const precheckMessages: LlmChatMessage[] = [
          {
            role: 'system',
            content: precheckPrompt,
          },
          {
            role: 'user',
            content: [
              `Latest user message: ${input.latestUserMessage}`,
              `Working memory hints: ${workingMemoryHint || 'none'}`,
            ].join('\n'),
          },
        ];
        let modelName: string | undefined;
        let parsedAnswerable: boolean | undefined;
        let reason: string | null = null;
        try {
          const { model } = await this.llmService.createLangChainChatModelForMessages(
            precheckMessages,
          );
          const structuredModel = model.withStructuredOutput(precheckDecisionSchema);
          const structured = await structuredModel.invoke(precheckMessages);
          parsedAnswerable = structured.answerableFromObservation;
          reason =
            typeof structured.reason === 'string' ? structured.reason : null;
        } catch {
          const precheckResult = await this.llmService.chat({
            messages: precheckMessages,
            tools: [],
          });
          modelName = precheckResult.model;
          const parsed = this.tryParseJsonObject(precheckResult.content);
          if (typeof parsed?.['answerableFromObservation'] === 'boolean') {
            parsedAnswerable = parsed['answerableFromObservation'];
          }
          reason = typeof parsed?.['reason'] === 'string' ? parsed['reason'] : null;
        }
        const latency = Date.now() - startedAt;
        const answerableFromObservation =
          typeof parsedAnswerable === 'boolean'
            ? parsedAnswerable
            : false;
        const reasonCode: PrecheckReasonCode =
          typeof parsedAnswerable !== 'boolean'
            ? 'PRECHECK_PARSE_FAILED'
            : answerableFromObservation
              ? 'HISTORY_SUFFICIENT'
              : 'HISTORY_INSUFFICIENT';
        const chosenObservation = answerableFromObservation
          ? this.pickObservationForFinalSummary(state.toolObservations) ??
            this.buildWorkingMemoryObservationForSummary(workingMemory)
          : null;
        const precheckStep: AgentRunStep = {
          step,
          type: 'precheck',
          output: this.normalizeJsonLike({
            precheck: true,
            answerableFromObservation,
            reasonCode,
            reason,
            observationCount: state.toolObservations.length,
            selectedObservationName: chosenObservation?.name ?? null,
          }),
          meta: {
            model: modelName,
            latency,
            code: reasonCode,
          },
        };
        const steps = [...state.steps, precheckStep];
        await this.updateRun(input.runId, steps, state.iteration, AgentRunStatus.running);
        return {
          ...state,
          steps,
          pendingSummaryObservation: chosenObservation,
        };
      } catch (error) {
        const precheckStep: AgentRunStep = {
          step,
          type: 'precheck',
          output: this.normalizeJsonLike({
            precheck: true,
            answerableFromObservation: false,
            reasonCode: 'PRECHECK_LLM_FAILED',
            reason:
              error instanceof Error ? error.message : 'precheck llm call failed',
            observationCount: state.toolObservations.length,
            selectedObservationName: null,
          }),
          meta: {
            code: 'PRECHECK_LLM_FAILED',
          },
        };
        const steps = [...state.steps, precheckStep];
        await this.updateRun(input.runId, steps, state.iteration, AgentRunStatus.running);
        this.logger.warn(
          `precheck failed runId=${input.runId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        // 失败时兜底走原流程（intent），不阻断主链路。
        return {
          ...state,
          steps,
        };
      }
    };

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
          recallScore: resolved.recallScore,
          recallMatches: resolved.recallMatches,
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
        intentKind: 'task',
        scopedTools: resolved.scopedTools,
        scopedLangChainTools: resolved.scopedToolBundle.tools,
        scopedToolBundle: resolved.scopedToolBundle,
        scopedAllowedToolIds: resolved.scopedAllowedToolIds,
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
        return buildNoIntentSummarizeState(state, [...state.steps, intentStep]);
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
        intentKind: 'task',
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
      const step = graphState.iteration + 1;
      try {
        const toolsForPrompt = graphState.scopedTools;
        const decision = await this.buildDecisionPrompt(
          input.promptMessages,
          toolsForPrompt,
          graphState.toolObservations,
          input.enableToolCall,
          promptScope,
          graphState.activeSkillPrompt,
        );
        const { messages: invokeMessages, trimMeta } = this.buildLlmInvokeMessages(
          input.promptMessages,
          graphState.toolObservations,
          input.latestUserMessage,
          decision.toolSchemaJson,
          decision.toolDecisionPrompt,
          input.messageTokenBudget,
        );
        const promptDebugFile = emitLlmPromptDebug(
          (message) => this.logger.log(message),
          {
            runId: input.runId,
            sessionId: input.sessionId,
            phase: 'decision',
            step,
            iteration: graphState.iteration,
            messageTokenBudget: input.messageTokenBudget,
            meta: {
              enableToolCall: input.enableToolCall,
              scopedToolCount: graphState.scopedTools.length,
              observationCount: graphState.toolObservations.length,
              estimatedTokens: trimMeta.estimatedTokensAfter,
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
        const runnable = input.enableToolCall
          ? model.bindTools(graphState.scopedLangChainTools as unknown[])
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
        const toolCalls = input.enableToolCall
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
          ...graphState.steps,
          {
            step,
            type: 'llm' as const,
            output: this.normalizeJsonLike({
              content: llmText,
              toolCalls,
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
              userRequest: input.latestUserMessage,
            },
          },
        ];
        await this.updateRun(input.runId, steps, step, AgentRunStatus.running);
        if (toolCalls.length > 0) {
          const lastToolRound = getLastToolRoundFromSteps(graphState.steps);
          if (areToolCallRoundsIdentical(toolCalls, lastToolRound)) {
            const observation = this.mergeObservationsForSummary(
              graphState.toolObservations,
            );
            if (observation) {
              const dedupeSteps = [
                ...steps.slice(0, -1),
                {
                  ...steps[steps.length - 1],
                  output: this.normalizeJsonLike({
                    content: llmText,
                    toolCalls,
                    duplicateToolCallsSkipped: true,
                  }),
                },
              ];
              await this.updateRun(
                input.runId,
                dedupeSteps,
                step,
                AgentRunStatus.running,
              );
              this.sse.emitThink(
                input.sessionId,
                input.runId,
                '检测到与上一轮完全相同的工具调用，强制汇总已有结果…\n',
                'delta',
              );
              return {
                ...graphState,
                iteration: step,
                steps: dedupeSteps,
                pendingToolCalls: [],
                pendingSummaryObservation: observation,
              };
            }
          }
        }
        if (toolCalls.length === 0) {
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
          const completion = this.resolveLlmCompletionAfterTools(
            input.latestUserMessage,
            llmText || emptyReply,
            graphState.toolObservations,
          );
          return {
            ...graphState,
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
          ...graphState,
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
    // 节点3：工具执行节点。并行执行同轮 tool_calls，统一汇总后回到 llm。
    const tools = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const nextSteps = [...state.steps];
      const observations = [...state.toolObservations];
      if (state.pendingToolCalls.length > 0) {
        const lastToolRound = getLastToolRoundFromSteps(state.steps);
        if (areToolCallRoundsIdentical(state.pendingToolCalls, lastToolRound)) {
          const observation = this.mergeObservationsForSummary(observations);
          this.sse.emitThink(
            input.sessionId,
            input.runId,
            '检测到与上一轮完全相同的工具调用，强制汇总已有结果…\n',
            'delta',
          );
          const skipSteps: AgentRunStep[] = state.pendingToolCalls.map(
            (toolCall) => ({
              step: state.iteration,
              type: 'tool',
              name: toolCall.name,
              input: toolCall.arguments,
              output: this.normalizeJsonLike({
                skipped: true,
                reason: 'duplicate_tool_call_round',
              }),
            }),
          );
          const mergedSteps = [...nextSteps, ...skipSteps];
          await this.updateRun(
            input.runId,
            mergedSteps,
            state.iteration,
            AgentRunStatus.running,
          );
          if (observation) {
            return {
              ...state,
              steps: mergedSteps,
              toolObservations: observations,
              pendingToolCalls: [],
              pendingSummaryObservation: observation,
            };
          }
          return {
            ...state,
            steps: mergedSteps,
            toolObservations: observations,
            pendingToolCalls: [],
            pendingSummaryObservation: null,
          };
        }
      }
      const writeCalls = collectWriteConfirmationRequired(
        state.pendingToolCalls,
        state.scopedTools,
      );
      const approvedNames = new Set(input.approvedWriteToolNames ?? []);
      const writeCallsNeedingConfirm = writeCalls.filter(
        (call) => !approvedNames.has(call.name),
      );
      if (writeCallsNeedingConfirm.length > 0) {
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
            pendingToolCalls: [],
            awaitingWriteConfirmation: true,
            finalOutput: message,
            status: AgentRunStatus.success,
            finished: true,
          };
      }

      for (const toolCall of state.pendingToolCalls) {
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          `\n正在调用工具：${toolCall.name}\n`,
          'delta',
        );
      }
      const langChainBundle =
        state.scopedToolBundle ??
        this.toolEngine.buildLangChainTools(state.scopedTools, {
          userId: input.userId,
          allowedToolIds: state.scopedAllowedToolIds,
        });
      const toolResults = await Promise.all(
        state.pendingToolCalls.map((toolCall) =>
          this.invokeToolSafely(
            langChainBundle,
            state.scopedTools,
            toolCall,
          ),
        ),
      );
      const projectedToolResults: Array<{
        name: string;
        input: Record<string, unknown>;
        latency: number;
        projected: ProjectedToolOutput;
      }> = [];

      for (let idx = 0; idx < toolResults.length; idx += 1) {
        const toolResult = toolResults[idx];
        const toolCall = state.pendingToolCalls[idx];
        const profile = state.toolProfilesByName[toolResult.name] ?? null;

        const projected = projectToolOutput(
          toolResult.output,
          input.latestUserMessage,
          profile,
        );
        projectedToolResults.push({
          name: toolResult.name,
          input: toolCall.arguments,
          latency: toolResult.latency,
          projected,
        });
        const llmPayload = formatObservationForLlm({
          toolName: toolResult.name,
          output: projected.data,
          fieldLabels: projected.fieldLabels,
        });
        const nextObservation: ToolObservation = {
          name: toolResult.name,
          output: projected.data,
          llmPayload,
          quality: this.assessObservationQuality(projected.data),
          fieldLabels: projected.fieldLabels,
          fieldDescriptions: projected.fieldDescriptions,
          enumLabelsByPath: projected.enumLabelsByPath,
        };
        const duplicateObservationIndex = observations.findIndex(
          (row) =>
            row.llmPayload != null &&
            isSameObservationPayload(row.llmPayload, llmPayload),
        );
        if (duplicateObservationIndex >= 0) {
          observations[duplicateObservationIndex] = nextObservation;
        } else {
          observations.push(nextObservation);
        }
        const quality = this.assessObservationQuality(projected.data);
        const toolCode = this.resolveToolStepCode(quality, projected.data);
        nextSteps.push({
          step: state.iteration,
          type: 'tool',
          name: toolResult.name,
          input: toolCall.arguments,
          output: this.normalizeJsonLike(projected.data),
          meta: { latency: toolResult.latency, quality, code: toolCode ?? undefined },
        });
        recordMachineCodeUsage(input.runMetrics, toolCode);
        recordToolUsage(input.runMetrics, {
          name: toolResult.name,
          latencyMs: toolResult.latency,
          quality,
        });
        const toolFailed = isAgentToolErrorObservation(toolResult.output);
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          toolFailed
            ? `工具 ${toolCall.name} 未能返回可用数据\n`
            : `工具 ${toolCall.name} 调用完成\n`,
          'delta',
        );
      }

      await this.updateRun(
        input.runId,
        nextSteps,
        state.iteration,
        AgentRunStatus.running,
      );

      const failedObservation = observations.find((row) =>
        isAgentToolErrorObservation(row.output),
      );
      const shouldExpandOnce =
        !state.skillApplied &&
        !state.hasExpandedOnce &&
        state.iteration <= 1 &&
        state.scopedTools.length < input.tools.length &&
        state.pendingToolCalls.length === 1 &&
        this.isLowQualityToolObservation(observations[observations.length - 1]);
      if (shouldExpandOnce) {
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
            fallbackReason: 'low_quality_first_result_expand_once',
            toolsBeforeExpand: state.scopedTools.length,
            toolsAfterExpand: input.tools.length,
          }),
        };
        const expandedSteps = [...nextSteps, expandedStep];
        await this.updateRun(
          input.runId,
          expandedSteps,
          state.iteration,
          AgentRunStatus.running,
        );
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          '首轮结果信息不足，正在放宽工具范围再尝试一次…\n',
          'delta',
        );
        return {
          ...state,
          steps: expandedSteps,
          toolObservations: observations,
          pendingToolCalls: [],
          pendingSummaryObservation: null,
          scopedTools: input.tools,
          scopedLangChainTools: expandedBundle.tools,
          scopedToolBundle: expandedBundle,
          scopedAllowedToolIds: allToolIds,
          hasExpandedOnce: true,
        };
      }
      if (
        failedObservation &&
        state.pendingToolCalls.length === 1 &&
        projectedToolResults.length === 1
      ) {
        return {
          ...state,
          steps: nextSteps,
          toolObservations: observations,
          pendingToolCalls: [],
          pendingSummaryObservation: failedObservation,
        };
      }

      return {
        ...state,
        steps: nextSteps,
        // 一律回 llm：是否再调 tool、何时 summarize 由决策环 + resolveLlmCompletionAfterTools 决定。
        toolObservations: observations,
        pendingToolCalls: [],
        pendingSummaryObservation: null,
      };
    };
     // 节点4：汇总节点。将本轮工具执行结果汇总为最终答案。
    const summarize = async (
      state: AgentGraphState,
    ): Promise<AgentGraphState> => {
      if (!state.pendingSummaryObservation) {
        return state;
      }
      const toolErrorHint = extractToolErrorUserHint(
        state.pendingSummaryObservation.output,
      );
      if (toolErrorHint) {
        const errorBlocks = buildRuleBasedMessageBlocks({
          output: state.pendingSummaryObservation.output,
          userMessage: input.latestUserMessage,
          fieldLabels: {},
          toolErrorHint,
        });
        const stored = serializeMessageBlocksForStorage(errorBlocks);
        const summaryStep: AgentRunStep = {
          step: state.iteration + 1,
          type: 'summarize',
          name: state.pendingSummaryObservation.name,
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
          finalOutput: stored,
          status: AgentRunStatus.success,
          finished: true,
        };
      }
      const toolDef = state.scopedTools.find(
        (tool) => tool.name === state.pendingSummaryObservation?.name,
      );
      const summarized =
        state.pendingSummaryObservation.name === 'direct_user' ||
        state.pendingSummaryObservation.name === 'smalltalk'
          ? await this.summarizeDirectUserMessage(
              input.latestUserMessage,
              state.pendingSummaryObservation.output,
              input.promptMessages,
              input.sessionId,
              input.runId,
              promptScope,
            )
          : state.pendingSummaryObservation.name === 'direct_reply'
            ? await this.summarizeDirectLlmReply(
                input.latestUserMessage,
                state.pendingSummaryObservation.output,
                input.promptMessages,
                input.sessionId,
                input.runId,
                promptScope,
              )
            : await this.summarizeToolOutputForUser(
              state.pendingSummaryObservation.name,
              toolDef?.description,
              input.latestUserMessage,
              state.pendingSummaryObservation.output,
              state.pendingSummaryObservation.fieldLabels ?? {},
              state.pendingSummaryObservation.fieldDescriptions ?? {},
              state.pendingSummaryObservation.enumLabelsByPath ?? {},
              input.promptMessages,
              input.sessionId,
              input.runId,
              promptScope,
            );
      if (!summarized || summarized.trim().length === 0) {
        const fallback = messageBlocksToPlainText(
          ensureAtLeastOneTextBlock([], '抱歉，我暂时无法整理出有效回复。'),
        );
        this.logger.warn(
          `summarize returned empty runId=${input.runId} observation=${state.pendingSummaryObservation.name}`,
        );
        const summaryStep: AgentRunStep = {
          step: state.iteration + 1,
          type: 'summarize',
          name: state.pendingSummaryObservation.name,
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
        name: state.pendingSummaryObservation.name,
        output: stepPlain,
      };
      const nextSteps = [...state.steps, summaryStep];
      await this.updateRun(
        input.runId,
        nextSteps,
        state.iteration,
        AgentRunStatus.running,
      );
      return {
        ...state,
        steps: nextSteps,
        pendingSummaryObservation: null,
        finalOutput: storedSummarized,
        status: AgentRunStatus.success,
        finished: true,
      };
    };
    // 图路由：
    // START -> preCheck -> skill -> intent -> (类目命中 ? llm : summarize) -> tools ...
    // intent：类目 Top-K → 按类目过滤 →（过滤后 >5 则工具 bind 召回，否则全量 bind）→ llm
    // 类目未命中：summarize（系统不支持），跳过 LLM。
    // skill 命中：跳过 intent，直连 llm。
    const graph = new StateGraph(State)
      .addNode('intent', intent)
      .addNode('llm', llm)
      .addNode('tools', tools)
      .addNode('summarize', summarize)
      .addNode('preCheck', preCheck)
      .addNode('skill', skill)
      .addEdge(START, input.resumeFromLlm ? 'llm' : 'preCheck')
      .addConditionalEdges('preCheck', (s: AgentGraphState) => {
        if (s.finished) {
          return END;
        }
        if (s.pendingSummaryObservation) {
          return 'summarize';
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
          return 'llm';
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
        return 'llm';
      })
      .addConditionalEdges('llm', (state: AgentGraphState) => {
        if (state.finished) {
          return END;
        }
        if (state.pendingSummaryObservation) {
          return 'summarize';
        }
        return 'tools';
      })
      .addConditionalEdges('tools', (state: AgentGraphState) => {
        if (state.finished) {
          return END;
        }
        if (state.pendingSummaryObservation) {
          return 'summarize';
        }
        if (state.iteration >= input.maxSteps) {
          return END;
        }
        return 'llm';
      })
      .addConditionalEdges('summarize', (state: AgentGraphState) => {
        if (state.finished) {
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
    };
    const initial = input.graphInitialState
      ? { ...defaultInitial, ...input.graphInitialState }
      : defaultInitial;
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
  ): 'high' | 'medium' | 'low' {
    return this.assessObservationQuality(output);
  }

  private assessObservationQuality(output: unknown): 'high' | 'medium' | 'low' {
    if (isAgentToolErrorObservation(output)) {
      return 'low';
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
  ): AgentMachineCode | null {
    if (isAgentToolErrorObservation(output)) {
      return extractToolErrorCode(output);
    }
    if (isEmptyListToolObservation(output)) {
      return null;
    }
    if (quality === 'low') {
      return 'TOOL_EMPTY_RESULT';
    }
    return null;
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

  private pickObservationForFinalSummary(
    observations: ToolObservation[],
  ): ToolObservation | null {
    return this.mergeObservationsForSummary(observations);
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
  ): Promise<string> {
    const guidanceHint = this.extractDirectUserGuidanceHint(output);
    const fallback = guidanceHint || 'Hello! How can I help you?';
    const agentPrompts = promptMessages.filter(
      (message) =>
        message.role === 'system' && message.content.includes('<agent_prompt>'),
    );
    const summarizeMessages: LlmChatMessage[] = [
      ...agentPrompts,
      {
        role: 'system',
        content: await this.promptRegistry.render(
          guidanceHint
            ? PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS
            : PROMPT_KEYS.AGENT_SUMMARIZE_SMALLTALK,
          scope,
        ),
      },
      {
        role: 'user',
        content: guidanceHint
          ? [`User request: ${userMessage}`, `Guidance: ${guidanceHint}`].join(
              '\n',
            )
          : userMessage,
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
  ): Promise<string> {
    const fullDetail = isUserRequestingFullDetail(userMessage);
    const summarizeScenario = classifySummarizeScenario(userMessage);

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
    const summarizeMessages: LlmChatMessage[] = [
      ...agentPrompts,
      {
        role: 'system',
        content: await this.promptRegistry.render(
          fullDetail
            ? PROMPT_KEYS.AGENT_SUMMARIZE_TOOL_FULL
            : summarizeScenario === 'action'
              ? PROMPT_KEYS.AGENT_SUMMARIZE_ACTION
              : PROMPT_KEYS.AGENT_SUMMARIZE_READ,
          scope,
        ),
      },
      {
        role: 'user',
        content: [
          `User request: ${userMessage}`,
          `Tool: ${toolName}`,
          toolDescription ? `Tool description: ${toolDescription}` : null,
          fieldLabelText ? `Field labels:\n${fieldLabelText}` : null,
          ruleBlocks.length > 0
            ? `Suggested rule-based blocks (avoid duplicating the same table): ${JSON.stringify(ruleBlocks)}`
            : null,
          `Tool result: ${serialized}`,
        ]
          .filter((line): line is string => line != null && line.length > 0)
          .join('\n'),
      },
    ];
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

  private async invokeToolSafely(
    bundle: BuiltLangChainTools,
    scopedTools: AgentEngineTool[],
    toolCall: GraphToolCall,
  ): Promise<ToolExecutionResult> {
    const startedAt = Date.now();
    try {
      return await this.toolEngine.invokeLangChainTool(
        bundle,
        toolCall.name,
        toolCall.arguments,
      );
    } catch (error) {
      const def = scopedTools.find((tool) => tool.name === toolCall.name);
      this.logger.warn(
        `tool invoke failed name=${toolCall.name}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        toolId: def?.id ?? 0,
        name: toolCall.name,
        input: toolCall.arguments,
        output: buildToolErrorObservation(error),
        latency: Date.now() - startedAt,
      };
    }
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
