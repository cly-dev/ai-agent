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
