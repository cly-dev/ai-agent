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
import type {
  AgentEngineTool,
  GraphToolCall,
  ToolObservation,
} from './agent-engine.types';
import type { PlanComposeWriteObservationOutput } from './plan-compose-write.util';
import { resolveLatestPlanComposeWrite } from './plan-compose-write.util';
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

export type PendingWriteToolCallPayload = {
  tool: string;
  arguments: Record<string, unknown>;
};

export type PlanDraftSummarizePendingWrite = {
  draftReply: string;
  submitText: string;
  pendingWriteToolCall: GraphToolCall | null;
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
): boolean {
  const trimmed = draft.trim();
  if (!trimmed || isPlanDraftToolObservationDump(trimmed)) {
    return false;
  }
  if (writeTool && writeToolHasSubmitBodyPath(writeTool)) {
    return isUsablePlanDraftUserFacingDraft(trimmed);
  }
  return trimmed.replace(/\s/g, '').length >= MIN_PLAN_DRAFT_SUBSTANTIVE_CHARS;
}

/** 优先用户可见草稿正文，arguments 仅作 fallback（write 步 fallback 等）。 */
export function resolveSubmitTextForWriteTool(input: {
  draftReply: string;
  arguments: Record<string, unknown>;
  writeTool: AgentEngineTool | undefined;
}): string {
  const fromDraft = extractSubmitTextFromDraftReply(input.draftReply);
  if (isUsablePlanDraftSubmitText(fromDraft)) {
    return fromDraft.trim();
  }
  const fromArgs = input.writeTool
    ? extractSubmitTextFromWriteArguments(input.arguments, input.writeTool)
    : null;
  if (fromArgs && isUsablePlanDraftSubmitText(fromArgs)) {
    return fromArgs.trim();
  }
  const trimmedDraft = input.draftReply.trim();
  return isUsablePlanDraftSubmitText(trimmedDraft) ? trimmedDraft : '';
}

/** 用户层 LLM 失败时，用机器层 submit 正文作为最小可读草稿（无 locale 固定话术）。 */
export function buildFallbackUserDraftFromSubmitText(submitText: string): string {
  return submitText.trim();
}

/** 从 plan_compose_write finalize 为可进 gate 的 pending write call。 */
export function finalizeComposedWritePendingCall(input: {
  composed: PlanComposeWriteObservationOutput;
  taskPlan: TaskPlanSnapshot;
  scopedTools: AgentEngineTool[];
}): GraphToolCall | null {
  const writeTool = resolveWriteToolDef(
    input.composed.tool,
    input.scopedTools,
    input.taskPlan,
  );
  if (!writeTool) {
    return null;
  }
  const payload = {
    tool: input.composed.tool,
    arguments: { ...input.composed.arguments },
  };
  if (writeToolHasSubmitBodyPath(writeTool)) {
    const submitText = extractSubmitTextFromWriteArguments(
      input.composed.arguments,
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

/** write 步：优先 plan_draft_reply，否则从 plan_compose_write 直出 pending call。 */
export function resolvePendingWriteForPlanWriteStep(input: {
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
}): GraphToolCall | null {
  if (
    !input.taskPlan ||
    !isPlanWriteFallbackStep(getPendingPlanToolStep(input.taskPlan))
  ) {
    return null;
  }
  const draftReply = resolveLatestPlanDraftReply(input.observations);
  const pending = draftReply?.pendingWriteToolCall;
  if (pending?.tool && pending.arguments && typeof pending.arguments === 'object') {
    const writeTool = resolveWriteToolDef(
      pending.tool,
      input.scopedTools,
      input.taskPlan,
    );
    if (writeTool) {
      return {
        name: pending.tool,
        arguments: { ...(pending.arguments as Record<string, unknown>) },
      };
    }
  }
  return resolvePendingWriteFromComposedObservation(input);
}

/** write fallback 步：从 observations 中的 compose payload 直出 pending call。 */
export function resolvePendingWriteFromComposedObservation(input: {
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
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
  });
}

/**
 * present 双 gate 未产出 pending 时，从 plan_compose_write 机器层兜底 pending call 与草稿。
 */
export function tryPlanPresentComposeGateFallback(input: {
  pending: PlanDraftSummarizePendingWrite;
  observations: ToolObservation[];
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
}): PlanDraftSummarizePendingWrite | null {
  if (input.pending.pendingWriteToolCall != null) {
    return null;
  }
  const call = resolvePendingWriteForPlanWriteStep({
    observations: input.observations,
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools,
  });
  if (!call) {
    return null;
  }
  const composed = resolveLatestPlanComposeWrite(input.observations);
  const writeTool =
    composed && input.taskPlan
      ? resolveWriteToolDef(composed.tool, input.scopedTools, input.taskPlan)
      : undefined;
  const submitText =
    input.pending.submitText.trim() ||
    resolvePlanSubmitTextForWrite({
      observations: input.observations,
      scopedTools: input.scopedTools,
    });
  let draftReply = input.pending.draftReply.trim();
  if (!isUsablePlanMutationPreviewDraft(draftReply, writeTool)) {
    if (submitText && isUsablePlanDraftSubmitText(submitText)) {
      draftReply = buildFallbackUserDraftFromSubmitText(submitText);
    } else if (writeTool) {
      const schemaPreview = formatWriteToolArgumentsForUserPreview(
        call.arguments,
        writeTool,
        writeTool.description,
      );
      draftReply = schemaPreview.trim() || draftReply;
    }
  }
  return {
    draftReply,
    submitText,
    pendingWriteToolCall: call,
  };
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
 * present 步：机器层来自 plan_compose_write，用户层来自展示 LLM。
 * 展示与执行分离：有 submit 正文即展示；pendingWriteToolCall 仅 finalize 成功时产出。
 */
export function buildPlanPresentFromComposed(input: {
  composed: PlanComposeWriteObservationOutput;
  draftReply: string;
  taskPlanBeforeFinalize: TaskPlanSnapshot | null | undefined;
  scopedTools: AgentEngineTool[];
  logWarn?: (message: string) => void;
}): PlanDraftSummarizePendingWrite {
  const llmDraft = input.draftReply.trim();
  const taskPlanAfterFinalize = input.taskPlanBeforeFinalize
    ? finalizePlanAfterSummarize(input.taskPlanBeforeFinalize)
    : null;
  if (!taskPlanAfterFinalize) {
    return { draftReply: llmDraft, submitText: '', pendingWriteToolCall: null };
  }
  const payload: PendingWriteToolCallPayload = {
    tool: input.composed.tool,
    arguments: { ...input.composed.arguments },
  };
  const writeTool = resolveWriteToolDef(
    payload.tool,
    input.scopedTools,
    taskPlanAfterFinalize,
  );
  if (!writeTool) {
    input.logWarn?.(
      `plan present: write tool not allowed tool=${payload.tool || 'unknown'}`,
    );
    return { draftReply: llmDraft, submitText: '', pendingWriteToolCall: null };
  }
  const hasSubmitBody = writeToolHasSubmitBodyPath(writeTool);
  if (!hasSubmitBody) {
    const schemaPreview = formatWriteToolArgumentsForUserPreview(
      payload.arguments,
      writeTool,
      writeTool.description,
    );
    const displayDraft = isUsablePlanMutationPreviewDraft(llmDraft, writeTool)
      ? llmDraft
      : schemaPreview.trim() || llmDraft;
    const finalized = finalizePlanPendingWriteToolCallFromComposedArgs({
      payload,
      taskPlan: taskPlanAfterFinalize,
      scopedTools: input.scopedTools,
    });
    if (!finalized.call && finalized.failureReason) {
      input.logWarn?.(
        `plan present finalize failed: ${finalized.failureReason} tool=${payload.tool}`,
      );
    }
    return {
      draftReply: displayDraft,
      submitText: '',
      pendingWriteToolCall: finalized.call,
    };
  }
  const submitText = resolveSubmitTextForWriteTool({
    draftReply: llmDraft,
    arguments: payload.arguments,
    writeTool,
  });
  const machineDraft = submitText
    ? buildFallbackUserDraftFromSubmitText(submitText)
    : '';
  const displayDraft = isUsablePlanDraftUserFacingDraft(llmDraft)
    ? llmDraft
    : isUsablePlanDraftUserFacingDraft(machineDraft)
      ? machineDraft
      : llmDraft;
  const finalized = submitText
    ? finalizePlanPendingWriteToolCall({
        payload,
        taskPlan: taskPlanAfterFinalize,
        scopedTools: input.scopedTools,
        submitText,
      })
    : { call: null as GraphToolCall | null, failureReason: 'missing_submit_text' };
  if (!finalized.call && finalized.failureReason) {
    input.logWarn?.(
      `plan present finalize failed: ${finalized.failureReason} tool=${payload.tool}`,
    );
  }
  if (!finalized.call && machineDraft) {
    input.logWarn?.(
      'plan present: showing machine draft; write gate deferred until params validate',
    );
  }
  return {
    draftReply: displayDraft,
    submitText,
    pendingWriteToolCall: finalized.call,
  };
}
