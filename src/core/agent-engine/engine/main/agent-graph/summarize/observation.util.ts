import type { LlmChatMessage } from '../../../../../llm/llm.types';
import { PROMPT_KEYS } from '../../../../../prompt/prompt-template.keys';
import type { MessageBlock } from '../../../message/message-blocks.types';
import {
  buildRuleBasedMessageBlocks,
  messageBlocksToPlainText,
  textBlock,
} from '../../../message/message-blocks.util';
import {
  formatSplitObservationsPromptBlock,
  isSplitToolObservationsOutput,
  resolvePrimaryObservationForSummarize,
  SPLIT_TOOL_OBSERVATIONS_NAME,
  type SplitToolObservationsOutput,
} from '../../../observation-format.util';
import {
  classifySummarizeScenario,
  isUserRequestingFullDetail,
} from '../../../user-response-style.util';
import {
  extractToolErrorUserHint,
  isAgentToolErrorObservation,
} from '../../../agent-run-user-messages.util';
import type { AgentMachineCode } from '../../../agent-run-user-messages.util';
import type { SkillIntentMismatchCode } from '../../../turn/skill-intent-alignment.types';
import { isEmptyListToolObservation } from '../../../tool/tool-observation.util';
import { splitToolObservationsFromState } from '../../../graph-tool-observations.util';
import {
  isMutationTool,
  resolveToolStepMachineCode,
} from '../../../tool/tool-execution-status.util';
import { extractLlmUserFacingText } from '../../../llm-output-sanitize.util';
import type { WriteConfirmResumeSummaryPayload } from '../../../write-confirm-resume-summary.util';
import {
  buildPlanSummarizeObservation,
  filterScopedToolsForPlanStep,
  isPendingPlanAnswerStep,
} from '../../plan/task-plan.util';
import type { TaskPlanSnapshot } from '../../plan/task-plan.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../../workflow/workflow.types';
import {
  applySummarizeMemoryScope,
  resolveSummarizeMemoryScope,
} from '../../summarize/summarize-memory-scope.util';
import type {
  AgentEngineTool,
  AgentGraphState,
  AgentRunStep,
  ToolObservation,
} from '../../types/agent-engine.types';
import { stringifyForPrompt } from '../runtime/decision.util';

export function isLowQualityToolObservation(observation: ToolObservation | undefined): boolean {
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

export function assessObservationQuality(
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
      return hasBusinessKeySignal(first as Record<string, unknown>)
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
      if (hasBusinessKeySignal(dataRow)) {
        return 'high';
      }
      return 'medium';
    }
    if (hasBusinessKeySignal(row)) {
      return 'high';
    }
    return 'medium';
  }

export function hasBusinessKeySignal(row: Record<string, unknown>): boolean {
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

export function resolveToolStepCode(
    quality: 'high' | 'medium' | 'low',
    output: unknown,
    agentMetadata?: unknown,
  ): AgentMachineCode | null {
    return resolveToolStepMachineCode({ quality, output, agentMetadata });
  }

export function filterUsableToolObservations(
    observations: ToolObservation[],
  ): ToolObservation[] {
    return observations.filter(
      (row) =>
        row.output != null && !isAgentToolErrorObservation(row.output),
    );
  }

export function buildSummarizeObservationFromState(
    state: Pick<
      AgentGraphState,
      'preloadedToolObservations' | 'toolObservations' | 'workflowRun'
    >,
    planContext?: {
      taskPlan?: TaskPlanSnapshot | null;
      scopedTools?: AgentGraphState['scopedTools'];
      workflowNodeDefs?: AgentGraphState['workflowNodeDefs'];
    },
  ): ToolObservation | null {
    const rawSplit = splitToolObservationsFromState(state);
    const usableSplit: SplitToolObservationsOutput = {
      workingMemory: filterUsableToolObservations(rawSplit.workingMemory),
      currentRun: filterUsableToolObservations(rawSplit.currentRun),
    };
    const memoryScope = resolveSummarizeMemoryScope({
      split: usableSplit,
      plan: planContext?.taskPlan,
      scopedTools: planContext?.scopedTools,
      workflowRun: state.workflowRun,
      workflowNodeDefs: planContext?.workflowNodeDefs,
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

export function resolveLlmCompletionAfterTools(
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
    const summarizeObservation = buildSummarizeObservationFromState(
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
      observation: buildDirectReplyObservation(
        userMessage,
        extractLlmUserFacingText(draft),
      ),
    };
  }

export function buildDirectReplyObservation(
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

export function extractDirectReplyDraft(output: unknown): string {
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

export function extractDirectUserGuidanceHint(output: unknown): string | undefined {
    if (output && typeof output === 'object' && !Array.isArray(output)) {
      const hint = (output as Record<string, unknown>).guidanceHint;
      if (typeof hint === 'string' && hint.trim().length > 0) {
        return hint.trim();
      }
    }
    return undefined;
  }

export function parseClarificationRequestOutput(output: unknown): {
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

export function parseSkillIntentMismatchOutput(output: unknown): {
    userMessage: string;
    mismatchCode: SkillIntentMismatchCode | null;
    requestedSkillId: number | null;
    requestedSkillName: string | null;
    routingReason: string | null;
  } {
    if (!output || typeof output !== 'object' || Array.isArray(output)) {
      return {
        userMessage: '',
        mismatchCode: null,
        requestedSkillId: null,
        requestedSkillName: null,
        routingReason: null,
      };
    }
    const row = output as Record<string, unknown>;
    const mismatchCode =
      typeof row.mismatchCode === 'string'
        ? (row.mismatchCode as SkillIntentMismatchCode)
        : null;
    return {
      userMessage:
        typeof row.userMessage === 'string' ? row.userMessage.trim() : '',
      mismatchCode,
      requestedSkillId:
        typeof row.requestedSkillId === 'number' ? row.requestedSkillId : null,
      requestedSkillName:
        typeof row.requestedSkillName === 'string'
          ? row.requestedSkillName.trim()
          : null,
      routingReason:
        typeof row.routingReason === 'string' ? row.routingReason.trim() : null,
    };
  }

export function buildSkillIntentMismatchFallbackPlainText(input: {
    mismatchCode: SkillIntentMismatchCode | null;
    requestedSkillName: string | null;
  }): string {
    const skillLabel = input.requestedSkillName?.trim() || '当前技能';
    switch (input.mismatchCode) {
      case 'write_intent_vs_http_only_skill':
        return `你选择了「${skillLabel}」，它主要用于数据查询或分析，无法完成页面上的填写或提交。可以取消技能选择后重新发送，或换成支持页面操作的技能。`;
      case 'write_intent_vs_no_host_skill':
        return `你选择了「${skillLabel}」，它不包含页面写入能力，无法完成填写或提交。请取消技能选择后重试，或选择带页面操作能力的技能。`;
      default:
        return `当前选择的技能与你说的话不太匹配。可以取消技能选择后按你的问题重发，或换一种与该技能匹配的说法。`;
    }
  }

export function resolveSummarizeStepName(
    taskPlan: TaskPlanSnapshot | null | undefined,
    observationName: string,
  ): string {
    const stepId = taskPlan?.currentStepId?.trim();
    if (stepId) {
      return `plan:${stepId}`;
    }
    return observationName;
  }

export function resolveSummarizeStepMeta(
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

export function resolveSummarizePromptKey(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
    fullDetail: boolean;
    summarizeScenario: ReturnType<typeof classifySummarizeScenario>;
  }): (typeof PROMPT_KEYS)[keyof typeof PROMPT_KEYS] {
    if (
      isPendingPlanAnswerStep(
        input.taskPlan,
        input.workflowRun,
        input.workflowNodeDefs,
      )
    ) {
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

export function buildSummarizeFallbackPlainText(
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
    const serialized = stringifyForPrompt(output);
    return `[${toolName}]\n${serialized}`;
  }

export function buildWriteConfirmResumeFallbackPlainText(
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

export function buildWriteConfirmResumeFallbackBlocks(
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
      textBlock(buildWriteConfirmResumeFallbackPlainText(payload)),
      ...metrics,
    ];
  }

export function assessObservationQualityForResume(
  output: unknown,
  agentMetadata?: unknown,
): 'high' | 'medium' | 'low' {
  return assessObservationQuality(output, agentMetadata);
}

export function buildPendingPlanSummaryObservation(
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
    summarizeObservation: buildSummarizeObservationFromState(state, planContext),
  });
}
