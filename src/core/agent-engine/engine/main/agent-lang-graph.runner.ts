import { Injectable, Logger } from '@nestjs/common';
import { AIMessage } from '@langchain/core/messages';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import {
  AgentRunStatus,
  type Prisma,
  type ToolLevel,
} from '../../../../../generated/prisma/client';
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
  formatSplitObservationsPromptBlock,
  formatSplitToolObservationsForSummarize,
  isSplitToolObservationsOutput,
  resolvePrimaryObservationForSummarize,
  SPLIT_TOOL_OBSERVATIONS_NAME,
  type SplitToolObservationsOutput,
  toolObservationsToPayloads,
} from '../observation-format.util';
import { estimateMessagesTokens } from '../../../llm/message-token-budget.util';
import { summarizeToolsForLlmSchema } from '../tool/tool-schema-compact.util';
import {
  ToolEngineService,
  type ToolBuildContext,
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
  filterSchemaValidWriteConfirmationCalls,
} from '../write-confirmation-gate.util';
import {
  buildMutationPreviewMarkdownFromWriteCalls,
  buildMutationArgsInvalidUserMessage,
  buildMutationPreviewUnavailableUserMessage,
  hasUserVisibleMutationPreview,
} from '../mutation-preview-before-gate.util';
import { SessionGoaService } from '../../../memory/goa/session-goa.service';
import { SessionResumeGateService } from '../../../memory/resume/session-resume-gate.service';
import type { SessionGoaPayload } from '../../../memory/goa/session-goa.types';
import { CategoryIntentRecallService } from '../../../intent/category-intent-recall.service';
import {
  recordLlmUsage,
  recordMachineCodeUsage,
} from '../run-metrics.util';
import type { MessageBlock } from '../message/message-blocks.types';
import {
  buildRuleBasedMessageBlocks,
  ensureAtLeastOneTextBlock,
  filterLlmBlocksAvoidDuplicatingRule,
  isStructuredMessageBlock,
  mergeSummarizeBlocksForStorage,
  messageBlocksToPlainText,
  sanitizeStoredFinalOutput,
  serializeMessageBlocksForStorage,
  textBlock,
  tryParseStoredMessageBlocks,
} from '../message/message-blocks.util';
import { emitAgentMessageSseDebug } from '../message/message-blocks-debug.util';
import { isEmptyListToolObservation } from '../tool/tool-observation.util';
import {
  allToolObservations,
  mergeRunRoundObservations,
  preloadedToolObservations,
  runOwnedToolObservations,
  splitToolObservationsFromState,
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
import {
  mergeConfirmedPreviewWithExecutionStatus,
  parseConfirmedPreviewBlocks,
} from '../write-confirm-resume-blocks.util';
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
  type ResultCheckOutcome,
  resolvePostToolsResultCheck,
  resolvePreToolsResultCheck,
  resolveSummaryObservationForCheck,
} from '../tool/tool-result-check.util';
import {
  resolveResultCheckPlanFallback,
  resolveSkillStepPendingToolCalls,
  type ResultCheckRouteAuthority,
} from '../tool/result-check-route.util';
import {
  isTerminalPlanToolError,
  shouldAbortPlanOnRecoverableSameArgs,
  shouldAbortPlanOnTerminalToolError,
} from '../tool/tool-plan-error.util';
import {
  extractLlmUserFacingText,
} from '../llm-output-sanitize.util';
import { detectIntentKind as classifyIntentKind } from '../../intent-kind.util';
import { loadSmallTalkHints } from '../../../intent/smalltalk-hints.util';
import { isUserIntentClear as isUserIntentMessageClear } from '../../../intent/intent-scope.util';
import {
  emitLlmPromptDebug,
  isLlmPromptDebugEnabled,
} from '../llm-prompt-debug.util';
import { AgentRunSseEmitter } from './agent-run-sse.emitter';
import { RunAssistantArtifactStore } from './run-assistant-artifact.store';
import { AgentSessionScopeService } from './agent-session-scope.service';
import { SkillService } from '../../../skill/skill.service';
import {
  buildDecisionUserFrame,
  buildPlanSummarizeObservation,
  filterScopedToolsForPlanStep,
  formatPlanContextForSummarize,
  getPendingPlanStep,
  getPendingPlanToolStep,
  isPendingPlanAnswerStep,
  resolveSummarizeUserMessageForPlan,
  finalizePlanAfterSummarize,
  isPlanToolStepSatisfiedByObservations,
  advancePlanAfterStepComplete,
  isPlanComposeWriteStep,
  isPlanWriteFallbackStep,
  resolveTaskPlanAdvance,
  resolveTaskPlanInitialAdvance,
  shouldContinuePlanAfterSummarize,
  summarizeScopedToolsForPlan,
} from './task-plan.util';
import {
  syncTaskPlanBeforeReAct,
  toPlanSyncAgentStep,
  type PlanSyncSite,
} from './plan-sync.util';
import type { TaskPlanAdvanceResult } from './task-plan.types';
import { expandPendingSkillStepIfNeeded } from './skill-frame-expand.util';
import { RequestedSkillRunService } from './requested-skill-run.service';
import type { RequestedSkillRunContext } from './requested-skill-run.service';
import { resolveSkillContextFromPlan } from './plan-stack.util';
import { summarizeAvailableSkillsForOuterPlan } from './outer-plan-skills.util';
import { resolveOuterPlan } from './task-plan-llm.util';
import {
  planObservationBucketsFromState,
  planRunContextFromState,
  resolveInitialPlanRunContext,
  selectObservationsForPagedGatherResume,
  selectObservationsForPlanToolSatisfaction,
} from './plan-observation-scope.util';
import {
  applyPlanDraftToWriteToolCalls,
  buildPlanDraftReplyObservation,
  resolvePlanSubmitTextForWrite,
} from './plan-draft-reply.util';
import {
  buildPlanPresentUserLayer,
  enrichPlanPresentDisplayForGate,
  isPlanDraftSummarizeBeforeWrite,
  isUsablePlanDraftUserFacingDraft,
  isUsablePlanMutationPreviewDraft,
  resolveComposedWriteGateCall,
  resolvePlanDraftReplyContentForGateObservation,
  resolvePendingWriteForPlanWriteStep,
  type PlanPresentSummarizeResult,
} from './plan-draft-summarize.util';
import {
  buildPlanDraftSummarizeUserContent,
  invokePlanDraftProseSupplement,
  invokePlanPresentFromCompose,
  renderPlanPresentFromComposeSystemPrompt,
} from './plan-draft-summarize-llm.util';
import {
  buildPlanComposeWriteObservation,
  pickComposeWriteToolCall,
  prepareComposeWriteToolCall,
  buildReadToolObservationMatcher,
  patchLatestPlanComposeWriteObservation,
  resolveLatestPlanComposeWrite,
  type PlanComposeWriteObservationOutput,
} from './plan-compose-write.util';
import { buildPlanSessionWorkingMemory } from './session-goa-plan-projection.util';
import {
  maxRunStepNumber,
  nextRunStepNumber,
} from './agent-run-steps.util';
import {
  applySummarizeMemoryScope,
  resolveSummarizeMemoryScope,
} from './summarize-memory-scope.util';
import { shouldRouteToRespond } from '../turn/turn-graph.util';
import {
  evaluateExecutionReadiness,
  summarizeSessionObservationsForReadiness,
} from '../turn/turn-readiness.util';
import {
  CLARIFICATION_REQUEST_OBSERVATION_NAME,
  hasPendingRespond,
  isTerminalTurnRespondPending,
  pendingRespondFromObservation,
  pendingRespondFromTurn,
  resolveObservationForSummarize,
} from '../turn/turn-respond.util';
import type { TurnRespondRequest } from '../turn/turn-respond.types';
import type { TaskPlanSnapshot } from './task-plan.types';
import { fromStoredTaskPlan } from './session-graph-resume.util';
import { serializeObservationsForPending } from '../agent-write-confirmation.util';
import {
  extractSubmitTextFromDraftReply,
  extractSubmitTextFromWriteArguments,
  normalizeWriteToolArguments,
  injectDraftIntoWriteToolArguments,
  writeToolArgsContainSubmitText,
} from '../../../tool-engine/write-tool-draft-injection.util';
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
    private readonly assistantArtifact: RunAssistantArtifactStore,
    private readonly goaService: SessionGoaService,
    private readonly resumeGate: SessionResumeGateService,
    private readonly categoryIntentRecall: CategoryIntentRecallService,
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
    private readonly chatEvents: ChatEventsService,
    private readonly sessionScope: AgentSessionScopeService,
    private readonly skillService: SkillService,
    private readonly requestedSkillRun: RequestedSkillRunService,
  ) {}

  /** gate 阻断时向用户推送 draft 说明，并写入 artifact 供后续检测。 */
  private publishMutationGateBlockedDraft(
    sessionId: string,
    runId: number,
    turnId: number,
    message: string,
  ): void {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }
    const artifactTurnId =
      this.assistantArtifact.peekTurnId(sessionId, runId) ?? turnId;
    const blocks = this.sse.publishAssistantBlocks(
      sessionId,
      runId,
      [textBlock(trimmed, 'markdown')],
      { turnId: artifactTurnId, phase: 'draft' },
    );
    if (blocks.length === 0) {
      this.assistantArtifact.commit(
        sessionId,
        runId,
        [textBlock(trimmed, 'markdown')],
        'draft',
      );
    }
  }

  /** graph 内 finalOutput 与 artifact 对齐，避免双源漂移。 */
  private graphFinalOutputFromArtifact(
    sessionId: string,
    runId: number,
    continuePlan: boolean,
    previousFinalOutput: string,
  ): string {
    if (continuePlan) {
      return previousFinalOutput;
    }
    return (
      this.assistantArtifact.peekSerialized(sessionId, runId) ??
      previousFinalOutput
    );
  }

  /** summarize 定稿后 step / finalOutput 均以 artifact 为准（与 SSE full、落库一致）。 */
  private resolveAssistantOutputFromArtifact(
    sessionId: string,
    runId: number,
    fallbackSerialized: string,
  ): { serialized: string; stepPlain: string } {
    return this.assistantArtifact.formatOutput(
      sessionId,
      runId,
      fallbackSerialized,
    );
  }

  private async updateRun(
    runId: number,
    steps: AgentRunStep[],
    status: AgentRunStatus,
  ): Promise<void> {
    await this.prisma.agentRun.update({
      where: { id: runId },
      data: {
        steps: steps as unknown as Prisma.InputJsonValue,
        currentStep: maxRunStepNumber(steps),
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
    observationSplit: SplitToolObservationsOutput,
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

    const observationBlock = formatSplitObservationsPromptBlock({
      workingMemory: toolObservationsToPayloads(
        observationSplit.workingMemory,
        'session',
      ),
      currentRun: toolObservationsToPayloads(
        observationSplit.currentRun,
        'current_run',
      ),
    });
    if (
      observationSplit.workingMemory.length > 0 ||
      observationSplit.currentRun.length > 0
    ) {
      messages.push({
        role: 'assistant',
        content: observationBlock,
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
      observationCount:
        observationSplit.workingMemory.length +
        observationSplit.currentRun.length,
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
  private appendPlanStepDecisionHint(
    toolDecisionPrompt: string,
    taskPlan: TaskPlanSnapshot | null | undefined,
  ): string {
    const step = getPendingPlanToolStep(taskPlan);
    if (isPlanComposeWriteStep(step)) {
      return `${toolDecisionPrompt}\n\n<plan_step_override>
COMPOSE_WRITE step: emit exactly ONE bound write tool_call with all required parameters from <tool_schema> (identifiers, headers, enums) and the full submit body from read observations.
This overrides skill "wait for draft" and generic "empty tool_calls when no draft" rules.
plan_compose_write / plan_draft_reply are runtime observations — NOT callable tools.
</plan_step_override>`;
    }
    if (isPlanWriteFallbackStep(step)) {
      return `${toolDecisionPrompt}\n\n<plan_step_override>
WRITE fallback step: call ONLY tools listed in <tool_schema>.
If plan_compose_write summary exists, copy its pendingWriteTool + arguments verbatim — do not invent new reply text.
NEVER emit tool_calls to plan_compose_write, plan_draft_reply, or any observation name.
</plan_step_override>`;
    }
    return toolDecisionPrompt;
  }

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
    observationSplit: SplitToolObservationsOutput,
    enableToolCall: boolean,
    scope: { appClientId: number; agentId: number },
    activeSkillPrompt?: string | null,
    taskPlan?: TaskPlanSnapshot | null,
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
    toolDecisionPrompt = this.appendPlanStepDecisionHint(
      toolDecisionPrompt,
      taskPlan,
    );
    return {
      toolDecisionPrompt,
      toolSchemaJson: JSON.stringify(toolSchema),
      observationsJson: formatSplitObservationsPromptBlock({
        workingMemory: toolObservationsToPayloads(
          observationSplit.workingMemory,
          'session',
        ),
        currentRun: toolObservationsToPayloads(
          observationSplit.currentRun,
          'current_run',
        ),
      }),
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
        skillId: step.skillId ?? null,
        toolRole: step.toolRole ?? null,
        objective: step.objective,
        stopWhen: step.stopWhen ?? 'observation_non_empty',
      })),
      activeFrameIndex: taskPlan.activeFrameIndex,
      frameCount: taskPlan.frames.length,
    };
  }

  private sanitizeFinalOutput(value: string): string {
    return sanitizeStoredFinalOutput(value);
  }
  async run(input: AgentLangGraphRunInput): Promise<AgentGraphState> {
    const requestedSkillCtx: RequestedSkillRunContext | null =
      input.requestedSkillId != null
        ? await this.requestedSkillRun.loadRunContext({
            agentId: input.agentId,
            userId: input.userId,
            appClientId: input.appClientId,
            skillId: input.requestedSkillId,
            allowedTools: input.tools,
            toolBuildCtx: input.toolBuildCtx,
          })
        : null;
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
    const buildTurnRespondState = (
      state: AgentGraphState,
      steps: AgentRunStep[],
      request: TurnRespondRequest,
    ): AgentGraphState => ({
      ...state,
      steps,
      pendingRespond: pendingRespondFromTurn(request),
      scopedTools: [],
      scopedLangChainTools: [],
      scopedToolBundle: null,
      scopedAllowedToolIds: [],
    });

    /** 类目意图召回命中（任一 intent 步 matchedCategoryIds 非空）才进入 LLM 决策环。 */
    const isIntentMatched = (state: AgentGraphState): boolean => {
      if (requestedSkillCtx) {
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
      pendingRespond: Annotation<AgentGraphState['pendingRespond']>({
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
      planAborted: Annotation<boolean | undefined>({
        default: () => undefined,
        reducer: (_state, update) => update,
      }),
      confirmedPreviewSerialized: Annotation<string | null | undefined>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      pageContext: Annotation<AgentGraphState['pageContext']>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
    });

    const applySkillFrameContext = async (
      state: AgentGraphState,
    ): Promise<AgentGraphState> => {
      if (!state.taskPlan) {
        return state;
      }
      const expanded = await expandPendingSkillStepIfNeeded({
        plan: state.taskPlan,
        scopedTools: state.scopedTools,
        toolBuildCtx: input.toolBuildCtx,
        skillService: this.skillService,
        llmService: this.llmService,
        promptRegistry: this.promptRegistry,
        scope: promptScope,
        agentId: input.agentId,
        userId: input.userId,
        appClientId: input.appClientId,
        enforceRequestedSkill: requestedSkillCtx != null,
      });
      const skillCtx = resolveSkillContextFromPlan(expanded.plan);
      return {
        ...state,
        taskPlan: expanded.plan,
        scopedTools: expanded.scopedTools,
        scopedLangChainTools: expanded.scopedToolBundle.tools,
        scopedToolBundle: expanded.scopedToolBundle,
        scopedAllowedToolIds: expanded.scopedAllowedToolIds,
        skillApplied: skillCtx.skillApplied,
        activeSkillId: skillCtx.activeSkillId,
        activeSkillPrompt: skillCtx.activeSkillPrompt,
        activeSkillName: skillCtx.activeSkillName,
        activeSkillDescription: skillCtx.activeSkillDescription,
        activeSkillConfig: skillCtx.activeSkillConfig,
        activeSkillRiskLevel: skillCtx.activeSkillRiskLevel,
      };
    };

    const withPlanSyncStep = (
      graphState: AgentGraphState,
      planAdvance: TaskPlanAdvanceResult | null,
      fromStepId: string | null,
      site: PlanSyncSite,
    ): AgentGraphState => {
      if (!planAdvance) {
        return graphState;
      }
      return {
        ...graphState,
        steps: [
          ...graphState.steps,
          toPlanSyncAgentStep({
            step: nextRunStepNumber(graphState.steps),
            planAdvance,
            fromStepId,
            site,
            planRunContext: planRunContextFromState(graphState),
            normalizeOutput: (value) => this.normalizeJsonLike(value),
          }),
        ],
      };
    };

    /** L1：skill 帧展开后，将 Plan 与 observations 对齐，再进入 ReAct。 */
    const prepareReActPlanState = async (
      state: AgentGraphState,
    ): Promise<{
      state: AgentGraphState;
      planAdvance: TaskPlanAdvanceResult | null;
      fromStepId: string | null;
    }> => {
      let graphState = await applySkillFrameContext(state);
      const fromStepId = graphState.taskPlan?.currentStepId ?? null;
      const synced = syncTaskPlanBeforeReAct({
        taskPlan: graphState.taskPlan,
        scopedTools: graphState.scopedTools,
        skillConfig: graphState.activeSkillConfig,
        runOwnedObservations: graphState.toolObservations,
      });
      if (synced.taskPlan && synced.taskPlan !== graphState.taskPlan) {
        graphState = { ...graphState, taskPlan: synced.taskPlan };
      }
      if (synced.planAdvance?.reason === 'plan_advance_skill_step') {
        graphState = await applySkillFrameContext(graphState);
      }
      return {
        state: graphState,
        planAdvance: synced.planAdvance,
        fromStepId,
      };
    };

    // 节点：Plan — 外层编排（kind=skill 复合步）；进入 skill 后展开内层 steps。
    const plan = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const stepNum = nextRunStepNumber(state.steps);
      if (state.taskPlan) {
        return state;
      }
      if (sessionGoa && !requestedSkillCtx) {
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
            step: stepNum,
            type: 'plan',
            output: this.normalizeJsonLike({
              method: 'session_resume',
              activeFrameIndex: taskPlan.activeFrameIndex,
              frameCount: taskPlan.frames.length,
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
            allObservations: allToolObservations(state),
            runOwnedObservations: runOwnedToolObservations(state),
            userMessage: input.latestUserMessage,
            planRunContext: 'resume',
            buildMergedObservation: () =>
              this.buildSummarizeObservationFromState(state, {
                taskPlan,
                scopedTools: state.scopedTools,
              }),
          });
          const stepsWithPlan = [...state.steps, planStep];
          await this.updateRun(
          input.runId,
          stepsWithPlan,
          AgentRunStatus.running,
          );
          this.sse.emitThink(
            input.sessionId,
            input.runId,
            '续接上次未完成任务步骤…\n',
            'replace',
          );
          if (initialAdvance) {
            return applySkillFrameContext({
              ...state,
              steps: stepsWithPlan,
              taskPlan: initialAdvance.updatedPlan,
              planRunContext: 'resume',
              pendingRespond: pendingRespondFromObservation(
                initialAdvance.summaryObservation as ToolObservation,
              ),
            });
          }
          return applySkillFrameContext({
            ...state,
            steps: stepsWithPlan,
            taskPlan,
            planRunContext: 'resume',
          });
        }
      }
      if (!input.enableToolCall || state.scopedTools.length === 0) {
        const step: AgentRunStep = {
          step: stepNum,
          type: 'plan',
          output: this.normalizeJsonLike({
            skipped: true,
            reason: 'tools_disabled',
          }),
        };
        await this.updateRun(
          input.runId,
          [...state.steps, step],
          AgentRunStatus.running,
        );
        return { ...state, steps: [...state.steps, step] };
      }

      const goaForPlan =
        sessionGoa ?? (await this.goaService.getPayload(input.sessionId));

      const sessionWorkingMemory = buildPlanSessionWorkingMemory({
        goa: goaForPlan,
        scopedTools: state.scopedTools,
        runOwnedObservations: runOwnedToolObservations(state),
      });

      if (
        goaForPlan.activeTask?.status === 'in_progress' ||
        goaForPlan.activeTask?.status === 'awaiting_confirmation'
      ) {
        await this.goaService.abandonActiveTask(input.sessionId);
        sessionGoa = await this.goaService.getPayload(input.sessionId);
      }

      this.sse.emitThink(
        input.sessionId,
        input.runId,
        requestedSkillCtx
          ? '正在按所选技能规划任务步骤…\n'
          : '正在规划任务步骤…\n',
        'replace',
      );

      const availableSkills =
        await this.skillService.listAvailableSkillsForScopedTools({
          agentId: input.agentId,
          userId: input.userId,
          appClientId: input.appClientId,
          scopedTools: state.scopedTools,
        });

      const resolvedPlan = await resolveOuterPlan({
        llmService: this.llmService,
        promptRegistry: this.promptRegistry,
        scope: promptScope,
        planInput: {
          userMessage: input.latestUserMessage,
          scopedToolSummaries: summarizeScopedToolsForPlan(state.scopedTools),
          availableSkills: summarizeAvailableSkillsForOuterPlan(
            availableSkills,
            state.scopedTools,
          ),
          sessionWorkingMemory,
          requestedSkillId: input.requestedSkillId,
        },
      });

      const taskPlan = resolvedPlan.plan;

      const planStep: AgentRunStep = {
        step: stepNum,
        type: 'plan',
        output: this.normalizeJsonLike({
          method: resolvedPlan.method,
          llmFallbackReason: resolvedPlan.llmFallbackReason ?? null,
          availableSkillIds: availableSkills.map((skill) => skill.id),
          requestedSkillId: input.requestedSkillId ?? null,
          requestedSkillSkipIntent: requestedSkillCtx != null,
          source: taskPlan.source,
          deliverable: taskPlan.deliverable,
          goal: taskPlan.goal,
          stepIds: taskPlan.steps.map((step) => step.id),
          pendingStepIds: taskPlan.pendingStepIds,
          currentStepId: taskPlan.currentStepId,
          currentObjective: taskPlan.currentObjective,
          taskPhase: taskPlan.taskPhase,
          activeFrameIndex: taskPlan.activeFrameIndex,
          frameCount: taskPlan.frames.length,
          sessionWorkingMemoryIncluded: sessionWorkingMemory != null,
        }),
      };

      const initialAdvance = resolveTaskPlanInitialAdvance({
        plan: taskPlan,
        allObservations: allToolObservations(state),
        runOwnedObservations: runOwnedToolObservations(state),
        userMessage: input.latestUserMessage,
        planRunContext: planRunContextFromState(state),
        buildMergedObservation: () =>
          this.buildSummarizeObservationFromState(state, {
            taskPlan,
            scopedTools: state.scopedTools,
          }),
      });
      const stepsWithPlan = [...state.steps, planStep];
      await this.updateRun(
          input.runId,
          stepsWithPlan,
          AgentRunStatus.running,
      );
      const planState = {
        ...state,
        steps: stepsWithPlan,
        taskPlan,
        skillApplied: false,
        activeSkillId: null,
        activeSkillPrompt: null,
        activeSkillName: null,
        activeSkillDescription: null,
        activeSkillConfig: null,
        activeSkillRiskLevel: null,
      };
      if (initialAdvance) {
        return applySkillFrameContext({
          ...planState,
          taskPlan: initialAdvance.updatedPlan,
          pendingRespond: pendingRespondFromObservation(
            initialAdvance.summaryObservation as ToolObservation,
          ),
        });
      }
      return applySkillFrameContext(planState);
    };

    // 节点1：意图识别 + 工具收窄（按 toolCategory），必要时直接结束并返回引导语。
    const intent = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const stepNum = nextRunStepNumber(state.steps);

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
          step: stepNum,
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
          AgentRunStatus.running,
        );
        return {
          ...buildTurnRespondState(state, [...state.steps, intentStep], {
            kind: 'smalltalk',
            userMessage: input.latestUserMessage,
          }),
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
          step: stepNum,
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
          AgentRunStatus.running,
        );
        return {
          ...buildTurnRespondState(state, [...state.steps, intentStep], {
            kind: 'unsupported_scope',
            userMessage: input.latestUserMessage,
            payload: { readinessReason: 'tools_disabled' },
          }),
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
        const intentStep: AgentRunStep = {
          step: stepNum,
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
          AgentRunStatus.running,
        );
        return buildTurnRespondState(state, [...state.steps, intentStep], {
          kind: 'message_unclear',
          userMessage: input.latestUserMessage,
        });
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
          step: stepNum,
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
          AgentRunStatus.running,
        );
        return buildTurnRespondState(state, [...state.steps, fallbackStep], {
          kind: 'intent_recall_failed',
          userMessage: input.latestUserMessage,
        });
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
          step: stepNum,
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
          AgentRunStatus.running,
        );
        return buildTurnRespondState(state, [...state.steps, intentStep], {
          kind: 'unsupported_scope',
          userMessage: input.latestUserMessage,
        });
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
          step: stepNum,
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
          AgentRunStatus.running,
        );
        return buildTurnRespondState(state, [...state.steps, intentStep], {
          kind: 'unsupported_scope',
          userMessage: input.latestUserMessage,
        });
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
        step: stepNum,
        type: 'intent',
        output: this.normalizeJsonLike(intentOutput),
      };

      await this.updateRun(
        input.runId,
        [...state.steps, intentStep],
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
    // 节点2：主推理节点。基于当前的plan，选择工具-或者对结果进行观察。
    const llm = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const prepared = await prepareReActPlanState(state);
      const graphState = withPlanSyncStep(
        prepared.state,
        prepared.planAdvance,
        prepared.fromStepId,
        'llm',
      );
      if (hasPendingRespond(graphState.pendingRespond)) {
        return graphState;
      }
      if (
        !graphState.skillApplied &&
        graphState.toolObservations.length === 0 &&
        graphState.pendingToolCalls.length === 0 &&
        !isIntentMatched(graphState)
      ) {
        return buildTurnRespondState(graphState, graphState.steps, {
          kind: 'unsupported_scope',
          userMessage: input.latestUserMessage,
        });
      }
      const graphStateForLlm = graphState;
      const observationSplit = splitToolObservationsFromState(graphStateForLlm);
      const observationsForLlm = allToolObservations(graphStateForLlm);
      const observationBuckets = planObservationBucketsFromState(graphStateForLlm);
      const observationsForPlanSatisfaction =
        selectObservationsForPlanToolSatisfaction(observationBuckets);
      if (isPendingPlanAnswerStep(graphStateForLlm.taskPlan)) {
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          '正在按任务计划生成结果…\n',
          'delta',
        );
        return {
          ...graphStateForLlm,
          pendingRespond: pendingRespondFromObservation(
            buildPlanSummarizeObservation({
              userMessage: input.latestUserMessage,
              summarizeObservation: this.buildSummarizeObservationFromState(
                graphStateForLlm,
                {
                  taskPlan: graphStateForLlm.taskPlan,
                  scopedTools: graphStateForLlm.scopedTools,
                },
              ),
            }),
          ),
        };
      }
      const llmStepNumber = nextRunStepNumber(graphStateForLlm.steps);
      const nextIteration = graphStateForLlm.iteration + 1;
      const pendingToolStepEarly = getPendingPlanToolStep(graphStateForLlm.taskPlan);
      if (isPlanWriteFallbackStep(pendingToolStepEarly)) {
        const composedPending = resolvePendingWriteForPlanWriteStep({
          observations: allToolObservations(graphStateForLlm),
          taskPlan: graphStateForLlm.taskPlan,
          scopedTools: graphStateForLlm.scopedTools,
          pageContext: graphStateForLlm.pageContext ?? null,
        });
        if (composedPending) {
          this.logger.log(
            `write fallback: reuse plan_compose_write pending call runId=${input.runId} tool=${composedPending.name}`,
          );
          return {
            ...graphStateForLlm,
            iteration: nextIteration,
            pendingToolCalls: [composedPending],
            pendingRespond: null,
          };
        }
      }
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
          observationSplit,
          decisionEnableToolCall,
          promptScope,
          graphStateForLlm.activeSkillPrompt,
          graphStateForLlm.taskPlan,
        );
        const { messages: invokeMessages, trimMeta } = this.buildLlmInvokeMessages(
          input.promptMessages,
          observationSplit,
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
            step: llmStepNumber,
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
            `LLM decision prompt file runId=${input.runId} step=${llmStepNumber} path=${promptDebugFile}`,
          );
        } else if (isLlmPromptDebugEnabled()) {
          this.logger.warn(
            `LLM decision prompt debug file write failed runId=${input.runId} step=${llmStepNumber}`,
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
            step: llmStepNumber,
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
        await this.updateRun(
          input.runId,
          steps,
          AgentRunStatus.running,
        );
        const pendingToolStep = getPendingPlanToolStep(graphStateForLlm.taskPlan);
        if (toolCalls.length === 0) {
          const planRequiresToolCall =
            pendingToolStep?.kind === 'tool' &&
            !isPlanToolStepSatisfiedByObservations({
              step: pendingToolStep,
              observations: observationsForPlanSatisfaction,
              scopedTools: graphStateForLlm.scopedTools,
              taskPlan: graphStateForLlm.taskPlan,
              skillConfig: graphStateForLlm.activeSkillConfig,
              purpose: 'pre_tools_advance',
            });
          if (planRequiresToolCall) {
            if (!llmText) {
              this.logger.warn(
                `llm plan tool step skipped without toolCalls runId=${input.runId} step=${llmStepNumber} planStep=${pendingToolStep.id}`,
              );
            }
            return {
              ...graphStateForLlm,
              iteration: nextIteration,
              steps,
              pendingToolCalls: [],
              pendingRespond: null,
            };
          }
          if (
            graphStateForLlm.taskPlan &&
            pendingToolStep?.kind === 'tool' &&
            isPlanToolStepSatisfiedByObservations({
              step: pendingToolStep,
              observations: observationsForPlanSatisfaction,
              scopedTools: graphStateForLlm.scopedTools,
              taskPlan: graphStateForLlm.taskPlan,
              skillConfig: graphStateForLlm.activeSkillConfig,
              purpose: 'pre_tools_advance',
            })
          ) {
            return {
              ...graphStateForLlm,
              iteration: nextIteration,
              steps,
              pendingToolCalls: [],
              pendingRespond: null,
            };
          }
          const emptyReply =
            '我这次没有拿到有效结果，请你换个问法，或补充更具体的条件后我再试一次。';
          if (!llmText) {
            this.logger.warn(
              `llm returned empty content and no toolCalls runId=${input.runId} step=${llmStepNumber} model=${
                typeof responseMeta?.model_name === 'string'
                  ? responseMeta.model_name
                  : 'unknown'
              }`,
            );
          }
          const completion = this.resolveLlmCompletionAfterTools(
            input.latestUserMessage,
            llmText || emptyReply,
            graphStateForLlm,
            {
              taskPlan: graphStateForLlm.taskPlan,
              scopedTools: graphStateForLlm.scopedTools,
            },
          );
          return {
            ...graphStateForLlm,
            iteration: nextIteration,
            steps,
            pendingToolCalls: [],
            pendingRespond: pendingRespondFromObservation(
              completion?.observation ??
                this.buildDirectReplyObservation(
                  input.latestUserMessage,
                  emptyReply,
                ),
            ),
          };
        }
        if (
          isPlanComposeWriteStep(pendingToolStep) &&
          graphStateForLlm.taskPlan
        ) {
          const composeCall = pickComposeWriteToolCall(
            toolCalls,
            graphStateForLlm.scopedTools,
            graphStateForLlm.taskPlan,
          );
          if (composeCall) {
            const writeToolDef = graphStateForLlm.scopedTools.find(
              (tool) => tool.name === composeCall.name,
            );
            const preparedCall =
              writeToolDef != null
                ? prepareComposeWriteToolCall({
                    toolCall: composeCall,
                    writeTool: writeToolDef,
                    observations: allToolObservations(graphStateForLlm),
                    scopedTools: graphStateForLlm.scopedTools,
                    pageContext: graphStateForLlm.pageContext ?? null,
                  })
                : composeCall;
            const composeObs = buildPlanComposeWriteObservation({
              toolCall: preparedCall,
              planStepId: pendingToolStep.id,
            });
            const planAdvance = advancePlanAfterStepComplete(
              graphStateForLlm.taskPlan,
              pendingToolStep.id,
            );
            const toolObservations = [
              ...graphStateForLlm.toolObservations,
              composeObs,
            ];
            this.sse.emitThink(
              input.sessionId,
              input.runId,
              '参数已生成，正在整理写操作草稿…\n',
              'delta',
            );
            let stateAfterCompose: AgentGraphState = {
              ...graphStateForLlm,
              iteration: nextIteration,
              steps,
              toolObservations,
              taskPlan: planAdvance.updatedPlan,
              pendingToolCalls: [],
              pendingRespond: pendingRespondFromObservation(
                buildPlanSummarizeObservation({
                  userMessage: input.latestUserMessage,
                  summarizeObservation: this.buildSummarizeObservationFromState(
                    {
                      preloadedToolObservations:
                        graphStateForLlm.preloadedToolObservations,
                      toolObservations,
                    },
                    {
                      taskPlan: planAdvance.updatedPlan,
                      scopedTools: graphStateForLlm.scopedTools,
                    },
                  ),
                }),
              ),
            };
            stateAfterCompose = withPlanSyncStep(
              stateAfterCompose,
              planAdvance,
              pendingToolStep.id,
              'llm',
            );
            return stateAfterCompose;
          }
          this.logger.warn(
            `compose_write step: no allowed write tool in tool_calls runId=${input.runId} count=${toolCalls.length}`,
          );
          return {
            ...graphStateForLlm,
            iteration: nextIteration,
            steps,
            pendingToolCalls: [],
            pendingRespond: null,
          };
        }
        return {
          ...graphStateForLlm,
          iteration: nextIteration,
          steps,
          // 交给 tools 节点执行（本轮可能包含多个调用）。
          pendingToolCalls: applyPlanDraftToWriteToolCalls(
            toolCalls,
            graphStateForLlm.taskPlan,
            graphStateForLlm.scopedTools,
            resolvePlanSubmitTextForWrite({
              observations: allToolObservations(graphStateForLlm),
              artifactBlocks:
                this.assistantArtifact.peekBlocks(
                  input.sessionId,
                  input.runId,
                ) ?? null,
              scopedTools: graphStateForLlm.scopedTools,
            }),
          ),
        };
      } catch (error) {
        const userMessage = buildLlmFailureUserMessage(error);
        const code = resolveLlmFailureCode(error);
        const failedLlmStepNumber = nextRunStepNumber(graphState.steps);
        this.logger.warn(
          `llm node failed runId=${input.runId} step=${failedLlmStepNumber}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        const steps = [
          ...graphState.steps,
          {
            step: failedLlmStepNumber,
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
          AgentRunStatus.success,
        );
        recordMachineCodeUsage(input.runMetrics, code);
        return {
          ...graphState,
          iteration: graphState.iteration + 1,
          steps,
          pendingToolCalls: [],
          pendingRespond: pendingRespondFromObservation(
            this.buildDirectReplyObservation(
              input.latestUserMessage,
              userMessage,
            ),
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

      const pendingToolCalls = applyPlanDraftToWriteToolCalls(
        state.pendingToolCalls,
        state.taskPlan,
        state.scopedTools,
        resolvePlanSubmitTextForWrite({
          observations: allToolObservations(state),
          artifactBlocks:
            this.assistantArtifact.peekBlocks(input.sessionId, input.runId) ??
            null,
          scopedTools: state.scopedTools,
        }),
      ).map((call) => {
        const def = state.scopedTools.find((tool) => tool.name === call.name);
        if (!def || !isMutationTool(def.agentMetadata)) {
          return call;
        }
        const isReadToolObservation = buildReadToolObservationMatcher(
          state.scopedTools,
        );
        return {
          ...call,
          arguments: normalizeWriteToolArguments(
            call.arguments,
            def,
            allToolObservations(state),
            {
              isReadToolObservation,
              pageContext: state.pageContext ?? null,
            },
          ),
        };
      });

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

      const { safeCalls, writeCallsNeedingConfirm } =
        partitionToolCallsByWriteConfirmation(
          pendingToolCalls,
          state.scopedTools,
          input.approvedWriteToolNames,
        );
      const writeCallsForGate = filterSchemaValidWriteConfirmationCalls(
        writeCallsNeedingConfirm,
        state.scopedTools,
      );
      if (
        writeCallsNeedingConfirm.length > 0 &&
        writeCallsForGate.length === 0
      ) {
        this.logger.warn(
          `write confirmation blocked: pending tool_calls fail schema validation runId=${input.runId} tools=${writeCallsNeedingConfirm.map((call) => call.name).join(',')}`,
        );
        this.publishMutationGateBlockedDraft(
          input.sessionId,
          input.runId,
          input.turnId,
          buildMutationArgsInvalidUserMessage(),
        );
        return {
          ...state,
          pendingToolCalls: [],
          lastToolRoundMeta: null,
          pagedListHttpUsed: pagedGatherHttpBudget.used,
        };
      }

      if (writeCallsForGate.length > 0) {
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
          AgentRunStatus.running,
          );
        }

        let previewReady = hasUserVisibleMutationPreview({
          artifact: this.assistantArtifact.peek(input.sessionId, input.runId),
          observations,
        });
        if (!previewReady) {
          const previewMarkdown = buildMutationPreviewMarkdownFromWriteCalls(
            writeCallsForGate,
            state.scopedTools,
          );
          if (previewMarkdown.trim()) {
            const turnId =
              this.assistantArtifact.peekTurnId(input.sessionId, input.runId) ??
              input.turnId;
            const blocks = this.sse.publishAssistantBlocks(
              input.sessionId,
              input.runId,
              ensureAtLeastOneTextBlock(
                [textBlock(previewMarkdown.trim(), 'markdown')],
                previewMarkdown.trim(),
              ),
              { turnId, phase: 'draft' },
            );
            this.assistantArtifact.commit(
              input.sessionId,
              input.runId,
              blocks,
              'draft',
            );
            previewReady = true;
          }
        }
        if (!previewReady) {
          this.logger.warn(
            `write gate blocked: no user-visible mutation preview runId=${input.runId}`,
          );
          this.publishMutationGateBlockedDraft(
            input.sessionId,
            input.runId,
            input.turnId,
            buildMutationPreviewUnavailableUserMessage(),
          );
          return {
            ...state,
            pendingToolCalls: [],
            lastToolRoundMeta: null,
            pagedListHttpUsed: pagedGatherHttpBudget.used,
          };
        }

        const message = buildWriteConfirmationUserMessage();
        const confirmedPreviewSerialized =
          this.assistantArtifact.peekSerialized(input.sessionId, input.runId);
        await this.pendingWriteConfirmationStore.set({
          runId: input.runId,
          turnId: input.turnId,
          sessionId: input.sessionId,
          userId: input.userId,
          appClientId: input.appClientId,
          agentId: input.agentId,
          latestUserMessage: input.latestUserMessage,
          toolCalls: writeCallsForGate,
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
            confirmedPreviewSerialized,
            pageContext: state.pageContext ?? null,
          },
          createdAt: new Date().toISOString(),
        });
        const confirmationPayload = {
          source: 'agent-run' as const,
          action: 'confirmation_required' as const,
          runId: input.runId,
          turnId: input.turnId,
          message,
        };
        this.chatEvents.emit(input.sessionId, {
          event: 'message',
          payload: confirmationPayload,
        });
        emitAgentMessageSseDebug({
          tag: 'confirmation_required',
          sessionId: input.sessionId,
          runId: input.runId,
          turnId: input.turnId,
          ssePayload: confirmationPayload,
          source: {
            confirmedPreviewSerialized,
            artifactBlocks: this.assistantArtifact.peekBlocks(
              input.sessionId,
              input.runId,
            ),
          },
        });
        const gateStep: AgentRunStep = {
          step: nextRunStepNumber(nextSteps),
          type: 'write_confirmation_gate',
          output: this.normalizeJsonLike({
            status: 'awaiting_user',
            pendingToolCallCount: writeCallsForGate.length,
            toolNames: writeCallsForGate.map((call) => call.name),
          }),
        };
        nextSteps = [...nextSteps, gateStep];
        await this.updateRun(
          input.runId,
          nextSteps,
          AgentRunStatus.success,
        );
        return {
          ...state,
          steps: nextSteps,
          toolObservations: mergeRunRoundObservations(state, observations),
          taskPlan,
          pendingToolCalls: [],
          awaitingWriteConfirmation: true,
          finalOutput:
            this.assistantArtifact.peekSerialized(
              input.sessionId,
              input.runId,
            ) ?? '',
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
        pendingRespond: null,
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
          step: nextRunStepNumber(state.steps),
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
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps,
          pendingToolCalls: [],
          pendingRespond: null,
          lastToolRoundMeta: null,
        };
      }
      const observationsForResultCheck = allToolObservations(state);
      let taskPlanForCheck = state.taskPlan;
      let planAdvanceFromSync: TaskPlanAdvanceResult | null = null;
      let planSyncedAt: PlanSyncSite | null = null;
      const planSyncFromStepId = state.taskPlan?.currentStepId ?? null;
      if (phase === 'pre_tools' && state.taskPlan) {
        const synced = syncTaskPlanBeforeReAct({
          taskPlan: state.taskPlan,
          scopedTools: state.scopedTools,
          skillConfig: state.activeSkillConfig,
          runOwnedObservations: state.toolObservations,
        });
        taskPlanForCheck = synced.taskPlan;
        planAdvanceFromSync = synced.planAdvance;
        if (planAdvanceFromSync) {
          planSyncedAt = 'result_check';
        }
      }
      let outcome: ResultCheckOutcome;
      if (phase === 'pre_tools') {
        outcome = resolvePreToolsResultCheck({
          pendingToolCalls: state.pendingToolCalls,
          steps: state.steps,
          taskPlan: taskPlanForCheck,
          scopedTools: state.scopedTools,
          observationBuckets: planObservationBucketsFromState(state),
          skillConfig: state.activeSkillConfig,
        });
      } else if (savedRoundMeta) {
        const lastRoundIndex =
          savedRoundMeta.roundObservationIndices.at(-1);
        const lastRoundObservation =
          lastRoundIndex != null
            ? observationsForResultCheck[lastRoundIndex]
            : undefined;
        outcome = resolvePostToolsResultCheck({
          userMessage: input.latestUserMessage,
          observations: observationsForResultCheck,
          lastToolRoundMeta: savedRoundMeta,
          scopedTools: state.scopedTools,
          taskPlan: state.taskPlan,
          skillConfig: state.activeSkillConfig,
          skillApplied: state.skillApplied,
          hasExpandedOnce: state.hasExpandedOnce,
          iteration: state.iteration,
          totalAllowedToolCount: input.tools.length,
          writeConfirmResume: input.resumeFromWriteConfirm === true,
          isLowQualityLastObservation:
            this.isLowQualityToolObservation(lastRoundObservation),
        });
      } else {
        throw new Error('resultCheck: post_tools without lastToolRoundMeta');
      }

      const planAdvance =
        phase === 'post_tools' && savedRoundMeta && state.taskPlan
          ? resolveTaskPlanAdvance({
              phase: 'post_tools',
              plan: state.taskPlan,
              observations: allToolObservations(state),
              executionStatuses: savedRoundMeta.executionStatuses,
              roundObservationIndices: savedRoundMeta.roundObservationIndices,
              scopedTools: state.scopedTools,
              toolCalls: savedRoundMeta.toolCalls,
              skillConfig: state.activeSkillConfig,
            })
          : phase === 'pre_tools'
            ? planAdvanceFromSync
            : null;
      const planFallback = resolveResultCheckPlanFallback({
        outcome,
        planAdvance,
      });
      const taskPlanNext = planAdvance?.updatedPlan ?? state.taskPlan ?? null;
      const observationsForCheck = allToolObservations(state);
      const summaryObservationForAbort =
        outcome.route === 'summarize'
          ? resolveSummaryObservationForCheck({
              reason: outcome.reason,
              observations: observationsForCheck,
              savedRoundMeta,
              mergedObservation:
                outcome.reason === 'tool_error_summarize' ||
                outcome.reason === 'tool_error_same_args_repeat'
                  ? null
                  : this.buildSummarizeObservationFromState(state, {
                      taskPlan: taskPlanNext,
                      scopedTools: state.scopedTools,
                    }),
            })
          : null;
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
      const abortPlanOnTerminalToolError = shouldAbortPlanOnTerminalToolError({
        reason: outcome.reason,
        errorOutput: summaryObservationForAbort?.output,
        taskPlan: state.taskPlan,
      });
      const abortPlanOnRecoverableSameArgs = shouldAbortPlanOnRecoverableSameArgs(
        {
          reason: outcome.reason,
          taskPlan: state.taskPlan,
        },
      );
      const planAbortedOnToolError =
        abortPlanOnTerminalToolError || abortPlanOnRecoverableSameArgs;
      const planAbortedAfterCheck =
        state.planAborted === true ||
        abortPlanOnEmptyResults ||
        abortPlanOnDuplicateSummarize ||
        abortPlanOnToolStepExhausted ||
        abortPlanOnWriteStepExhausted ||
        planAbortedOnToolError;
      const taskPlanAfterCheck =
        abortPlanOnEmptyResults ||
        abortPlanOnDuplicateSummarize ||
        abortPlanOnToolStepExhausted ||
        abortPlanOnWriteStepExhausted ||
        planAbortedOnToolError
          ? null
          : taskPlanNext;

      const skipSteps =
        outcome.duplicateSkipCalls.length > 0
          ? buildDuplicateSkipToolSteps(
              outcome.duplicateSkipCalls,
              state.steps,
              outcome.reason,
            )
          : [];
      const planSyncSteps: AgentRunStep[] =
        planAdvanceFromSync != null
          ? [
              toPlanSyncAgentStep({
                step: nextRunStepNumber([...state.steps, ...skipSteps]),
                planAdvance: planAdvanceFromSync,
                fromStepId: planSyncFromStepId,
                site: 'result_check',
                planRunContext: planRunContextFromState(state),
                normalizeOutput: (value) => this.normalizeJsonLike(value),
              }),
            ]
          : [];
      const isSafetyAbortRoute =
        outcome.route === 'summarize' && planAbortedAfterCheck;
      const planRouteAuthority: ResultCheckRouteAuthority =
        planFallback?.authority ??
        (isSafetyAbortRoute ? 'safety_abort' : 'react');
      const resultCheckStep: AgentRunStep = {
        step: nextRunStepNumber([...state.steps, ...skipSteps, ...planSyncSteps]),
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
          planSyncedAt,
          planRouteAuthority,
          planSupersededPendingToolCallCount:
            planFallback?.action === 'summarize'
              ? planFallback.supersededPendingToolCallCount
              : 0,
          planAbortedEmpty: abortPlanOnEmptyResults,
          planAbortedDuplicate: abortPlanOnDuplicateSummarize,
          planAbortedToolStepExhausted: abortPlanOnToolStepExhausted,
          planAbortedWriteStepExhausted: abortPlanOnWriteStepExhausted,
          planAbortedTerminalToolError: abortPlanOnTerminalToolError,
          planAbortedSameArgsRepeat: abortPlanOnRecoverableSameArgs,
          taskPlanStep: taskPlanAfterCheck?.currentStepId ?? null,
        }),
      };
      let steps = [...state.steps, ...skipSteps, ...planSyncSteps, resultCheckStep];

      const emitRouteThink = (message: string): void => {
        this.sse.emitThink(input.sessionId, input.runId, message, 'delta');
      };

      const effectiveTaskPlanNext = taskPlanNext;

      if (planFallback?.action === 'summarize' && planAdvance) {
        const summarizeObservation = this.buildSummarizeObservationFromState(
          state,
          {
            taskPlan: effectiveTaskPlanNext,
            scopedTools: state.scopedTools,
          },
        );
        const summaryObservation =
          resolveSummaryObservationForCheck({
            reason: planAdvance.reason,
            observations: allToolObservations(state),
            savedRoundMeta,
            mergedObservation: summarizeObservation,
          }) ??
          buildPlanSummarizeObservation({
            userMessage: input.latestUserMessage,
            summarizeObservation,
          });
        if (planAdvance.reason === 'plan_advance_summarize') {
          emitRouteThink('数据已就绪，正在按任务计划生成结果…\n');
        } else if (planAdvance.reason === 'plan_complete') {
          emitRouteThink('任务计划已完成，正在生成最终结果…\n');
        }
        await this.updateRun(
          input.runId,
          steps,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps,
          taskPlan: effectiveTaskPlanNext,
          pendingToolCalls: [],
          pendingRespond: pendingRespondFromObservation(summaryObservation),
          lastToolRoundMeta: null,
        };
      }

      if (planFallback?.action === 'skill_step') {
        emitRouteThink('进入下一技能步骤…\n');
        await this.updateRun(
          input.runId,
          steps,
          AgentRunStatus.running,
        );
        return applySkillFrameContext({
          ...state,
          steps,
          taskPlan: effectiveTaskPlanNext,
          pendingToolCalls: resolveSkillStepPendingToolCalls({
            pendingToolCalls: outcome.pendingToolCalls,
            taskPlan: effectiveTaskPlanNext,
            scopedTools: state.scopedTools,
          }),
          pendingRespond: null,
          lastToolRoundMeta: null,
        });
      }

      if (planFallback?.action === 'llm_continue') {
        if (planFallback.reason === 'plan_advance_tool_step') {
          emitRouteThink('进入下一任务步骤…\n');
        }
        await this.updateRun(
          input.runId,
          steps,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps,
          taskPlan: effectiveTaskPlanNext,
          pendingToolCalls: planFallback.clearPendingToolCalls
            ? []
            : outcome.pendingToolCalls,
          pendingRespond: null,
          lastToolRoundMeta: null,
        };
      }

      if (outcome.route === 'expand_tools') {
        const expandScopedTools = requestedSkillCtx
          ? requestedSkillCtx.scoped.scopedTools
          : input.tools;
        const expandedStep: AgentRunStep = {
          step: nextRunStepNumber(steps),
          type: 'intent',
          output: this.normalizeJsonLike({
            fallback: true,
            fallbackReason: outcome.reason,
            toolsBeforeExpand: state.scopedTools.length,
            toolsAfterExpand: expandScopedTools.length,
            ...(requestedSkillCtx
              ? { requestedSkillId: requestedSkillCtx.skillId, expandSkipped: true }
              : {}),
          }),
        };
        steps = [...steps, expandedStep];
        await this.updateRun(
          input.runId,
          steps,
          AgentRunStatus.running,
        );
        emitRouteThink(
          requestedSkillCtx
            ? '首轮结果信息不足，正在按所选技能重新规划…\n'
            : '首轮结果信息不足，正在放宽工具范围再尝试一次…\n',
        );
        const expandedSkills =
          await this.skillService.listAvailableSkillsForScopedTools({
            agentId: input.agentId,
            userId: input.userId,
            appClientId: input.appClientId,
            scopedTools: expandScopedTools,
          });
        const expandedResolvedPlan = await resolveOuterPlan({
          llmService: this.llmService,
          promptRegistry: this.promptRegistry,
          scope: promptScope,
          planInput: {
            userMessage: input.latestUserMessage,
            scopedToolSummaries: summarizeScopedToolsForPlan(expandScopedTools),
            availableSkills: summarizeAvailableSkillsForOuterPlan(
              expandedSkills,
              expandScopedTools,
            ),
            sessionWorkingMemory: buildPlanSessionWorkingMemory({
              goa: sessionGoa,
              scopedTools: expandScopedTools,
              runOwnedObservations: runOwnedToolObservations(state),
            }),
            requestedSkillId: input.requestedSkillId,
          },
        });
        const expandedBundle = requestedSkillCtx
          ? requestedSkillCtx.scoped.scopedToolBundle
          : this.toolEngine.buildLangChainTools(expandScopedTools, {
              ...input.toolBuildCtx,
              allowedToolIds: expandScopedTools.map((tool) => tool.id),
            });
        return applySkillFrameContext({
          ...state,
          steps,
          pendingToolCalls: [],
          pendingRespond: null,
          lastToolRoundMeta: null,
          scopedTools: expandScopedTools,
          scopedLangChainTools: expandedBundle.tools,
          scopedToolBundle: expandedBundle,
          scopedAllowedToolIds: expandScopedTools.map((tool) => tool.id),
          hasExpandedOnce: true,
          taskPlan: expandedResolvedPlan.plan,
          skillApplied: false,
          activeSkillId: null,
          activeSkillPrompt: null,
          activeSkillName: null,
          activeSkillDescription: null,
          activeSkillConfig: null,
          activeSkillRiskLevel: null,
        });
      }

      if (outcome.route === 'summarize') {
        const planStepExhausted =
          outcome.reason === 'plan_tool_step_exhausted' ||
          outcome.reason === 'plan_write_step_exhausted';
        const summaryObservation = planStepExhausted
          ? null
          : summaryObservationForAbort;
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
          } else if (outcome.reason === 'tool_error_same_args_repeat') {
            emitRouteThink(
              '参数未调整且与上次失败调用相同，正在生成说明…\n',
            );
          } else if (
            outcome.reason === 'tool_error_summarize' &&
            planAbortedOnToolError
          ) {
            emitRouteThink('工具调用失败，正在生成说明…\n');
          }
          await this.updateRun(
          input.runId,
          steps,
          AgentRunStatus.running,
          );
          return {
            ...state,
            steps,
            taskPlan: taskPlanAfterCheck,
            pendingToolCalls: [],
            pendingRespond: pendingRespondFromObservation(summaryObservation),
            lastToolRoundMeta: null,
            planAborted: planAbortedAfterCheck || undefined,
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
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps,
          taskPlan: taskPlanAfterCheck,
          pendingToolCalls: [],
          pendingRespond: pendingRespondFromObservation(
            this.buildDirectReplyObservation(
              input.latestUserMessage,
              exhaustedFallback,
            ),
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
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps,
          taskPlan: taskPlanAfterCheck,
          pendingToolCalls: [],
          pendingRespond: null,
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
          AgentRunStatus.running,
      );

      return {
        ...state,
        steps,
        taskPlan: taskPlanAfterCheck,
        pendingToolCalls: outcome.pendingToolCalls,
        pendingRespond: null,
        lastToolRoundMeta: null,
      };
    };

    // 节点：执行就绪 — 当前 plan gather 步业务参数 / observation 是否齐备（对话意图由 intent 负责）。
    const readiness = async (
      state: AgentGraphState,
    ): Promise<AgentGraphState> => {
      const stateAfterSkill = await applySkillFrameContext(state);
      if (hasPendingRespond(stateAfterSkill.pendingRespond)) {
        return stateAfterSkill;
      }
      const stepNum = nextRunStepNumber(stateAfterSkill.steps);
      const readinessResult = await evaluateExecutionReadiness({
        userMessage: input.latestUserMessage,
        taskPlan: stateAfterSkill.taskPlan,
        scopedTools: stateAfterSkill.scopedTools,
        observationBuckets: planObservationBucketsFromState(stateAfterSkill),
        skillConfig: stateAfterSkill.activeSkillConfig,
        resumeFromWriteConfirm: input.resumeFromWriteConfirm,
        llmService: this.llmService,
        promptRegistry: this.promptRegistry,
        scope: promptScope,
        sessionObservationSummary: summarizeSessionObservationsForReadiness(
          allToolObservations(stateAfterSkill),
        ),
      });
      const readinessStep: AgentRunStep = {
        step: stepNum,
        type: 'readiness',
        output: this.normalizeJsonLike({
          status: readinessResult.status,
          reason: readinessResult.reason,
        }),
      };
      const steps = [...stateAfterSkill.steps, readinessStep];
      await this.updateRun(
          input.runId,
          steps,
          AgentRunStatus.running,
      );
      if (readinessResult.status === 'respond') {
        return {
          ...stateAfterSkill,
          steps,
          pendingRespond: pendingRespondFromTurn(readinessResult.request),
        };
      }
      return { ...stateAfterSkill, steps };
    };

     // 节点5：汇总节点。将本轮工具执行结果汇总为最终答案。
    const summarize = async (
      state: AgentGraphState,
    ): Promise<AgentGraphState> => {
      const pendingObservation = resolveObservationForSummarize(
        state.pendingRespond,
      );
      if (!pendingObservation) {
        return state;
      }
      if (isWriteConfirmResumeSummaryObservation(pendingObservation)) {
        const payload = pendingObservation.output as WriteConfirmResumeSummaryPayload;
        const summarizeObservation = this.buildSummarizeObservationFromState(
          state,
          {
            taskPlan: state.taskPlan,
            scopedTools: state.scopedTools,
          },
        );
        const toolResultsText =
          summarizeObservation != null &&
          isSplitToolObservationsOutput(summarizeObservation.output)
            ? formatSplitToolObservationsForSummarize(summarizeObservation.output)
            : summarizeObservation != null
              ? this.stringifyForPrompt(summarizeObservation.output)
              : undefined;
        const summarized = await this.summarizeWriteConfirmResume({
          payload,
          mergedToolOutput: summarizeObservation?.output,
          toolResultsText,
          confirmedPreviewSerialized: state.confirmedPreviewSerialized ?? null,
          promptMessages: input.promptMessages,
          sessionId: input.sessionId,
          runId: input.runId,
          turnId: input.turnId,
          scope: promptScope,
          taskPlan: state.taskPlan,
        });
        const resolved = this.resolveAssistantOutputFromArtifact(
          input.sessionId,
          input.runId,
          summarized,
        );
        const summaryStep: AgentRunStep = {
          step: nextRunStepNumber(state.steps),
          type: 'summarize',
          name: 'write_confirm_resume',
          output: resolved.stepPlain,
        };
        const nextSteps = [...state.steps, summaryStep];
        const taskPlanAfterSummarize = finalizePlanAfterSummarize(state.taskPlan);
        await this.updateRun(
          input.runId,
          nextSteps,
          AgentRunStatus.success,
        );
        return {
          ...state,
          steps: nextSteps,
          pendingRespond: null,
          taskPlan: taskPlanAfterSummarize,
          finalOutput: resolved.serialized,
          status: AgentRunStatus.success,
          finished: true,
        };
      }
      const primaryObservation = resolvePrimaryObservationForSummarize(
        pendingObservation.output,
      );
      const effectiveToolName =
        pendingObservation.name === SPLIT_TOOL_OBSERVATIONS_NAME &&
        primaryObservation
          ? primaryObservation.name
          : pendingObservation.name;
      const toolDef = state.scopedTools.find(
        (tool) => tool.name === effectiveToolName,
      );
      const toolErrorObs = isAgentToolErrorObservation(pendingObservation.output)
        ? pendingObservation.output
        : null;
      const shouldSummarizeToolErrorWithLlm =
        toolErrorObs != null &&
        (isMutationTool(toolDef?.agentMetadata) ||
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
        this.sse.publishAssistantBlocks(
          input.sessionId,
          input.runId,
          errorBlocks,
        );
        const summaryStep: AgentRunStep = {
          step: nextRunStepNumber(state.steps),
          type: 'summarize',
          name: pendingObservation.name,
          output: toolErrorHint,
        };
        const nextSteps = [...state.steps, summaryStep];
        await this.updateRun(
          input.runId,
          nextSteps,
          AgentRunStatus.success,
        );
        return {
          ...state,
          steps: nextSteps,
          pendingRespond: null,
          taskPlan: state.planAborted
            ? null
            : finalizePlanAfterSummarize(state.taskPlan),
          finalOutput:
            this.assistantArtifact.peekSerialized(
              input.sessionId,
              input.runId,
            ) ?? stored,
          status: AgentRunStatus.success,
          finished: true,
          planAborted: state.planAborted,
        };
      }
      const planSummarizeUserMessage = resolveSummarizeUserMessageForPlan(
        input.latestUserMessage,
        state.taskPlan,
      );
      const mergedPlanObservation = isPendingPlanAnswerStep(state.taskPlan)
        ? this.buildSummarizeObservationFromState(state, {
            taskPlan: state.taskPlan,
            scopedTools: state.scopedTools,
          })
        : null;
      const draftBeforeWrite =
        mergedPlanObservation != null &&
        isPlanDraftSummarizeBeforeWrite(state.taskPlan);
      let draftPendingWrite: PlanPresentSummarizeResult | null = null;
      let summarized: string;
      if (draftBeforeWrite) {
        draftPendingWrite = await this.summarizePlanPresentWithPendingWrite(
          effectiveToolName,
          toolDef?.description,
          planSummarizeUserMessage,
          mergedPlanObservation!,
          allToolObservations(state),
          input.promptMessages,
          input.sessionId,
          input.runId,
          promptScope,
          state.taskPlan,
          state.scopedTools,
        );
        summarized = draftPendingWrite.serialized;
      } else if (pendingObservation.name === CLARIFICATION_REQUEST_OBSERVATION_NAME) {
        summarized = await this.summarizeClarificationRequest(
          planSummarizeUserMessage,
          pendingObservation.output,
          input.promptMessages,
          input.sessionId,
          input.runId,
          promptScope,
          state.taskPlan,
        );
      } else if (
        pendingObservation.name === 'direct_user' ||
        pendingObservation.name === 'smalltalk'
      ) {
        summarized = mergedPlanObservation
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
            );
      } else if (pendingObservation.name === 'direct_reply') {
        summarized = await this.summarizeDirectLlmReply(
          input.latestUserMessage,
          pendingObservation.output,
          input.promptMessages,
          input.sessionId,
          input.runId,
          promptScope,
        );
      } else {
        summarized = await this.summarizeToolOutputForUser(
          effectiveToolName,
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
      }
      if (!summarized || summarized.trim().length === 0) {
        const fallback = messageBlocksToPlainText(
          ensureAtLeastOneTextBlock([], '抱歉，我暂时无法整理出有效回复。'),
        );
        this.logger.warn(
          `summarize returned empty runId=${input.runId} observation=${pendingObservation.name}`,
        );
        const summaryStep: AgentRunStep = {
          step: nextRunStepNumber(state.steps),
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
          AgentRunStatus.success,
        );
        this.sse.publishAssistantBlocks(input.sessionId, input.runId, [
          textBlock(fallback),
        ]);
        return {
          ...state,
          steps: nextSteps,
          pendingRespond: null,
          taskPlan: finalizePlanAfterSummarize(state.taskPlan),
          finalOutput:
            this.assistantArtifact.peekSerialized(
              input.sessionId,
              input.runId,
            ) ?? stored,
          status: AgentRunStatus.success,
          finished: true,
        };
      }
      const storedSummarized = this.sanitizeFinalOutput(summarized);
      const storedBlocks = tryParseStoredMessageBlocks(storedSummarized);
      const artifactPlain = this.assistantArtifact.peek(
        input.sessionId,
        input.runId,
      )
        ? this.assistantArtifact.formatOutput(
            input.sessionId,
            input.runId,
            storedSummarized,
          ).stepPlain
        : null;
      const draftStepPlain =
        draftPendingWrite &&
        isUsablePlanMutationPreviewDraft(draftPendingWrite.draftReply)
          ? draftPendingWrite.draftReply.trim()
          : null;
      const stepPlain =
        draftStepPlain ??
        artifactPlain ??
        (storedBlocks && storedBlocks.length > 0
          ? messageBlocksToPlainText(storedBlocks)
          : storedSummarized);
      const summaryStep: AgentRunStep = {
        step: nextRunStepNumber(state.steps),
        type: 'summarize',
        name: this.resolveSummarizeStepName(
          state.taskPlan,
          pendingObservation.name,
        ),
        output: stepPlain,
        meta: this.resolveSummarizeStepMeta(pendingObservation),
      };
      const nextSteps = [...state.steps, summaryStep];
      const terminalTurnRespond = isTerminalTurnRespondPending(
        state.pendingRespond,
      );
      const taskPlanAfterSummarize =
        state.planAborted || terminalTurnRespond
          ? state.planAborted
            ? null
            : state.taskPlan
          : finalizePlanAfterSummarize(state.taskPlan);
      const continuePlan =
        !terminalTurnRespond &&
        !state.planAborted &&
        !(toolErrorObs != null && isTerminalPlanToolError(toolErrorObs)) &&
        shouldContinuePlanAfterSummarize(taskPlanAfterSummarize);
      if (continuePlan) {
        this.assistantArtifact.rephase(input.sessionId, input.runId, 'draft');
      }
      await this.updateRun(
        input.runId,
        nextSteps,
        continuePlan ? AgentRunStatus.running : AgentRunStatus.success,
      );
      let observationsWithMachineLayer = state.toolObservations;
      if (draftBeforeWrite && draftPendingWrite?.machineLayerDirty) {
        const patchResult = patchLatestPlanComposeWriteObservation(
          state.toolObservations,
          draftPendingWrite.machineLayer!,
        );
        observationsWithMachineLayer = patchResult.observations;
        if (!patchResult.patched) {
          this.logger.warn(
            `plan_compose_write patch missed: observation not found runId=${input.runId} tool=${draftPendingWrite.machineLayer?.tool ?? 'unknown'}`,
          );
        }
      }
      const pendingWriteForGate =
        draftBeforeWrite && taskPlanAfterSummarize
          ? resolveComposedWriteGateCall({
              observations: observationsWithMachineLayer,
              taskPlan: taskPlanAfterSummarize,
              scopedTools: state.scopedTools,
              pageContext: state.pageContext ?? null,
            })
          : null;
      if (draftBeforeWrite && taskPlanAfterSummarize && !pendingWriteForGate) {
        this.logger.warn(
          `compose gate unresolved after present runId=${input.runId} tool=${draftPendingWrite?.machineLayer?.tool ?? 'unknown'}`,
        );
      }
      if (
        draftBeforeWrite &&
        pendingWriteForGate &&
        draftPendingWrite &&
        taskPlanAfterSummarize &&
        !isUsablePlanMutationPreviewDraft(
          draftPendingWrite.draftReply,
          state.scopedTools.find((tool) => tool.name === pendingWriteForGate.name),
          draftPendingWrite.submitText,
        )
      ) {
        const enriched = enrichPlanPresentDisplayForGate({
          pending: draftPendingWrite,
          gateCall: pendingWriteForGate,
          observations: observationsWithMachineLayer,
          taskPlan: taskPlanAfterSummarize,
          scopedTools: state.scopedTools,
        });
        let serialized = draftPendingWrite.serialized;
        const enrichedWriteTool = state.scopedTools.find(
          (tool) => tool.name === pendingWriteForGate.name,
        );
        if (
          isUsablePlanMutationPreviewDraft(
            enriched.draftReply,
            enrichedWriteTool,
            enriched.submitText,
          )
        ) {
          const turnId =
            this.assistantArtifact.peekTurnId(input.sessionId, input.runId) ??
            undefined;
          const blocks = this.sse.publishAssistantBlocks(
            input.sessionId,
            input.runId,
            [textBlock(enriched.draftReply, 'markdown')],
            { turnId, phase: 'draft' },
          );
          serialized = serializeMessageBlocksForStorage(blocks);
        }
        draftPendingWrite = {
          ...draftPendingWrite,
          ...enriched,
          serialized,
        };
      }
      const draftWriteTool = pendingWriteForGate
        ? state.scopedTools.find((tool) => tool.name === pendingWriteForGate.name)
        : undefined;
      const draftReplyContent =
        continuePlan && draftPendingWrite && pendingWriteForGate
          ? resolvePlanDraftReplyContentForGateObservation({
              draftReply: draftPendingWrite.draftReply,
              submitText: draftPendingWrite.submitText,
              gateCall: pendingWriteForGate,
              writeTool: draftWriteTool,
            })
          : null;
      const draftObservation =
        draftReplyContent != null
          ? buildPlanDraftReplyObservation({
              draftReply: draftReplyContent.draftReply,
              submitText: draftReplyContent.submitText,
              planStepId: getPendingPlanStep(state.taskPlan)?.id ?? null,
              pendingWriteToolCall: pendingWriteForGate,
            })
          : null;
      const observationsAfterDraft = draftObservation
        ? [...observationsWithMachineLayer, draftObservation]
        : observationsWithMachineLayer;
      const pendingToolCallsFromDraft =
        pendingWriteForGate != null ? [pendingWriteForGate] : [];
      if (pendingToolCallsFromDraft.length > 0) {
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          '正在准备写操作确认…\n',
          'delta',
        );
      } else if (continuePlan) {
        this.sse.emitThink(
          input.sessionId,
          input.runId,
          '中间结果已生成，继续执行后续任务步骤…\n',
          'delta',
        );
      }
      return {
        ...state,
        steps: nextSteps,
        toolObservations: observationsAfterDraft,
        pendingRespond: null,
        pendingToolCalls: pendingToolCallsFromDraft,
        taskPlan: taskPlanAfterSummarize,
        finalOutput: this.graphFinalOutputFromArtifact(
          input.sessionId,
          input.runId,
          continuePlan,
          state.finalOutput,
        ),
        status: continuePlan ? AgentRunStatus.running : AgentRunStatus.success,
        finished: !continuePlan,
        planAborted: state.planAborted,
      };
    };
    // 图路由：
    // START -> intent -> plan -> readiness -> llm | summarize
    // START -> plan（用户指定 skillId，跳过 intent）
    // llm -> resultCheck -> tools | summarize | llm
    // tools -> resultCheck -> llm | summarize | expand->llm
    const graph = new StateGraph(State)
      .addNode('intent', intent)
      .addNode('plan', plan)
      .addNode('readiness', readiness)
      .addNode('llm', llm)
      .addNode('tools', tools)
      .addNode('resultCheck', resultCheck)
      .addNode('summarize', summarize)
      .addConditionalEdges(START, (s: AgentGraphState) => {
        if (input.resumeFromWriteConfirm) {
          if (shouldRouteToRespond(s)) {
            return 'summarize';
          }
          return 'resultCheck';
        }
        if (input.resumeFromLlm) {
          return 'llm';
        }
        if (requestedSkillCtx) {
          return 'plan';
        }
        return 'intent';
      })
      .addConditionalEdges('intent', (s: AgentGraphState) => {
        if (s.finished) {
          return END;
        }
        if (shouldRouteToRespond(s)) {
          return 'summarize';
        }
        return 'plan';
      })
      .addConditionalEdges('plan', (s: AgentGraphState) => {
        if (s.finished) {
          return END;
        }
        if (shouldRouteToRespond(s)) {
          return 'summarize';
        }
        return 'readiness';
      })
      .addConditionalEdges('readiness', (s: AgentGraphState) => {
        if (s.finished) {
          return END;
        }
        if (shouldRouteToRespond(s)) {
          return 'summarize';
        }
        return 'llm';
      })
      .addConditionalEdges('llm', (state: AgentGraphState) => {
        if (state.finished) {
          return END;
        }
        if (shouldRouteToRespond(state)) {
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
        if (shouldRouteToRespond(state)) {
          return 'summarize';
        }
        if (
          shouldRouteGraphToTools({
            pendingToolCalls: state.pendingToolCalls,
            taskPlan: state.taskPlan,
            scopedTools: state.scopedTools,
            observations: selectObservationsForPagedGatherResume(
              planObservationBucketsFromState(state),
            ),
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
        if (state.pendingToolCalls.length > 0) {
          return 'tools';
        }
        return 'llm';
      });
    const app = graph.compile();
    const defaultInitial: AgentGraphState = {
      iteration: 0,
      steps: [],
      toolObservations: [],
      pendingToolCalls: [],
      pendingRespond: null,
      intentKind: 'task',
      finalOutput: '',
      status: AgentRunStatus.running,
      finished: false,
      scopedTools: requestedSkillCtx?.scoped.scopedTools ?? input.tools,
      scopedLangChainTools:
        requestedSkillCtx?.scoped.scopedLangChainTools ??
        input.langChainTools.tools,
      scopedToolBundle:
        requestedSkillCtx?.scoped.scopedToolBundle ?? input.langChainTools,
      scopedAllowedToolIds:
        requestedSkillCtx?.scoped.scopedAllowedToolIds ?? input.allowedToolIds,
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
      planRunContext: resolveInitialPlanRunContext({
        resumeFromWriteConfirm: input.resumeFromWriteConfirm,
        graphInitialState: input.graphInitialState,
      }),
      pageContext: input.pageContext ?? null,
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
    state: Pick<
      AgentGraphState,
      'preloadedToolObservations' | 'toolObservations'
    >,
    planContext?: {
      taskPlan?: TaskPlanSnapshot | null;
      scopedTools?: AgentGraphState['scopedTools'];
    },
  ): ToolObservation {
    return buildPlanSummarizeObservation({
      userMessage,
      summarizeObservation: this.buildSummarizeObservationFromState(
        state,
        planContext,
      ),
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

  private async summarizeWriteConfirmResume(input: {
    payload: WriteConfirmResumeSummaryPayload;
    mergedToolOutput: unknown;
    toolResultsText?: string;
    confirmedPreviewSerialized: string | null;
    promptMessages: LlmChatMessage[];
    sessionId: string;
    runId: number;
    turnId: number;
    scope: { appClientId: number; agentId: number };
    taskPlan?: TaskPlanSnapshot | null;
  }): Promise<string> {
    const {
      payload,
      mergedToolOutput,
      toolResultsText,
      confirmedPreviewSerialized,
      promptMessages,
      sessionId,
      runId,
      turnId,
      scope,
      taskPlan,
    } = input;
    const fallbackPlain = this.buildWriteConfirmResumeFallbackPlainText(payload);
    const fallbackBlocks = this.buildWriteConfirmResumeFallbackBlocks(payload);
    const turnIdResolved =
      this.assistantArtifact.peekTurnId(sessionId, runId) ?? turnId;

    const publishFinalBlocks = (blocks: MessageBlock[]): string => {
      const sanitized = this.sse.publishAssistantBlocks(
        sessionId,
        runId,
        blocks,
        { turnId: turnIdResolved, phase: 'final' },
      );
      return serializeMessageBlocksForStorage(
        sanitized.length > 0 ? sanitized : blocks,
      );
    };

    if (payload.outcome === 'failed') {
      return publishFinalBlocks(fallbackBlocks);
    }

    const confirmedPreview = parseConfirmedPreviewBlocks(
      confirmedPreviewSerialized,
    );
    if (confirmedPreview.length > 0) {
      const observationStructured = buildRuleBasedMessageBlocks({
        output: mergedToolOutput,
        userMessage: payload.userMessage,
        fieldLabels: {},
      }).filter(isStructuredMessageBlock);
      const merged = mergeConfirmedPreviewWithExecutionStatus({
        confirmedPreview,
        executionStatusBlocks: fallbackBlocks,
        observationStructuredBlocks: observationStructured,
      });
      return publishFinalBlocks(merged);
    }

    const agentPrompts = promptMessages.filter(
      (message) =>
        message.role === 'system' && message.content.includes('<agent_prompt>'),
    );
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
          toolResultsJson: toolResultsText,
        }),
      },
    ];
    try {
      const { blocks } = await this.sse.streamSummarizeMessageBlocks(
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
      const published = this.sse.publishAssistantBlocks(
        sessionId,
        runId,
        fallbackBlocks,
      );
      return serializeMessageBlocksForStorage(
        published.length > 0 ? published : fallbackBlocks,
      );
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

  private filterUsableToolObservations(
    observations: ToolObservation[],
  ): ToolObservation[] {
    return observations.filter(
      (row) =>
        row.output != null && !isAgentToolErrorObservation(row.output),
    );
  }

  /** working memory + current run 分块，供 summarize 使用（不再扁平 merge 列表）。 */
  private buildSummarizeObservationFromState(
    state: Pick<
      AgentGraphState,
      'preloadedToolObservations' | 'toolObservations'
    >,
    planContext?: {
      taskPlan?: TaskPlanSnapshot | null;
      scopedTools?: AgentGraphState['scopedTools'];
    },
  ): ToolObservation | null {
    const rawSplit = splitToolObservationsFromState(state);
    const usableSplit: SplitToolObservationsOutput = {
      workingMemory: this.filterUsableToolObservations(rawSplit.workingMemory),
      currentRun: this.filterUsableToolObservations(rawSplit.currentRun),
    };
    const memoryScope = resolveSummarizeMemoryScope({
      split: usableSplit,
      plan: planContext?.taskPlan,
      scopedTools: planContext?.scopedTools,
    });
    const split = applySummarizeMemoryScope(usableSplit, memoryScope);
    if (split.workingMemory.length === 0 && split.currentRun.length === 0) {
      return null;
    }
    const primary =
      resolvePrimaryObservationForSummarize(split) ??
      split.currentRun[split.currentRun.length - 1] ??
      split.workingMemory[split.workingMemory.length - 1];
    return {
      name: SPLIT_TOOL_OBSERVATIONS_NAME,
      output: split,
      quality: primary?.quality ?? 'high',
      fieldLabels: primary?.fieldLabels,
      fieldDescriptions: primary?.fieldDescriptions,
      enumLabelsByPath: primary?.enumLabelsByPath,
      llmPayload: primary?.llmPayload,
    };
  }

  /** llm 不再调工具时：一律走 summarize，统一用户可见回复口径。 */
  private resolveLlmCompletionAfterTools(
    userMessage: string,
    llmText: string,
    state: Pick<
      AgentGraphState,
      'preloadedToolObservations' | 'toolObservations'
    >,
    planContext?: {
      taskPlan?: TaskPlanSnapshot | null;
      scopedTools?: AgentGraphState['scopedTools'];
    },
  ): { observation: ToolObservation } | null {
    const summarizeObservation = this.buildSummarizeObservationFromState(
      state,
      planContext,
    );
    if (summarizeObservation) {
      return { observation: summarizeObservation };
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
      const { blocks } = await this.sse.streamSummarizeMessageBlocks(
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
      const blocks = this.sse.publishAssistantBlocks(sessionId, runId, [
        textBlock(fallback),
      ]);
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

  private parseClarificationRequestOutput(output: unknown): {
    missingFields: Array<{ name: string; hint: string }>;
    planStepId?: string;
    toolRole?: string;
  } {
    if (!output || typeof output !== 'object' || Array.isArray(output)) {
      return { missingFields: [] };
    }
    const row = output as Record<string, unknown>;
    const rawFields = row.missingFields;
    const missingFields = Array.isArray(rawFields)
      ? rawFields
          .map((item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
              return null;
            }
            const field = item as Record<string, unknown>;
            const name = typeof field.name === 'string' ? field.name.trim() : '';
            const hint = typeof field.hint === 'string' ? field.hint.trim() : '';
            if (!name || !hint) {
              return null;
            }
            return { name, hint };
          })
          .filter((item): item is { name: string; hint: string } => item != null)
      : [];
    return {
      missingFields,
      planStepId:
        typeof row.planStepId === 'string' ? row.planStepId : undefined,
      toolRole: typeof row.toolRole === 'string' ? row.toolRole : undefined,
    };
  }

  private async summarizeClarificationRequest(
    userMessage: string,
    output: unknown,
    promptMessages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    scope: { appClientId: number; agentId: number },
    taskPlan?: TaskPlanSnapshot | null,
  ): Promise<string> {
    const parsed = this.parseClarificationRequestOutput(output);
    const planContext = formatPlanContextForSummarize(taskPlan);
    const missingFieldsText =
      parsed.missingFields.length > 0
        ? parsed.missingFields
            .map((field) => `- ${field.name}: ${field.hint}`)
            .join('\n')
        : '(none listed)';
    const agentPrompts = promptMessages.filter(
      (message) =>
        message.role === 'system' && message.content.includes('<agent_prompt>'),
    );
    const summarizeMessages: LlmChatMessage[] = [...agentPrompts];
    summarizeMessages.push({
      role: 'system',
      content: await this.promptRegistry.render(
        PROMPT_KEYS.PLATFORM_MESSAGE_BLOCKS_SPEC,
        scope,
      ),
    });
    summarizeMessages.push({
      role: 'system',
      content: await this.promptRegistry.render(
        PROMPT_KEYS.AGENT_RESPOND_CLARIFICATION,
        scope,
      ),
    });
    summarizeMessages.push({
      role: 'user',
      content: [
        `User request: ${userMessage}`,
        planContext ? `<plan_context>\n${planContext}\n</plan_context>` : null,
        parsed.toolRole ? `Pending tool role: ${parsed.toolRole}` : null,
        `Missing fields:\n${missingFieldsText}`,
      ]
        .filter((line): line is string => line != null && line.length > 0)
        .join('\n'),
    });
    const fallback =
      parsed.missingFields.length > 0
        ? `请补充以下信息：${parsed.missingFields.map((field) => field.hint).join('；')}`
        : '请补充更具体的查询条件后我再试一次。';
    try {
      const { blocks } = await this.sse.streamSummarizeMessageBlocks(
        summarizeMessages,
        sessionId,
        runId,
        [],
        fallback,
      );
      return serializeMessageBlocksForStorage(blocks);
    } catch (error) {
      this.logger.warn(
        `clarification summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return serializeMessageBlocksForStorage([textBlock(fallback)]);
    }
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
      const { blocks } = await this.sse.streamSummarizeMessageBlocks(
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
      const blocks = this.sse.publishAssistantBlocks(sessionId, runId, [
        textBlock(fallback),
      ]);
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

  private resolveSummarizeStepMeta(
    observation: ToolObservation,
  ): AgentRunStep['meta'] | undefined {
    if (!isSplitToolObservationsOutput(observation.output)) {
      return undefined;
    }
    const memoryScope = observation.output.memoryScope;
    if (!memoryScope) {
      return undefined;
    }
    return { memoryScope };
  }

  /** Plan present 步：基于 plan_compose_write 机器层参数生成用户草稿，供写确认快路径。 */
  private async summarizePlanPresentWithPendingWrite(
    toolName: string,
    toolDescription: string | undefined,
    userMessage: string,
    mergedObservation: ToolObservation,
    toolObservations: ToolObservation[],
    promptMessages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    scope: { appClientId: number; agentId: number },
    taskPlan: TaskPlanSnapshot | null | undefined,
    scopedTools: AgentEngineTool[],
  ): Promise<PlanPresentSummarizeResult> {
    const planContext = formatPlanContextForSummarize(taskPlan);
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
    const serializedOutput = this.stringifyForPrompt(primaryOutput);
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
      this.assistantArtifact.peekTurnId(sessionId, runId) ?? undefined;
    const logDraftWarn = (message: string) => {
      this.logger.warn(`${message} runId=${runId}`);
    };

    const publishUserDraftBlocks = (
      draftMarkdown: string,
      previewWriteTool?: AgentEngineTool,
      machineSubmitText?: string | null,
    ) => {
      const normalizedDraft = draftMarkdown.trim();
      const displayDraft =
        normalizedDraft &&
        isUsablePlanMutationPreviewDraft(
          normalizedDraft,
          previewWriteTool,
          machineSubmitText,
        )
          ? normalizedDraft
          : '';
      const llmBlocks = displayDraft
        ? [textBlock(displayDraft, 'markdown')]
        : [];
      const merged = ensureAtLeastOneTextBlock(llmBlocks, displayDraft);
      return this.sse.publishAssistantBlocks(sessionId, runId, merged, {
        turnId,
        phase: 'draft',
      });
    };

    const emptyDraftResult = (
      draftReply: string,
      machineLayer: PlanComposeWriteObservationOutput | null = null,
    ): PlanPresentSummarizeResult => {
      const blocks = publishUserDraftBlocks(draftReply);
      return {
        draftReply: draftReply.trim(),
        submitText: '',
        pendingWriteToolCall: null,
        machineLayer,
        machineLayerDirty: false,
        serialized: serializeMessageBlocksForStorage(blocks),
      };
    };

    if (writeTools.length === 0) {
      logDraftWarn('plan present skipped: no write tools in plan step');
      return emptyDraftResult('');
    }
    if (!composed) {
      logDraftWarn('plan present skipped: missing plan_compose_write observation');
      return emptyDraftResult('');
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
      serializedOutput,
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
        llmService: this.llmService,
        agentPrompts,
        promptRegistry: this.promptRegistry,
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
      promptRegistry: this.promptRegistry,
      scope,
    });
    const summarizeDebugFile = emitLlmPromptDebug(
      (message) => this.logger.log(message),
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
      this.logger.log(
        `LLM plan present prompt file runId=${runId} path=${summarizeDebugFile}`,
      );
    }
    this.sse.emitThink(sessionId, runId, '正在整理写操作草稿…\n', 'delta');

    const draftReply = await invokePlanPresentFromCompose({
      llmService: this.llmService,
      agentPrompts,
      promptRegistry: this.promptRegistry,
      scope,
      userContext,
      logWarn: logDraftWarn,
      onExplainDelta: (delta) => {
        if (!delta) {
          return;
        }
        this.sse.emitMessageBlocks(sessionId, runId, [textBlock(delta, 'markdown')], {
          mode: 'delta',
          action: 'stream',
          turnId,
        });
      },
    });

    const userLayer = buildPlanPresentUserLayer({
      composed: machineLayer,
      draftReply,
      taskPlanBeforeFinalize: taskPlan,
      scopedTools,
    });
    const machineSubmit = writeToolDef
      ? extractSubmitTextFromWriteArguments(machineLayer.arguments, writeToolDef)
      : null;
    const blocks = publishUserDraftBlocks(
      userLayer.draftReply,
      writeToolDef,
      machineSubmit,
    );
    const serialized = serializeMessageBlocksForStorage(blocks);
    return {
      ...userLayer,
      pendingWriteToolCall: null,
      machineLayer,
      machineLayerDirty,
      serialized,
    };
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
    const splitOutput = isSplitToolObservationsOutput(output) ? output : null;
    const primaryObservation = splitOutput
      ? resolvePrimaryObservationForSummarize(splitOutput)
      : null;
    const primaryOutput = primaryObservation?.output ?? output;
    const fullDetail = isUserRequestingFullDetail(userMessage);
    const toolErrorObs = isAgentToolErrorObservation(primaryOutput)
      ? primaryOutput
      : null;
    const summarizeScenario =
      isMutationTool(agentMetadata) ||
      classifySummarizeScenario(userMessage) === 'action'
        ? ('action' as const)
        : ('read' as const);
    const planContext = formatPlanContextForSummarize(taskPlan);

    const serialized = this.stringifyForPrompt(primaryOutput);
    const splitObservationsText = splitOutput
      ? formatSplitToolObservationsForSummarize(splitOutput)
      : null;
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
      output: primaryOutput,
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
    const mapReduceFetchNote = formatMapReduceFetchStatusNote(primaryOutput);
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
        splitObservationsText
          ? `Tool observations (prefer current_run_observations for the latest request):\n${splitObservationsText}`
          : `Tool result: ${serialized}`,
      ]
        .filter((line): line is string => line != null && line.length > 0)
        .join('\n'),
    });
    const fallbackPlainText = this.buildSummarizeFallbackPlainText(
      toolName,
      primaryOutput,
      ruleBlocks,
    );

    try {
      const { blocks } = await this.sse.streamSummarizeMessageBlocks(
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
    const published = this.sse.publishAssistantBlocks(
      sessionId,
      runId,
      fallbackBlocks,
    );
    return serializeMessageBlocksForStorage(
      published.length > 0 ? published : fallbackBlocks,
    );
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
