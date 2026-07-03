/** 草稿评审统一决策（Chat writeGate / Approval decide 共用）。 */
export const DRAFT_REVIEW_ACTIONS = [
  'confirm',
  'confirm_with_edits',
  'retry',
  'cancel',
] as const;

export type DraftReviewAction = (typeof DRAFT_REVIEW_ACTIONS)[number];

export type DraftReviewDecision = {
  action: DraftReviewAction;
  /** 用户编辑后的 MessageBlocks 序列化串（展示 + 审计）。 */
  editedPreviewSerialized?: string | null;
  /** 覆盖写工具 arguments（浅 merge 进 pendingWrite）。 */
  editedPendingWriteArguments?: Record<string, unknown> | null;
  /** 重试时的补充说明。 */
  retryInstruction?: string | null;
};

export type DraftReviewPendingWriteLike = {
  name: string;
  arguments: Record<string, unknown>;
  riskLevel?: string;
};

export type DraftReviewToolCallLike = {
  name: string;
  arguments: Record<string, unknown>;
  riskLevel?: string;
  reason?: string;
};

export type DraftReviewWriteToolLike = {
  name: string;
  inputSchema?: unknown;
  schema?: unknown;
  agentMetadata?: unknown;
};
