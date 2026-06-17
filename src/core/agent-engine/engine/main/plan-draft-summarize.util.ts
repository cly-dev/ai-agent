import {
  extractSubmitTextFromDraftReply,
  extractSubmitTextFromWriteArguments,
  findMissingRequiredWriteToolArgPath,
  formatWriteToolArgumentsForUserPreview,
  injectDraftIntoWriteToolArguments,
  isUsablePlanDraftSubmitText,
  writeToolArgsContainSubmitText,
  writeToolHasSubmitBodyPath,
} from '../../../tool-engine/write-tool-draft-injection.util';
import {
  isBareMachineSubmitDisplay,
} from './plan-present-display.util';
import type {
  AgentEngineTool,
  GraphToolCall,
  ToolObservation,
} from './agent-engine.types';
import type { PlanComposeWriteObservationOutput } from './plan-compose-write.util';
import {
  buildReadToolObservationMatcher,
  resolveLatestPlanComposeWrite,
} from './plan-compose-write.util';
import { normalizeWriteToolArguments } from '../../../tool-engine/write-tool-draft-injection.util';
import { resolveLatestPlanDraftReply, resolvePlanSubmitTextForWrite } from './plan-draft-reply.util';
import {
  filterScopedToolsForPlanStep,
  finalizePlanAfterSummarize,
  getPendingPlanStep,
  getPendingPlanToolStep,
  isPendingPlanAnswerStep,
  isPlanPresentSummarizeStep,
  isPlanWriteFallbackStep,
  isPlanWriteToolStep,
} from './task-plan.util';
import type { TaskPlanSnapshot } from './task-plan.types';
import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';

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

const MIN_PLAN_DRAFT_SUBSTANTIVE_CHARS = 12;

function resolveWriteToolDef(
  toolName: string,
  scopedTools: AgentEngineTool[],
  taskPlan: TaskPlanSnapshot,
): AgentEngineTool | undefined {
  const allowedTools = filterScopedToolsForPlanStep(scopedTools, taskPlan);
  return allowedTools.find((tool) => tool.name === toolName);
}

/** 当前 summarize 步为 present（或 legacy draft），且完成后下一步为 write。 */
export function isPlanDraftSummarizeBeforeWrite(
  plan: TaskPlanSnapshot | null | undefined,
): boolean {
  if (!plan || !isPendingPlanAnswerStep(plan)) {
    return false;
  }
  const pendingStep = getPendingPlanStep(plan);
  if (!isPlanPresentSummarizeStep(pendingStep)) {
    return false;
  }
  const afterFinalize = finalizePlanAfterSummarize(plan);
  if (!afterFinalize) {
    return false;
  }
  return isPlanWriteToolStep(getPendingPlanToolStep(afterFinalize));
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

/** 从 plan_compose_write finalize 为可进 gate 的 pending write call（含 normalize）。 */
export function finalizeComposedWritePendingCall(input: {
  composed: PlanComposeWriteObservationOutput;
  taskPlan: TaskPlanSnapshot;
  scopedTools: AgentEngineTool[];
  observations: ToolObservation[];
  pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null {
  const writeTool = resolveWriteToolDef(
    input.composed.tool,
    input.scopedTools,
    input.taskPlan,
  );
  if (!writeTool) {
    return null;
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
  const payload = {
    tool: input.composed.tool,
    arguments: normalizedArgs,
  };
  if (writeToolHasSubmitBodyPath(writeTool)) {
    const submitText = extractSubmitTextFromWriteArguments(
      normalizedArgs,
      writeTool,
    );
    if (!submitText || !isUsablePlanDraftSubmitText(submitText)) {
      return null;
    }
    return finalizePlanPendingWriteToolCall({
      payload,
      taskPlan: input.taskPlan,
      scopedTools: input.scopedTools,
      submitText: submitText.trim(),
    }).call;
  }
  return finalizePlanPendingWriteToolCallFromComposedArgs({
    payload,
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools,
  }).call;
}

/**
 * present 完成后从 compose 机器层直出 gate pending（不依赖 present LLM finalize）。
 */
export function resolveComposedWriteGateCall(input: {
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
  pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null {
  if (!input.taskPlan) {
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

/** write 步：机器层 plan_compose_write 优先；无 compose 时再 normalize plan_draft_reply pending。 */
export function resolvePendingWriteForPlanWriteStep(input: {
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
  pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null {
  if (
    !input.taskPlan ||
    !isPlanWriteFallbackStep(getPendingPlanToolStep(input.taskPlan))
  ) {
    return null;
  }
  const fromComposed = resolvePendingWriteFromComposedObservation(input);
  if (fromComposed) {
    return fromComposed;
  }
  const draftReply = resolveLatestPlanDraftReply(input.observations);
  const pending = draftReply?.pendingWriteToolCall;
  if (!pending?.tool || !pending.arguments || typeof pending.arguments !== 'object') {
    return null;
  }
  return finalizeDraftReplyPendingWriteCall({
    tool: pending.tool,
    arguments: pending.arguments as Record<string, unknown>,
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools,
    observations: input.observations,
    pageContext: input.pageContext ?? null,
  });
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
    !isPlanWriteFallbackStep(getPendingPlanToolStep(input.taskPlan))
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
 * present 展示层不足而 gate 已就绪时，补齐用户可见草稿（不改机器层 pending）。
 */
export function enrichPlanPresentDisplayForGate(input: {
  pending: Pick<PlanDraftSummarizePendingWrite, 'draftReply' | 'submitText'>;
  gateCall: GraphToolCall;
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot;
  scopedTools: AgentEngineTool[];
}): Pick<PlanDraftSummarizePendingWrite, 'draftReply' | 'submitText'> {
  const resolved = resolvePlanDraftReplyContentForGateObservation({
    draftReply: input.pending.draftReply,
    submitText: input.pending.submitText,
    gateCall: input.gateCall,
    writeTool: resolveWriteToolForGateCall(input),
  });
  if (resolved) {
    return resolved;
  }
  return {
    draftReply: input.pending.draftReply.trim(),
    submitText: input.pending.submitText,
  };
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
 * gate 已就绪时解析 plan_draft_reply 内容：优先 present 草稿，否则 submit / schema 预览。
 */
export function resolvePlanDraftReplyContentForGateObservation(input: {
  draftReply: string;
  submitText: string;
  gateCall: GraphToolCall;
  writeTool?: AgentEngineTool;
}): { draftReply: string; submitText: string } | null {
  const trimmedDraft = input.draftReply.trim();
  let submitText = input.submitText.trim();
  if (input.writeTool) {
    const fromArgs = extractSubmitTextFromWriteArguments(
      input.gateCall.arguments,
      input.writeTool,
    );
    if (!submitText && fromArgs && isUsablePlanDraftSubmitText(fromArgs)) {
      submitText = fromArgs.trim();
    }
  }
  if (
    input.writeTool &&
    isUsablePlanMutationPreviewDraft(trimmedDraft, input.writeTool, submitText)
  ) {
    return { draftReply: trimmedDraft, submitText };
  }
  if (!input.writeTool) {
    return null;
  }
  if (submitText && isUsablePlanDraftSubmitText(submitText)) {
    const fallbackDraft = buildFallbackUserDraftFromSubmitText(submitText);
    if (isUsablePlanMutationPreviewDraft(fallbackDraft, input.writeTool, submitText)) {
      return { draftReply: fallbackDraft, submitText };
    }
  }
  const schemaPreview = formatWriteToolArgumentsForUserPreview(
    input.gateCall.arguments,
    input.writeTool,
    input.writeTool.description,
  ).trim();
  if (schemaPreview.replace(/\s/g, '').length >= MIN_PLAN_DRAFT_SUBSTANTIVE_CHARS) {
    return { draftReply: schemaPreview, submitText };
  }
  return null;
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
