import {
  extractSubmitTextFromDraftReply,
  extractSubmitTextFromWriteArguments,
  findMissingRequiredWriteToolArgPath,
  formatWriteToolArgumentsForUserPreview,
  injectDraftIntoWriteToolArguments,
  isUsablePlanDraftSubmitText,
  writeToolArgsContainSubmitText,
  writeToolHasSubmitBodyPath,
} from '../../../../tool-engine/write-tool-draft-injection.util';
import {
  isBareMachineSubmitDisplay,
} from './plan-present-display.util';
import type {
  AgentEngineTool,
  GraphToolCall,
  ToolObservation,
} from '../types/agent-engine.types';
import type { PlanComposeWriteObservationOutput } from './plan-compose-write.util';
import {
  buildReadToolObservationMatcher,
  resolveLatestPlanComposeWrite,
} from './plan-compose-write.util';
import { normalizeWriteToolArguments } from '../../../../tool-engine/write-tool-draft-injection.util';
import { resolveLatestPlanDraftReply, resolvePlanSubmitTextForWrite } from './plan-draft-reply.util';
import {
  filterScopedToolsForPlanStep,
  finalizePlanAfterSummarize,
  getPendingPlanStep,
  getPendingPlanToolStep,
  isPlanPresentSummarizeStep,
  isPlanTextGenerationStep,
  isPlanWorkflowGateStep,
  isPlanWriteExecutionStepInMutationFlow,
  isPlanWriteToolStep,
  planExecutionContextFromState,
  resolvePlanExecutionStep,
  type PlanExecutionContext,
} from '../plan/task-plan.util';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';
import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';

export type PendingWriteToolCallPayload = {
  tool: string;
  arguments: Record<string, unknown>;
};

export type PlanDraftSummarizePendingWrite = {
  draftReply: string;
  submitText: string;
  pendingWriteToolCall: GraphToolCall | null;
};

/** present summarize 产出：用户层草稿 + 同步后的机器层 compose 真值。 */
export type PlanPresentSummarizeResult = PlanDraftSummarizePendingWrite & {
  serialized: string;
  machineLayer: PlanComposeWriteObservationOutput | null;
  /** prose supplement 等导致机器层与 compose observation 不一致，需 patch。 */
  machineLayerDirty: boolean;
};

export type FinalizePlanPendingWriteResult = {
  call: GraphToolCall | null;
  failureReason?: string;
};

/** compose → gate finalize 诊断字段（供日志排查，不改变业务行为）。 */
export type ComposedWriteGateDiagnostic = {
  composedTool: string;
  composedPlanStepId: string | null;
  taskPlanCurrentStepId: string | null;
  composedArgsSummary: string;
  normalizedArgsSummary: string;
  submitTextPreview: string | null;
  submitTextUsable: boolean;
  pageContextEntityId: string | null;
  writeToolResolved: boolean;
};

export type FinalizeComposedWriteResult = FinalizePlanPendingWriteResult & {
  diagnostic: ComposedWriteGateDiagnostic;
};

export type ResolveComposedWriteGateResult = FinalizeComposedWriteResult & {
  stage:
    | 'ok'
    | 'missing_task_plan'
    | 'missing_plan_compose_write'
    | 'finalize_failed';
};

export type ResolvePendingWriteForPlanWriteStepResult = {
  call: GraphToolCall | null;
  failureReason?: string;
  source?: 'compose' | 'draft_reply' | null;
  gateDiagnostic?: ComposedWriteGateDiagnostic;
};

const MIN_PLAN_DRAFT_SUBSTANTIVE_CHARS = 12;
const COMPOSE_GATE_LOG_ARGS_MAX_CHARS = 600;
const COMPOSE_GATE_LOG_SUBMIT_PREVIEW_MAX_CHARS = 120;

function summarizeRecordForComposeGateLog(
  value: Record<string, unknown>,
): string {
  try {
    const raw = JSON.stringify(value);
    if (raw.length <= COMPOSE_GATE_LOG_ARGS_MAX_CHARS) {
      return raw;
    }
    return `${raw.slice(0, COMPOSE_GATE_LOG_ARGS_MAX_CHARS)}…(${raw.length} chars)`;
  } catch {
    return '[unserializable]';
  }
}

/** 截断后的 write args JSON，供 compose / gate 诊断日志使用。 */
export function summarizeWriteArgsForGateLog(
  value: Record<string, unknown>,
): string {
  return summarizeRecordForComposeGateLog(value);
}

function previewSubmitTextForComposeGateLog(text: string | null): string | null {
  if (!text) {
    return null;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length <= COMPOSE_GATE_LOG_SUBMIT_PREVIEW_MAX_CHARS) {
    return trimmed;
  }
  return `${trimmed.slice(0, COMPOSE_GATE_LOG_SUBMIT_PREVIEW_MAX_CHARS)}…(${trimmed.length} chars)`;
}

function emptyComposedWriteGateDiagnostic(
  input?: Partial<ComposedWriteGateDiagnostic>,
): ComposedWriteGateDiagnostic {
  return {
    composedTool: '',
    composedPlanStepId: null,
    taskPlanCurrentStepId: null,
    composedArgsSummary: '{}',
    normalizedArgsSummary: '{}',
    submitTextPreview: null,
    submitTextUsable: false,
    pageContextEntityId: null,
    writeToolResolved: false,
    ...input,
  };
}

/** 单行日志格式，供 summarize / readiness / llm 节点复用。 */
export function formatComposedWriteGateDiagnosticForLog(
  result: Pick<FinalizeComposedWriteResult, 'failureReason' | 'diagnostic'> & {
    call: GraphToolCall | null;
  },
): string {
  const diagnostic = result.diagnostic;
  return [
    `failureReason=${result.failureReason ?? 'ok'}`,
    `tool=${diagnostic.composedTool || 'unknown'}`,
    `planStep=${diagnostic.composedPlanStepId ?? 'null'}`,
    `taskPlanStep=${diagnostic.taskPlanCurrentStepId ?? 'null'}`,
    `writeToolResolved=${diagnostic.writeToolResolved}`,
    `submitUsable=${diagnostic.submitTextUsable}`,
    `submitPreview=${diagnostic.submitTextPreview ?? 'null'}`,
    `pageContextEntityId=${diagnostic.pageContextEntityId ?? 'null'}`,
    `composedArgs=${diagnostic.composedArgsSummary}`,
    `normalizedArgs=${diagnostic.normalizedArgsSummary}`,
    `gateCall=${result.call ? 'yes' : 'no'}`,
  ].join(' ');
}

function resolveWriteToolDef(
  toolName: string,
  scopedTools: AgentEngineTool[],
  taskPlan: TaskPlanSnapshot,
  workflowRun?: WorkflowRunState | null,
  workflowNodeDefs?: WorkflowNodeDef[] | null,
): AgentEngineTool | undefined {
  const allowedTools = filterScopedToolsForPlanStep(
    scopedTools,
    taskPlan,
    workflowRun,
    workflowNodeDefs,
  );
  return allowedTools.find((tool) => tool.name === toolName);
}

function isMutationStepAfterPresentSummarize(
  afterFinalize: TaskPlanSnapshot,
): boolean {
  const nextStep = getPendingPlanStep(afterFinalize);
  if (!nextStep) {
    return false;
  }
  if (isPlanWorkflowGateStep(nextStep)) {
    return true;
  }
  if (isPlanWriteExecutionStepInMutationFlow(nextStep)) {
    return true;
  }
  return isPlanWriteToolStep(getPendingPlanToolStep(afterFinalize));
}

/** 当前 summarize 步为 present（legacy / Workflow DB），且完成后进入 await 或 write。 */
export function isPlanDraftSummarizeBeforeWrite(
  ctx: PlanExecutionContext,
): boolean {
  const { step, workflowNodeAction } = resolvePlanExecutionStep(ctx);
  if (!ctx.taskPlan || !isPlanTextGenerationStep(step, workflowNodeAction)) {
    return false;
  }
  if (!isPlanPresentSummarizeStep(step, ctx.workflowNodeDefs)) {
    return false;
  }
  const afterFinalize = finalizePlanAfterSummarize(ctx.taskPlan);
  if (!afterFinalize) {
    return false;
  }
  return isMutationStepAfterPresentSummarize(afterFinalize);
}

/** 是否为读 tool observation 兜底 dump（[toolName] + JSON），不可作用户层草稿。 */
export function isPlanDraftToolObservationDump(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }
  if (/^\[[^\]]+\]\s*(\{|\[)/.test(trimmed)) {
    return true;
  }
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/** 用户层草稿是否可用（自然语言正文，非 observation dump / 空围栏）。 */
export function isUsablePlanDraftUserFacingDraft(draft: string): boolean {
  const trimmed = draft.trim();
  if (!trimmed || isPlanDraftToolObservationDump(trimmed)) {
    return false;
  }
  const submitCandidate =
    extractSubmitTextFromDraftReply(trimmed) || trimmed;
  if (!isUsablePlanDraftSubmitText(submitCandidate)) {
    return false;
  }
  if (
    submitCandidate.replace(/\s/g, '').length <
    MIN_PLAN_DRAFT_SUBSTANTIVE_CHARS
  ) {
    return false;
  }
  return true;
}

/**
 * 写/删确认前用户层预览：有 submit body 时校验正文；纯参数类变更（delete 等）仅要求可读说明。
 */
export function isUsablePlanMutationPreviewDraft(
  draft: string,
  writeTool?: Pick<
    AgentEngineTool,
    'inputSchema' | 'schema' | 'agentMetadata' | 'description'
  >,
  machineSubmitText?: string | null,
): boolean {
  const trimmed = draft.trim();
  if (!trimmed || isPlanDraftToolObservationDump(trimmed)) {
    return false;
  }
  if (writeTool && writeToolHasSubmitBodyPath(writeTool)) {
    if (!isUsablePlanDraftUserFacingDraft(trimmed)) {
      return false;
    }
    if (
      machineSubmitText?.trim() &&
      isBareMachineSubmitDisplay(trimmed, machineSubmitText)
    ) {
      return false;
    }
    return true;
  }
  return trimmed.replace(/\s/g, '').length >= MIN_PLAN_DRAFT_SUBSTANTIVE_CHARS;
}

/** 优先机器层 arguments 中的 submit 正文，避免说明文案误入写参数。 */
export function resolveSubmitTextForWriteTool(input: {
  draftReply: string;
  arguments: Record<string, unknown>;
  writeTool: AgentEngineTool | undefined;
}): string {
  const fromArgs = input.writeTool
    ? extractSubmitTextFromWriteArguments(input.arguments, input.writeTool)
    : null;
  if (fromArgs && isUsablePlanDraftSubmitText(fromArgs)) {
    return fromArgs.trim();
  }
  const fromDraft = extractSubmitTextFromDraftReply(input.draftReply);
  if (isUsablePlanDraftSubmitText(fromDraft)) {
    return fromDraft.trim();
  }
  const trimmedDraft = input.draftReply.trim();
  return isUsablePlanDraftSubmitText(trimmedDraft) ? trimmedDraft : '';
}

/** 用户层 LLM 失败时，用机器层 submit 正文作为最小可读草稿（无 locale 固定话术）。 */
export function buildFallbackUserDraftFromSubmitText(submitText: string): string {
  return submitText.trim();
}

/** 从 plan_compose_write finalize 为可进 gate 的 pending write call（含 normalize）及诊断信息。 */
export function finalizeComposedWritePendingCallResult(input: {
  composed: PlanComposeWriteObservationOutput;
  taskPlan: TaskPlanSnapshot;
  scopedTools: AgentEngineTool[];
  observations: ToolObservation[];
  pageContext?: AgentChatPageContext | null;
}): FinalizeComposedWriteResult {
  const pageContextEntityId =
    typeof input.pageContext?.entity?.id === 'string'
      ? input.pageContext.entity.id.trim() || null
      : null;
  const composedArgsSummary = summarizeRecordForComposeGateLog(
    input.composed.arguments,
  );
  const diagnosticBase: ComposedWriteGateDiagnostic = {
    composedTool: input.composed.tool,
    composedPlanStepId: input.composed.planStepId ?? null,
    taskPlanCurrentStepId: getPendingPlanStep(input.taskPlan)?.id ?? null,
    composedArgsSummary,
    normalizedArgsSummary: composedArgsSummary,
    submitTextPreview: null,
    submitTextUsable: false,
    pageContextEntityId,
    writeToolResolved: false,
  };
  const writeTool = resolveWriteToolDef(
    input.composed.tool,
    input.scopedTools,
    input.taskPlan,
  );
  if (!writeTool) {
    return {
      call: null,
      failureReason: `write_tool_not_in_plan_scope:${input.composed.tool}`,
      diagnostic: diagnosticBase,
    };
  }
  const isReadToolObservation = buildReadToolObservationMatcher(input.scopedTools);
  const normalizedArgs = normalizeWriteToolArguments(
    input.composed.arguments,
    writeTool,
    input.observations,
    {
      isReadToolObservation,
      pageContext: input.pageContext ?? null,
    },
  );
  const normalizedArgsSummary = summarizeRecordForComposeGateLog(normalizedArgs);
  const payload = {
    tool: input.composed.tool,
    arguments: normalizedArgs,
  };
  const diagnosticWithNormalize: ComposedWriteGateDiagnostic = {
    ...diagnosticBase,
    normalizedArgsSummary,
    writeToolResolved: true,
  };
  if (writeToolHasSubmitBodyPath(writeTool)) {
    const submitText = extractSubmitTextFromWriteArguments(
      normalizedArgs,
      writeTool,
    );
    const submitTextUsable =
      !!submitText && isUsablePlanDraftSubmitText(submitText);
    const diagnosticWithSubmit: ComposedWriteGateDiagnostic = {
      ...diagnosticWithNormalize,
      submitTextPreview: previewSubmitTextForComposeGateLog(submitText),
      submitTextUsable,
    };
    if (!submitTextUsable) {
      return {
        call: null,
        failureReason: submitText
          ? 'submit_text_not_usable'
          : 'submit_text_missing',
        diagnostic: diagnosticWithSubmit,
      };
    }
    const finalized = finalizePlanPendingWriteToolCall({
      payload,
      taskPlan: input.taskPlan,
      scopedTools: input.scopedTools,
      submitText: submitText.trim(),
    });
    return {
      ...finalized,
      diagnostic: diagnosticWithSubmit,
    };
  }
  const finalized = finalizePlanPendingWriteToolCallFromComposedArgs({
    payload,
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools,
  });
  return {
    ...finalized,
    diagnostic: diagnosticWithNormalize,
  };
}

/** 从 plan_compose_write finalize 为可进 gate 的 pending write call（含 normalize）。 */
export function finalizeComposedWritePendingCall(input: {
  composed: PlanComposeWriteObservationOutput;
  taskPlan: TaskPlanSnapshot;
  scopedTools: AgentEngineTool[];
  observations: ToolObservation[];
  pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null {
  return finalizeComposedWritePendingCallResult(input).call;
}

/**
 * present 完成后从 compose 机器层直出 gate pending（不依赖 present LLM finalize）。
 */
export function resolveComposedWriteGateCallResult(input: {
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
  pageContext?: AgentChatPageContext | null;
}): ResolveComposedWriteGateResult {
  if (!input.taskPlan) {
    return {
      call: null,
      failureReason: 'missing_task_plan',
      stage: 'missing_task_plan',
      diagnostic: emptyComposedWriteGateDiagnostic(),
    };
  }
  const composed = resolveLatestPlanComposeWrite(input.observations);
  if (!composed) {
    return {
      call: null,
      failureReason: 'missing_plan_compose_write',
      stage: 'missing_plan_compose_write',
      diagnostic: emptyComposedWriteGateDiagnostic({
        taskPlanCurrentStepId: getPendingPlanStep(input.taskPlan)?.id ?? null,
      }),
    };
  }
  const finalized = finalizeComposedWritePendingCallResult({
    composed,
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools,
    observations: input.observations,
    pageContext: input.pageContext ?? null,
  });
  return {
    ...finalized,
    stage: finalized.call ? 'ok' : 'finalize_failed',
  };
}

export function resolveComposedWriteGateCall(input: {
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
  pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null {
  return resolveComposedWriteGateCallResult(input).call;
}

/** write 步：机器层 plan_compose_write 优先；无 compose 时再 normalize plan_draft_reply pending。 */
export function resolvePendingWriteForPlanWriteStepResult(input: {
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
  pageContext?: AgentChatPageContext | null;
}): ResolvePendingWriteForPlanWriteStepResult {
  const pendingToolStep = getPendingPlanToolStep(input.taskPlan);
  if (!input.taskPlan || !isPlanWriteExecutionStepInMutationFlow(pendingToolStep)) {
    return {
      call: null,
      failureReason: 'not_write_fallback_step',
      source: null,
    };
  }
  const composed = resolveLatestPlanComposeWrite(input.observations);
  if (composed) {
    const gate = finalizeComposedWritePendingCallResult({
      composed,
      taskPlan: input.taskPlan,
      scopedTools: input.scopedTools,
      observations: input.observations,
      pageContext: input.pageContext ?? null,
    });
    if (gate.call) {
      return {
        call: gate.call,
        source: 'compose',
        gateDiagnostic: gate.diagnostic,
      };
    }
    return {
      call: null,
      failureReason: gate.failureReason,
      source: 'compose',
      gateDiagnostic: gate.diagnostic,
    };
  }
  const draftReply = resolveLatestPlanDraftReply(input.observations);
  const pending = draftReply?.pendingWriteToolCall;
  if (!pending?.tool || !pending.arguments || typeof pending.arguments !== 'object') {
    return {
      call: null,
      failureReason: 'missing_plan_compose_write_and_draft_reply',
      source: null,
    };
  }
  const gate = finalizeComposedWritePendingCallResult({
    composed: {
      tool: pending.tool,
      arguments: pending.arguments as Record<string, unknown>,
      planStepId: pendingToolStep?.id ?? null,
    },
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools,
    observations: input.observations,
    pageContext: input.pageContext ?? null,
  });
  if (gate.call) {
    return {
      call: gate.call,
      source: 'draft_reply',
      gateDiagnostic: gate.diagnostic,
    };
  }
  return {
    call: null,
    failureReason: gate.failureReason,
    source: 'draft_reply',
    gateDiagnostic: gate.diagnostic,
  };
}

export function resolvePendingWriteForPlanWriteStep(input: {
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
  pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null {
  return resolvePendingWriteForPlanWriteStepResult(input).call;
}

/** plan_draft_reply 中 pending 无 compose 可复用时的 normalize + finalize。 */
export function finalizeDraftReplyPendingWriteCall(input: {
  tool: string;
  arguments: Record<string, unknown>;
  taskPlan: TaskPlanSnapshot;
  scopedTools: AgentEngineTool[];
  observations: ToolObservation[];
  pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null {
  const writeTool = resolveWriteToolDef(
    input.tool,
    input.scopedTools,
    input.taskPlan,
  );
  if (!writeTool) {
    return null;
  }
  const composed: PlanComposeWriteObservationOutput = {
    tool: writeTool.name,
    arguments: input.arguments,
    planStepId: null,
  };
  return finalizeComposedWritePendingCall({
    composed,
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools,
    observations: input.observations,
    pageContext: input.pageContext ?? null,
  });
}

/** write fallback 步：从 observations 中的 compose payload 直出 pending call。 */
export function resolvePendingWriteFromComposedObservation(input: {
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
  pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null {
  if (
    !input.taskPlan ||
    !isPlanWriteExecutionStepInMutationFlow(getPendingPlanToolStep(input.taskPlan))
  ) {
    return null;
  }
  const composed = resolveLatestPlanComposeWrite(input.observations);
  if (!composed) {
    return null;
  }
  return finalizeComposedWritePendingCall({
    composed,
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools,
    observations: input.observations,
    pageContext: input.pageContext ?? null,
  });
}

/**
 * gate 前从机器层 arguments 同步 submit 文案（不改用户层 draftReply）。
 */
export function syncPlanPresentSubmitTextForGate(input: {
  submitText: string;
  gateCall: GraphToolCall;
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot;
  scopedTools: AgentEngineTool[];
}): string {
  const writeTool = resolveWriteToolForGateCall(input);
  if (!writeTool) {
    return input.submitText;
  }
  const fromArgs = extractSubmitTextFromWriteArguments(
    input.gateCall.arguments,
    writeTool,
  );
  if (fromArgs && isUsablePlanDraftSubmitText(fromArgs)) {
    return fromArgs.trim();
  }
  return input.submitText;
}

function resolveWriteToolForGateCall(input: {
  gateCall: GraphToolCall;
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot;
  scopedTools: AgentEngineTool[];
}): AgentEngineTool | undefined {
  const composed = resolveLatestPlanComposeWrite(input.observations);
  if (composed != null) {
    return resolveWriteToolDef(composed.tool, input.scopedTools, input.taskPlan);
  }
  return input.scopedTools.find((tool) => tool.name === input.gateCall.name);
}

/**
 * gate 观测 `plan_draft_reply` 用户层：present 正文或 submit 兜底，不含 schema 预览。
 * schema 预览见 `buildWriteConfirmationDetailMarkdown`（仅写确认 UI fallback）。
 */
export function resolvePlanDraftReplyContentForGateObservation(input: {
  draftReply: string;
  submitText: string;
  gateCall: GraphToolCall;
  writeTool?: AgentEngineTool;
}): { draftReply: string; submitText: string } | null {
  if (!input.writeTool) {
    return null;
  }
  let submitText = input.submitText.trim();
  const fromArgs = extractSubmitTextFromWriteArguments(
    input.gateCall.arguments,
    input.writeTool,
  );
  if (!submitText && fromArgs && isUsablePlanDraftSubmitText(fromArgs)) {
    submitText = fromArgs.trim();
  }

  const userMarkdown = input.draftReply.trim();
  if (userMarkdown && !isPlanDraftToolObservationDump(userMarkdown)) {
    const resolvedSubmit =
      submitText && isUsablePlanDraftSubmitText(submitText)
        ? submitText
        : fromArgs && isUsablePlanDraftSubmitText(fromArgs)
          ? fromArgs.trim()
          : submitText;
    return {
      draftReply: userMarkdown,
      submitText: resolvedSubmit?.trim() ?? '',
    };
  }

  if (submitText && isUsablePlanDraftSubmitText(submitText)) {
    return {
      draftReply: buildFallbackUserDraftFromSubmitText(submitText),
      submitText,
    };
  }

  return null;
}

/** 写确认 UI 明细：schema 参数可读预览，不得进入用户聊天层。 */
export function buildWriteConfirmationDetailMarkdown(
  gateCall: GraphToolCall,
  writeTool: AgentEngineTool,
): string {
  return formatWriteToolArgumentsForUserPreview(
    gateCall.arguments,
    writeTool,
    writeTool.description,
  ).trim();
}

/** 校验 + schema 注入 submit 正文，失败返回 null（回退 write 步 LLM）。 */
export function finalizePlanPendingWriteToolCall(input: {
  payload: PendingWriteToolCallPayload;
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
  submitText: string;
}): FinalizePlanPendingWriteResult {
  const submitText = input.submitText.trim();
  if (!isUsablePlanDraftSubmitText(submitText)) {
    return { call: null, failureReason: 'invalid_submit_text' };
  }
  if (!input.taskPlan) {
    return { call: null, failureReason: 'missing_task_plan' };
  }
  const writeTool = resolveWriteToolDef(
    input.payload.tool,
    input.scopedTools,
    input.taskPlan,
  );
  if (!writeTool) {
    return {
      call: null,
      failureReason: `write_tool_not_allowed:${input.payload.tool}`,
    };
  }
  const args = injectDraftIntoWriteToolArguments(
    input.payload.arguments,
    submitText,
    writeTool,
  );
  return finalizePlanPendingWriteToolCallWithArgs({
    payload: { tool: writeTool.name, arguments: args },
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools,
    requireSubmitBody: true,
    writeTool,
  });
}

/** 无 submit 正文的 mutation（delete / 纯参数更新）：仅 schema 校验 composed arguments。 */
export function finalizePlanPendingWriteToolCallFromComposedArgs(input: {
  payload: PendingWriteToolCallPayload;
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
}): FinalizePlanPendingWriteResult {
  if (!input.taskPlan) {
    return { call: null, failureReason: 'missing_task_plan' };
  }
  const writeTool = resolveWriteToolDef(
    input.payload.tool,
    input.scopedTools,
    input.taskPlan,
  );
  if (!writeTool) {
    return {
      call: null,
      failureReason: `write_tool_not_allowed:${input.payload.tool}`,
    };
  }
  return finalizePlanPendingWriteToolCallWithArgs({
    payload: input.payload,
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools,
    requireSubmitBody: false,
    writeTool,
  });
}

function finalizePlanPendingWriteToolCallWithArgs(input: {
  payload: PendingWriteToolCallPayload;
  taskPlan: TaskPlanSnapshot;
  scopedTools: AgentEngineTool[];
  requireSubmitBody: boolean;
  writeTool: AgentEngineTool;
}): FinalizePlanPendingWriteResult {
  const args = { ...input.payload.arguments };
  const missingRequired = findMissingRequiredWriteToolArgPath(args, input.writeTool);
  if (missingRequired) {
    return {
      call: null,
      failureReason: `required_args_missing:${missingRequired}`,
    };
  }
  if (
    input.requireSubmitBody &&
    !writeToolArgsContainSubmitText(args, input.writeTool)
  ) {
    return { call: null, failureReason: 'submit_text_not_in_args' };
  }
  return {
    call: { name: input.writeTool.name, arguments: args },
  };
}

/**
 * present 步用户层：展示草稿与 submit 文案；机器层 pending 由 resolveComposedWriteGateCall 统一产出。
 */
export function buildPlanPresentUserLayer(input: {
  composed: PlanComposeWriteObservationOutput;
  draftReply: string;
  taskPlanBeforeFinalize: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
}): Pick<PlanDraftSummarizePendingWrite, 'draftReply' | 'submitText'> {
  const llmDraft = input.draftReply.trim();
  const taskPlanAfterFinalize = input.taskPlanBeforeFinalize
    ? finalizePlanAfterSummarize(input.taskPlanBeforeFinalize)
    : null;
  if (!taskPlanAfterFinalize) {
    return { draftReply: llmDraft, submitText: '' };
  }
  const writeTool = resolveWriteToolDef(
    input.composed.tool,
    input.scopedTools,
    taskPlanAfterFinalize,
  );
  if (!writeTool) {
    return { draftReply: llmDraft, submitText: '' };
  }
  const hasSubmitBody = writeToolHasSubmitBodyPath(writeTool);
  const submitText = hasSubmitBody
    ? resolveSubmitTextForWriteTool({
        draftReply: llmDraft,
        arguments: input.composed.arguments,
        writeTool,
      })
    : '';
  return {
    draftReply: llmDraft,
    submitText,
  };
}
