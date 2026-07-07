/**
 * Tool.agentMetadata — 面向 Agent 选工具的结构化元数据（与 responseProfile 分工）。
 * decisionRole 由 metadata 推导，可冗余写入 responseProfile.decisionRole 供旧逻辑读取。
 */

import type { ConfiguredToolDecisionRole } from './tool-decision-role.enum';

export const ToolMode = {
  READ: 'READ',
  WRITE: 'WRITE',
  ADMIN: 'ADMIN',
} as const;
export type ToolMode = (typeof ToolMode)[keyof typeof ToolMode];

export const ResourceType = {
  PRODUCT: 'PRODUCT',
  PRICE: 'PRICE',
  INVENTORY: 'INVENTORY',
  SEO: 'SEO',
  CATEGORY: 'CATEGORY',
  COLLECTION: 'COLLECTION',
  ORDER: 'ORDER',
  CUSTOMER: 'CUSTOMER',
  UNKNOWN: 'UNKNOWN',
} as const;
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

export const OperationType = {
  DETAIL: 'DETAIL',
  LIST: 'LIST',
  SEARCH: 'SEARCH',
  STATS: 'STATS',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  IMPORT: 'IMPORT',
  EXPORT: 'EXPORT',
  PUBLISH: 'PUBLISH',
  UNPUBLISH: 'UNPUBLISH',
} as const;
export type OperationType = (typeof OperationType)[keyof typeof OperationType];

export const TOOL_MODES = Object.values(ToolMode);
export const RESOURCE_TYPES = Object.values(ResourceType);
export const OPERATION_TYPES = Object.values(OperationType);

/** 参数格式说明：OpenAPI 无法表达的命名/格式约束，供决策环生成 tool_call 参数。 */
export type ParamFormatHint = {
  /** inputSchema 中的 OpenAPI 参数名（query/header/body 字段名，须与后台 schema 一致） */
  param: string;
  /** 传给 LLM 的格式说明，如 yyyy-MM-dd、Unix 毫秒、逗号分隔 ID 列表 */
  hint: string;
  /** 可选示例值 */
  example?: string;
};

/** 落库 JSON 形态（Tool.agentMetadata）。 */
export type AgentMetadata = {
  mode: ToolMode;
  resource: ResourceType;
  operation: OperationType;
  /** 执行业务动作前必须具备的业务参数名（非 OpenAPI 原始名） */
  businessFields: string[];
  aliases: string[];
  examples: string[];
  priority: number;
  isMutation: boolean;
  /** 参数格式/命名约束；param 必须为 OpenAPI 真实参数名 */
  paramFormatHints?: ParamFormatHint[];
  /** 审批 / 写确认时用户可如何编辑草稿 */
  draftReview?: DraftReviewPolicy;
};

export const DRAFT_REVIEW_EDIT_MODES = [
  'preview_only',
  'allowlisted_fields',
  'full',
] as const;
export type DraftReviewEditMode = (typeof DRAFT_REVIEW_EDIT_MODES)[number];

export const DRAFT_REVIEW_FIELD_ROLES = [
  'content',
  'identifier',
  'scenario',
  'enum',
  'system',
] as const;
export type DraftReviewFieldRole = (typeof DRAFT_REVIEW_FIELD_ROLES)[number];

export const DRAFT_REVIEW_FIELD_WIDGETS = [
  'text',
  'textarea',
  'select',
  'readonly',
  'hidden',
] as const;
export type DraftReviewFieldWidget =
  (typeof DRAFT_REVIEW_FIELD_WIDGETS)[number];

export type DraftReviewFieldOverride = {
  /** OpenAPI 展开路径，如 content、body.reply */
  path: string;
  role?: DraftReviewFieldRole;
  label?: string;
  reason?: string;
  widget?: Exclude<DraftReviewFieldWidget, 'readonly'>;
};

export type DraftReviewPolicy = {
  editMode?: DraftReviewEditMode;
  /** preview_only 时正文注入路径；缺省按 schema 推断 */
  submitPath?: string;
  editablePaths?: string[];
  lockedPaths?: string[];
  fieldOverrides?: DraftReviewFieldOverride[];
  allowArgumentsPatch?: boolean;
};

export type ParsedUserToolIntent = {
  mode?: ToolMode;
  resource?: ResourceType;
  operation?: OperationType;
};

export type ToolMetadataSource = {
  agentMetadata?: unknown;
  responseProfile?: unknown;
  method?: string;
  name?: string;
  description?: string;
};

export type { ConfiguredToolDecisionRole };
