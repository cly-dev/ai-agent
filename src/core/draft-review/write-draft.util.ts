import type { ToolLevel } from '../../../generated/prisma/client';
import type { MessageBlock } from '../agent-engine/engine/message/message-blocks.types';
import {
  serializeMessageBlocksForStorage,
  textBlock,
} from '../agent-engine/engine/message/message-blocks.util';
import type { ApprovalPendingWrite } from '../approval/approval-resume-snapshot.types';
import type { ApprovalResumeSnapshot } from '../approval/approval-resume-snapshot.types';
import type { PendingWriteToolCall } from '../../modules/chat/pending-write-confirmation.types';
import type { PendingToolObservation } from '../../modules/chat/pending-write-confirmation.types';
import { PLAN_COMPOSE_WRITE_OBSERVATION_NAME } from '../agent-engine/engine/main/plan-present/plan-compose-write.util';
import { tryParseStoredMessageBlocks } from '../agent-engine/engine/message/message-blocks.util';
import {
  applyDraftReviewToPendingWrite,
  applyDraftReviewToToolCalls,
} from './apply-edited-pending-write.util';
import type { DraftReviewDecision, DraftReviewWriteToolLike } from './draft-review.types';
import { resolveDraftRetryBudget } from './draft-review-retry-limit.util';
import type {
  BuildPageWriteDraftInput,
  WriteDraft,
  WriteDraftLastEvent,
  WriteDraftPublic,
} from './write-draft.types';

const INTERNAL_COMPOSE_MARKER = '_composedFor';

function stripInternalComposeMarkers(
  args: Record<string, unknown>,
): Record<string, unknown> {
  if (!(INTERNAL_COMPOSE_MARKER in args)) {
    return args;
  }
  const next = { ...args };
  delete next[INTERNAL_COMPOSE_MARKER];
  return next;
}

function resolveSummaryText(input: {
  summaryText?: string | null;
  fillText?: string;
}): string | null {
  const summary = input.summaryText?.trim();
  if (summary) {
    return summary;
  }
  const fill = input.fillText?.trim();
  return fill && fill.length > 0 ? fill : null;
}

/** 由 draft 真值确定性渲染 preview（presentation 缓存须与此一致）。 */
export function renderWriteDraftPresentation(
  draft: Pick<WriteDraft, 'tool' | 'arguments' | 'presentation'>,
): { previewBlocks: MessageBlock[]; serialized: string } {
  const blocks: MessageBlock[] = [];
  const summary =
    draft.presentation.summaryText?.trim() ??
    resolveSummaryText({ summaryText: draft.presentation.summaryText });
  if (summary) {
    blocks.push(textBlock(summary, 'markdown'));
  }
  const preview = JSON.stringify(
    stripInternalComposeMarkers(draft.arguments),
    null,
    2,
  );
  blocks.push(
    textBlock(
      `待执行写操作 \`${draft.tool.name}\`：\n\`\`\`json\n${preview}\n\`\`\``,
      'markdown',
    ),
  );
  const sanitized =
    blocks.length > 0 ? blocks : [textBlock('(无预览)', 'markdown')];
  return {
    previewBlocks: sanitized,
    serialized: serializeMessageBlocksForStorage(sanitized),
  };
}

export function buildPageWriteDraft(input: BuildPageWriteDraftInput): WriteDraft {
  const summaryText = resolveSummaryText(input);
  const draft: WriteDraft = {
    schemaVersion: 1,
    version: input.version ?? 1,
    tool: {
      name: input.tool.name.trim(),
      toolId: input.tool.toolId,
      riskLevel: input.tool.riskLevel,
    },
    arguments: stripInternalComposeMarkers(input.tool.arguments),
    presentation: {
      summaryText,
      previewBlocks: [],
    },
    provenance: {
      draftRetryCount: Math.max(0, input.draftRetryCount ?? 0),
      composedAt: input.composedAt ?? new Date().toISOString(),
      lastEvent: input.lastEvent ?? 'composed',
    },
  };
  return syncWriteDraftPresentation(draft);
}

export function syncWriteDraftPresentation(draft: WriteDraft): WriteDraft {
  const rendered = renderWriteDraftPresentation(draft);
  return {
    ...draft,
    presentation: {
      ...draft.presentation,
      previewBlocks: rendered.previewBlocks,
    },
  };
}

export function writeDraftToPendingWrite(draft: WriteDraft): ApprovalPendingWrite {
  return {
    name: draft.tool.name,
    arguments: { ...draft.arguments },
    riskLevel: draft.tool.riskLevel as ToolLevel,
  };
}

export function writeDraftToPendingWriteToolCall(
  draft: WriteDraft,
  reason = 'awaiting_user_confirmation',
): PendingWriteToolCall {
  return {
    name: draft.tool.name,
    arguments: stripInternalComposeMarkers({ ...draft.arguments }),
    riskLevel: draft.tool.riskLevel as ToolLevel,
    reason,
  };
}

/** Chat gate 挂起时：以 writeDraft 为真值同步 toolCalls（兼容多写时保留非 primary）。 */
export function syncChatGateToolCallsFromWriteDraft(input: {
  toolCalls: PendingWriteToolCall[];
  writeDraft: WriteDraft | null | undefined;
}): PendingWriteToolCall[] {
  if (!input.writeDraft) {
    return input.toolCalls;
  }
  const primary = writeDraftToPendingWriteToolCall(
    input.writeDraft,
    input.toolCalls[0]?.reason ?? 'awaiting_user_confirmation',
  );
  if (input.toolCalls.length <= 1) {
    return [primary];
  }
  return [primary, ...input.toolCalls.slice(1)];
}

/** Chat resume / validate：从 gate snapshot 解析待执行 toolCalls（writeDraft 优先）。 */
export function resolveChatGateToolCalls(input: {
  toolCalls: PendingWriteToolCall[];
  writeDraft?: WriteDraft | null;
}): PendingWriteToolCall[] {
  return syncChatGateToolCallsFromWriteDraft({
    toolCalls: input.toolCalls,
    writeDraft: input.writeDraft,
  });
}

export function applyDraftReviewToChatGateToolCalls(input: {
  pending: {
    toolCalls: PendingWriteToolCall[];
    writeDraft?: WriteDraft | null;
  };
  decision: DraftReviewDecision;
  scopedTools: DraftReviewWriteToolLike[];
}): PendingWriteToolCall[] {
  const base = resolveChatGateToolCalls(input.pending);
  return applyDraftReviewToToolCalls({
    toolCalls: base,
    decision: input.decision,
    scopedTools: input.scopedTools,
  }) as PendingWriteToolCall[];
}

export function writeDraftFromPendingWrite(input: {
  pendingWrite: ApprovalPendingWrite;
  toolId?: number;
  summaryText?: string | null;
  previewBlocks?: MessageBlock[] | null;
  draftRetryCount?: number;
  version?: number;
  lastEvent?: WriteDraftLastEvent;
  composedAt?: string;
}): WriteDraft {
  const draft = buildPageWriteDraft({
    tool: {
      name: input.pendingWrite.name,
      toolId: input.toolId,
      riskLevel: input.pendingWrite.riskLevel,
      arguments: input.pendingWrite.arguments,
    },
    summaryText: input.summaryText,
    draftRetryCount: input.draftRetryCount,
    version: input.version ?? 1,
    lastEvent: input.lastEvent ?? 'suspended',
    composedAt: input.composedAt,
  });
  if (input.previewBlocks?.length) {
    return {
      ...draft,
      presentation: {
        ...draft.presentation,
        previewBlocks: input.previewBlocks,
      },
    };
  }
  return draft;
}

export function writeDraftFromChatToolCall(input: {
  toolCall: PendingWriteToolCall;
  toolId?: number;
  summaryText?: string | null;
  previewBlocks?: MessageBlock[];
  draftRetryCount?: number;
  version?: number;
  lastEvent?: WriteDraftLastEvent;
}): WriteDraft {
  return buildPageWriteDraft({
    tool: {
      name: input.toolCall.name,
      toolId: input.toolId,
      riskLevel: input.toolCall.riskLevel,
      arguments: input.toolCall.arguments,
    },
    summaryText: input.summaryText,
    draftRetryCount: input.draftRetryCount,
    version: input.version ?? 1,
    lastEvent: input.lastEvent ?? 'suspended',
  });
}

export function resolvePrimaryWriteDraftFromChatToolCalls(input: {
  toolCalls: PendingWriteToolCall[];
  summaryText?: string | null;
  previewBlocks?: MessageBlock[];
  draftRetryCount?: number;
  version?: number;
}): WriteDraft | null {
  const primary = input.toolCalls[0];
  if (!primary?.name?.trim()) {
    return null;
  }
  return writeDraftFromChatToolCall({
    toolCall: primary,
    summaryText: input.summaryText,
    previewBlocks: input.previewBlocks,
    draftRetryCount: input.draftRetryCount,
    version: input.version,
    lastEvent: 'suspended',
  });
}

export function resolveWriteDraftFromApprovalSnapshot(
  snapshot: ApprovalResumeSnapshot,
  fallback?: {
    summary?: string | null;
    previewBlocks?: MessageBlock[] | null;
  },
): WriteDraft {
  if (snapshot.writeDraft?.schemaVersion === 1) {
    return syncWriteDraftPresentation(snapshot.writeDraft);
  }
  return writeDraftFromPendingWrite({
    pendingWrite: snapshot.pendingWrite,
    summaryText: fallback?.summary ?? null,
    previewBlocks: fallback?.previewBlocks ?? null,
    draftRetryCount: snapshot.draftRetryCount ?? 0,
    version: 1,
    lastEvent: 'suspended',
  });
}

export function attachWriteDraftToApprovalSnapshot(
  snapshot: ApprovalResumeSnapshot,
  draft: WriteDraft,
): ApprovalResumeSnapshot {
  const synced = syncWriteDraftPresentation(draft);
  return {
    ...snapshot,
    pendingWrite: writeDraftToPendingWrite(synced),
    writeDraft: synced,
    draftRetryCount: synced.provenance.draftRetryCount,
  };
}

export function applyDraftReviewToWriteDraft(input: {
  draft: WriteDraft;
  decision: DraftReviewDecision;
  writeTool?: DraftReviewWriteToolLike | null;
}): WriteDraft {
  if (input.decision.action !== 'confirm_with_edits') {
    return input.draft;
  }
  const pendingLike = {
    name: input.draft.tool.name,
    arguments: input.draft.arguments,
    riskLevel: String(input.draft.tool.riskLevel),
  };
  const merged = applyDraftReviewToPendingWrite({
    pending: pendingLike,
    decision: input.decision,
    writeTool: input.writeTool ?? null,
  });
  const next: WriteDraft = {
    ...input.draft,
    version: input.draft.version + 1,
    arguments: merged.arguments,
    provenance: {
      ...input.draft.provenance,
      lastEvent: 'user_edit',
    },
  };
  if (input.decision.editedPreviewSerialized?.trim()) {
    const blocks = tryParsePreviewBlocksFromDecision(
      input.decision.editedPreviewSerialized,
    );
    if (blocks?.length) {
      next.presentation = {
        ...next.presentation,
        previewBlocks: blocks,
      };
    }
  }
  return syncWriteDraftPresentation(next);
}

function tryParsePreviewBlocksFromDecision(
  serialized: string,
): MessageBlock[] | null {
  const trimmed = serialized.trim();
  if (!trimmed.startsWith('{')) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed) as { blocks?: MessageBlock[] };
    return Array.isArray(parsed.blocks) ? parsed.blocks : null;
  } catch {
    return null;
  }
}

export function toWriteDraftPublic(
  draft: WriteDraft,
  input?: { draftRetryMax?: number },
): WriteDraftPublic {
  const budget = resolveDraftRetryBudget(draft.provenance.draftRetryCount);
  return {
    version: draft.version,
    tool: {
      name: draft.tool.name,
      ...(draft.tool.toolId != null ? { toolId: draft.tool.toolId } : {}),
      riskLevel: String(draft.tool.riskLevel),
    },
    arguments: stripInternalComposeMarkers(draft.arguments),
    presentation: {
      summaryText: draft.presentation.summaryText ?? null,
      previewBlocks: draft.presentation.previewBlocks,
    },
    provenance: {
      draftRetryCount: budget.used,
      draftRetryMax: input?.draftRetryMax ?? budget.max,
      canRetry: budget.canRetry,
      composedAt: draft.provenance.composedAt,
      lastEvent: draft.provenance.lastEvent,
    },
  };
}

export function resolveWriteDraftForChatPending(input: {
  toolCalls: PendingWriteToolCall[];
  writeDraft?: WriteDraft | null;
  observations?: PendingToolObservation[];
  confirmedPreviewSerialized?: string | null;
  draftRetryCount?: number;
}): WriteDraft | null {
  const draftRetryCount = input.draftRetryCount ?? 0;
  if (input.writeDraft?.schemaVersion === 1) {
    const synced = syncWriteDraftPresentation(input.writeDraft);
    return {
      ...synced,
      provenance: {
        ...synced.provenance,
        draftRetryCount: Math.max(
          synced.provenance.draftRetryCount ?? 0,
          draftRetryCount,
        ),
      },
    };
  }
  return resolveWriteDraftFromChatGate({
    toolCalls: resolveChatGateToolCalls({
      toolCalls: input.toolCalls,
      writeDraft: input.writeDraft,
    }),
    observations: input.observations,
    confirmedPreviewSerialized: input.confirmedPreviewSerialized,
    draftRetryCount,
  });
}

export function resolveWriteDraftFromChatGate(input: {
  toolCalls: PendingWriteToolCall[];
  observations?: PendingToolObservation[];
  confirmedPreviewSerialized?: string | null;
  draftRetryCount?: number;
  version?: number;
}): WriteDraft | null {
  if (input.toolCalls.length > 0) {
    const previewBlocks = parsePreviewBlocksFromSerialized(
      input.confirmedPreviewSerialized,
    );
    return resolvePrimaryWriteDraftFromChatToolCalls({
      toolCalls: input.toolCalls,
      previewBlocks: previewBlocks ?? undefined,
      draftRetryCount: input.draftRetryCount,
      version: input.version,
    });
  }

  const observations = input.observations ?? [];
  for (let i = observations.length - 1; i >= 0; i -= 1) {
    const row = observations[i];
    if (row?.name !== PLAN_COMPOSE_WRITE_OBSERVATION_NAME) {
      continue;
    }
    const output = row.output as {
      tool?: string;
      arguments?: Record<string, unknown>;
    } | null;
    const tool = output?.tool?.trim();
    const args = output?.arguments;
    if (!tool || !args || typeof args !== 'object' || Array.isArray(args)) {
      continue;
    }
    const previewBlocks = parsePreviewBlocksFromSerialized(
      input.confirmedPreviewSerialized,
    );
    const draft = buildPageWriteDraft({
      tool: {
        name: tool,
        riskLevel: 'L2',
        arguments: args,
      },
      draftRetryCount: input.draftRetryCount,
      version: input.version,
      lastEvent: 'suspended',
    });
    if (previewBlocks?.length) {
      return {
        ...draft,
        presentation: {
          ...draft.presentation,
          previewBlocks,
        },
      };
    }
    return draft;
  }

  return null;
}

function parsePreviewBlocksFromSerialized(
  serialized: string | null | undefined,
): MessageBlock[] | null {
  if (!serialized?.trim()) {
    return null;
  }
  return tryParseStoredMessageBlocks(serialized);
}

export function toWriteDraftPublicListFromChatToolCalls(input: {
  toolCalls: PendingWriteToolCall[];
  summaryText?: string | null;
  previewBlocks?: MessageBlock[];
  draftRetryCount?: number;
  version?: number;
}): WriteDraftPublic[] {
  return buildWriteDraftPublicListFromChatGate({
    toolCalls: input.toolCalls,
    draftRetryCount: input.draftRetryCount,
    previewBlocks: input.previewBlocks,
    summaryText: input.summaryText,
  });
}

export type BuildWriteDraftListFromChatGateInput = {
  toolCalls: PendingWriteToolCall[];
  writeDraft?: WriteDraft | null;
  /** 挂起时持久化的多写草稿（与 toolCalls 对齐）。 */
  writeDrafts?: WriteDraft[] | null;
  observations?: PendingToolObservation[];
  confirmedPreviewSerialized?: string | null;
  draftRetryCount?: number;
  previewBlocks?: MessageBlock[];
  summaryText?: string | null;
  version?: number;
};

/** 从 Chat gate snapshot 构建 WriteDraft 列表（primary 优先用已存 writeDraft）。 */
export function buildWriteDraftListFromChatGate(
  input: BuildWriteDraftListFromChatGateInput,
): WriteDraft[] {
  const draftRetryCount = input.draftRetryCount ?? 0;
  if (input.writeDrafts?.length) {
    return input.writeDrafts.map((draft) => {
      const synced = syncWriteDraftPresentation(draft);
      return {
        ...synced,
        provenance: {
          ...synced.provenance,
          draftRetryCount: Math.max(
            synced.provenance.draftRetryCount ?? 0,
            draftRetryCount,
          ),
        },
      };
    });
  }

  const toolCallsForGate = syncChatGateToolCallsFromWriteDraft({
    toolCalls: input.toolCalls,
    writeDraft: input.writeDraft,
  });
  const primary = resolveWriteDraftForChatPending({
    toolCalls: input.toolCalls,
    writeDraft: input.writeDraft,
    observations: input.observations,
    confirmedPreviewSerialized: input.confirmedPreviewSerialized,
    draftRetryCount,
  });

  if (toolCallsForGate.length === 0) {
    return primary ? [primary] : [];
  }

  return toolCallsForGate.map((toolCall, index) => {
    if (index === 0 && primary) {
      return primary;
    }
    return writeDraftFromChatToolCall({
      toolCall,
      summaryText: index === 0 ? input.summaryText : null,
      previewBlocks: index === 0 ? input.previewBlocks : undefined,
      draftRetryCount: input.draftRetryCount,
      version: input.version,
      lastEvent: 'suspended',
    });
  });
}

export function buildWriteDraftPublicListFromChatGate(
  input: BuildWriteDraftListFromChatGateInput,
): WriteDraftPublic[] {
  return buildWriteDraftListFromChatGate(input).map((draft) =>
    toWriteDraftPublic(draft),
  );
}
