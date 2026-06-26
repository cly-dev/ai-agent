import type { LlmChatMessage } from '../../../../../llm/llm.types';
import { PROMPT_KEYS } from '../../../../../prompt/prompt-template.keys';
import { AIMessage } from '@langchain/core/messages';
import type { MessageBlock } from '../../../message/message-blocks.types';
import {
  buildRuleBasedMessageBlocks,
  ensureAtLeastOneTextBlock,
  filterLlmBlocksAvoidDuplicatingRule,
  isStructuredMessageBlock,
  mergeSummarizeBlocksForStorage,
  messageBlocksToPlainText,
  serializeMessageBlocksForStorage,
  textBlock,
} from '../../../message/message-blocks.util';
import type { WriteConfirmResumeSummaryPayload } from '../../../write-confirm-resume-summary.util';
import {
  formatWriteConfirmResumeSummarizeUserMessage,
} from '../../../write-confirm-resume-summary.util';
import {
  mergeConfirmedPreviewWithExecutionStatus,
  parseConfirmedPreviewBlocks,
} from '../../../write-confirm-resume-blocks.util';
import { splitToolObservationsFromState } from '../../../graph-tool-observations.util';
import {
  isMutationTool,
  resolveToolStepMachineCode,
} from '../../../tool/tool-execution-status.util';
import {
  formatSplitObservationsPromptBlock,
  formatSplitToolObservationsForSummarize,
  isSplitToolObservationsOutput,
  resolvePrimaryObservationForSummarize,
  type SplitToolObservationsOutput,
} from '../../../observation-format.util';
import { formatFieldLabelsForPrompt } from '../../../../../tool-engine/tool-output-projection.util';
import {
  classifySummarizeScenario,
  isUserRequestingFullDetail,
} from '../../../user-response-style.util';
import {
  extractToolErrorUserHint,
  formatResponseSourceForDisplay,
  isAgentToolErrorObservation,
} from '../../../agent-run-user-messages.util';
import type { AgentMachineCode } from '../../../agent-run-user-messages.util';
import { isEmptyListToolObservation } from '../../../tool/tool-observation.util';
import { formatMapReduceFetchStatusNote } from '../../../gather/list-map-reduce.util';
import { extractLlmUserFacingText } from '../../../llm-output-sanitize.util';
import {
  formatPlanContextForSummarize,
  finalizePlanAfterSummarize,
  isPendingPlanAnswerStep,
  resolveSummarizeUserMessageForPlan,
} from '../../plan/task-plan.util';
import type { PlanSummarizePublishMode, TaskPlanSnapshot } from '../../plan/task-plan.types';
import { resolveSummarizeLlmDelivery } from '../../summarize/summarize-llm-delivery.util';
import type { PlanPresentSummarizeResult } from '../../plan-present/plan-draft-summarize.util';
import { runPlanPresentSummarize } from '../../plan-present/plan-present-orchestrate.util';
import {
  runPlanReasonHostFill,
  type PlanReasonHostFillResult,
} from '../../plan-present/plan-reason-host-orchestrate.util';
import {
  applySummarizeMemoryScope,
  resolveSummarizeMemoryScope,
} from '../../summarize/summarize-memory-scope.util';
import type { HostToolDecisionDefinition } from '../../../../../host-bridge/host-tool-decision.types';
import type { AgentEngineTool, ToolObservation } from '../../types/agent-engine.types';
import type { AgentGraphDeps } from '../types/graph.types';
import { stringifyForPrompt } from '../runtime/decision.util';
import { buildPlanContextForSummarize } from '../../host-tool/host-tool-fill-alignment.util';
import {
  buildSummarizeFallbackPlainText,
  buildWriteConfirmResumeFallbackBlocks,
  buildWriteConfirmResumeFallbackPlainText,
  extractDirectReplyDraft,
  extractDirectUserGuidanceHint,
  parseClarificationRequestOutput,
  resolveSummarizePromptKey,
  resolveToolStepCode,
} from './observation.util';

export async function summarizeWriteConfirmResume(deps: AgentGraphDeps, input: {
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
    const fallbackPlain = buildWriteConfirmResumeFallbackPlainText(payload);
    const fallbackBlocks = buildWriteConfirmResumeFallbackBlocks(payload);
    const turnIdResolved =
      deps.assistantArtifact.peekTurnId(sessionId, runId) ?? turnId;

    const publishFinalBlocks = (blocks: MessageBlock[]): string => {
      const sanitized = deps.sse.publishAssistantBlocks(
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
        content: await deps.promptRegistry.render(
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
      const { blocks } = await deps.sse.summarizeMessageBlocks(
        summarizeMessages,
        sessionId,
        runId,
        fallbackBlocks,
        fallbackPlain,
        resolveSummarizeLlmDelivery(
          PROMPT_KEYS.AGENT_SUMMARIZE_WRITE_CONFIRM_RESUME,
        ),
      );
      return serializeMessageBlocksForStorage(blocks);
    } catch (error) {
      deps.logger.warn(
        `write confirm resume summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const published = deps.sse.publishAssistantBlocks(
        sessionId,
        runId,
        fallbackBlocks,
      );
      return serializeMessageBlocksForStorage(
        published.length > 0 ? published : fallbackBlocks,
      );
    }
  }

export async function summarizeDirectLlmReply(deps: AgentGraphDeps, 
    userMessage: string,
    output: unknown,
    promptMessages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    scope: { appClientId: number; agentId: number },
  ): Promise<string> {
    const draftReply = extractDirectReplyDraft(output);
    const fallback = draftReply || '抱歉，我暂时无法回答这个问题。';
    const agentPrompts = promptMessages.filter(
      (message) =>
        message.role === 'system' && message.content.includes('<agent_prompt>'),
    );
    const summarizeMessages: LlmChatMessage[] = [
      ...agentPrompts,
      {
        role: 'system',
        content: await deps.promptRegistry.render(
          PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS,
          scope,
        ),
      },
      {
        role: 'user',
        content: [
          `User request: ${userMessage}`,
          `Assistant draft (polish as user-facing Markdown; do not invent facts beyond the draft): ${draftReply}`,
        ].join('\n'),
      },
    ];
    try {
      const { blocks } = await deps.sse.summarizeMessageBlocks(
        summarizeMessages,
        sessionId,
        runId,
        [],
        fallback,
        resolveSummarizeLlmDelivery(PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS),
      );
      return serializeMessageBlocksForStorage(blocks);
    } catch (error) {
      deps.logger.warn(
        `direct reply summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const blocks = deps.sse.publishAssistantBlocks(sessionId, runId, [
        textBlock(fallback),
      ]);
      return serializeMessageBlocksForStorage(blocks);
    }
  }

export async function summarizeClarificationRequest(deps: AgentGraphDeps, 
    userMessage: string,
    output: unknown,
    promptMessages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    scope: { appClientId: number; agentId: number },
    taskPlan?: TaskPlanSnapshot | null,
    publishMode?: PlanSummarizePublishMode,
  ): Promise<string> {
    const parsed = parseClarificationRequestOutput(output);
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
      content: await deps.promptRegistry.render(
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
      const { blocks } = await deps.sse.summarizeMessageBlocks(
        summarizeMessages,
        sessionId,
        runId,
        [],
        fallback,
        resolveSummarizeLlmDelivery(PROMPT_KEYS.AGENT_RESPOND_CLARIFICATION),
        publishMode,
      );
      return serializeMessageBlocksForStorage(blocks);
    } catch (error) {
      deps.logger.warn(
        `clarification summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const published = deps.sse.publishAssistantBlocks(sessionId, runId, [
        textBlock(fallback),
      ]);
      return serializeMessageBlocksForStorage(
        published.length > 0 ? published : [textBlock(fallback)],
      );
    }
  }

export async function summarizeDirectUserMessage(deps: AgentGraphDeps, 
    userMessage: string,
    output: unknown,
    promptMessages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    scope: { appClientId: number; agentId: number },
    taskPlan?: TaskPlanSnapshot | null,
    publishMode?: PlanSummarizePublishMode,
  ): Promise<string> {
    const guidanceHint = extractDirectUserGuidanceHint(output);
    const planContext = formatPlanContextForSummarize(taskPlan);
    const planAnswerStep = isPendingPlanAnswerStep(taskPlan);
    const fallback = guidanceHint || 'Hello! How can I help you?';
    const summarizePromptKey = planAnswerStep || guidanceHint
      ? PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS
      : PROMPT_KEYS.AGENT_SUMMARIZE_SMALLTALK;
    const agentPrompts = promptMessages.filter(
      (message) =>
        message.role === 'system' && message.content.includes('<agent_prompt>'),
    );
    const summarizeMessages: LlmChatMessage[] = [...agentPrompts];
    summarizeMessages.push({
      role: 'system',
      content: await deps.promptRegistry.render(summarizePromptKey, scope),
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
      const { blocks } = await deps.sse.summarizeMessageBlocks(
        summarizeMessages,
        sessionId,
        runId,
        [],
        fallback,
        resolveSummarizeLlmDelivery(summarizePromptKey),
        publishMode,
      );
      return serializeMessageBlocksForStorage(blocks);
    } catch (error) {
      deps.logger.warn(
        `direct user summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const blocks = deps.sse.publishAssistantBlocks(sessionId, runId, [
        textBlock(fallback),
      ]);
      return serializeMessageBlocksForStorage(blocks);
    }
  }

export async function summarizePlanReasonForHostFill(
  deps: AgentGraphDeps,
  userMessage: string,
  mergedObservation: ToolObservation,
  toolObservations: ToolObservation[],
  promptMessages: LlmChatMessage[],
  sessionId: string,
  runId: number,
  scope: { appClientId: number; agentId: number },
  taskPlan: TaskPlanSnapshot,
  scopedHostTools: HostToolDecisionDefinition[],
): Promise<PlanReasonHostFillResult> {
  return runPlanReasonHostFill(deps, {
    userMessage,
    mergedObservation,
    toolObservations,
    promptMessages,
    sessionId,
    runId,
    scope,
    taskPlan,
    scopedHostTools,
  });
}

export async function summarizePlanPresentWithPendingWrite(
  deps: AgentGraphDeps,
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
  return runPlanPresentSummarize(deps, {
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
  });
}

export async function summarizeToolOutputForUser(deps: AgentGraphDeps,
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
    publishMode?: PlanSummarizePublishMode,
    sessionObservations?: ToolObservation[],
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
    const planContext = buildPlanContextForSummarize(
      taskPlan,
      sessionObservations,
    );

    const serialized = stringifyForPrompt(primaryOutput);
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
    const summarizePromptKey = resolveSummarizePromptKey({
      taskPlan,
      fullDetail,
      summarizeScenario,
    });
    const summarizeMessages: LlmChatMessage[] = [...agentPrompts];
    summarizeMessages.push({
      role: 'system',
      content: await deps.promptRegistry.render(summarizePromptKey, scope),
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
    const fallbackPlainText = buildSummarizeFallbackPlainText(
      toolName,
      primaryOutput,
      ruleBlocks,
    );

    try {
      const { blocks } = await deps.sse.summarizeMessageBlocks(
        summarizeMessages,
        sessionId,
        runId,
        ruleBlocks,
        fallbackPlainText,
        resolveSummarizeLlmDelivery(summarizePromptKey),
        publishMode,
      );
      return serializeMessageBlocksForStorage(blocks);
    } catch (error) {
      deps.logger.warn(
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
    if (publishMode?.emitAuthoritativeFull === false) {
      deps.sse.commitAssistantArtifact(
        sessionId,
        runId,
        fallbackBlocks,
        publishMode.artifactPhase ?? 'draft',
      );
      return serializeMessageBlocksForStorage(fallbackBlocks);
    }
    const published = deps.sse.publishAssistantBlocks(
      sessionId,
      runId,
      fallbackBlocks,
      { phase: publishMode?.artifactPhase ?? 'final' },
    );
    return serializeMessageBlocksForStorage(
      published.length > 0 ? published : fallbackBlocks,
    );
  }
