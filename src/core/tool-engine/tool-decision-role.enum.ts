/**
 * Tool.responseProfile.decisionRole — 决策环语义角色（语言无关，供 compact tools / 选 tool / 停手）。
 *
 * 使用位置：
 * - `tool-response-profile.types.ts` — ToolResponseProfile.decisionRole
 * - `tool-output-projection.util.ts` — parseResponseProfile 落库字段
 * - `tool-agent-metadata.util.ts` — resolveToolDecisionRole
 * - `tool-schema-compact.util.ts` — summarizeToolsForLlmSchema
 * - `agent-engine.service.ts` — buildDecisionPrompt → compact tools + role guidance
 * - `swagger-tool-import.core.ts` — Swagger 导入时按 HTTP 动词写入
 * - `tool-schema-inference.util.ts` — debug 推断 schema 时补全
 */

/** 全部角色值（含 unknown，表示未配置或非法）。 */
export type ToolDecisionRole =
  | 'read-detail'
  | 'read-list'
  | 'read-stats'
  | 'write-batch'
  | 'write-single'
  | 'write-meta'
  | 'admin'
  | 'unknown';

/** 可写入 responseProfile.decisionRole 的配置值（不含 unknown）。 */
export type ConfiguredToolDecisionRole = Exclude<ToolDecisionRole, 'unknown'>;

/** 枚举常量（与 DB / JSON 字符串一致）。 */
export const ToolDecisionRoleEnum = {
  ReadDetail: 'read-detail',
  ReadList: 'read-list',
  ReadStats: 'read-stats',
  WriteBatch: 'write-batch',
  WriteSingle: 'write-single',
  WriteMeta: 'write-meta',
  Admin: 'admin',
} as const satisfies Record<string, ConfiguredToolDecisionRole>;

export const CONFIGURED_TOOL_DECISION_ROLES: readonly ConfiguredToolDecisionRole[] =
  [
    ToolDecisionRoleEnum.ReadDetail,
    ToolDecisionRoleEnum.ReadList,
    ToolDecisionRoleEnum.ReadStats,
    ToolDecisionRoleEnum.WriteBatch,
    ToolDecisionRoleEnum.WriteSingle,
    ToolDecisionRoleEnum.WriteMeta,
    ToolDecisionRoleEnum.Admin,
  ];

export const TOOL_DECISION_ROLES: readonly ToolDecisionRole[] = [
  ...CONFIGURED_TOOL_DECISION_ROLES,
  'unknown',
];

/** 枚举元数据（管理端 / 文档 / Swagger 导入说明）。 */
export const TOOL_DECISION_ROLE_META: ReadonlyArray<{
  value: ConfiguredToolDecisionRole;
  label: string;
  description: string;
  defaultHttpMethods: readonly string[];
}> = [
  {
    value: ToolDecisionRoleEnum.ReadDetail,
    label: '单条读取',
    description: '按 id 等获取单实体详情（GET 默认）',
    defaultHttpMethods: ['GET'],
  },
  {
    value: ToolDecisionRoleEnum.ReadList,
    label: '列表/条件查询',
    description: '多实体、分页、条件检索（需手工覆盖 GET 默认时）',
    defaultHttpMethods: [],
  },
  {
    value: ToolDecisionRoleEnum.ReadStats,
    label: '统计/计数',
    description: '聚合、数量统计，非完整记录',
    defaultHttpMethods: [],
  },
  {
    value: ToolDecisionRoleEnum.WriteBatch,
    label: '批量写入',
    description: '批量改价、库存、状态等（PUT 默认）',
    defaultHttpMethods: ['PUT'],
  },
  {
    value: ToolDecisionRoleEnum.WriteSingle,
    label: '单条新增/更新',
    description: '创建或更新单实体（POST 默认；PATCH/DELETE 亦映射到此）',
    defaultHttpMethods: ['POST', 'PATCH', 'DELETE'],
  },
  {
    value: ToolDecisionRoleEnum.WriteMeta,
    label: '附属元数据',
    description: '关联、备注、集合等侧属性，非核心读详情',
    defaultHttpMethods: [],
  },
  {
    value: ToolDecisionRoleEnum.Admin,
    label: '运维/缓存',
    description: '清缓存、测试数据等，非用户业务答复',
    defaultHttpMethods: [],
  },
];

export function parseConfiguredToolDecisionRole(
  value: unknown,
): ConfiguredToolDecisionRole | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  return (CONFIGURED_TOOL_DECISION_ROLES as readonly string[]).includes(value)
    ? (value as ConfiguredToolDecisionRole)
    : undefined;
}

/**
 * 按 HTTP 动词推断 decisionRole（Swagger 导入 / schema 推断缺省时使用）。
 *
 * | 动词   | decisionRole   |
 * |--------|----------------|
 * | GET    | read-detail    |
 * | POST   | write-single   |
 * | PUT    | write-batch    |
 * | PATCH  | write-single   |
 * | DELETE | write-single   |
 */
/** 由 Tool.agentMetadata 推导 decisionRole（权威来源优先于 HTTP 动词）。 */
export function deriveDecisionRoleFromAgentMetadata(meta: {
  mode: string;
  resource?: string;
  operation: string;
} | null | undefined): ConfiguredToolDecisionRole | undefined {
  if (!meta) {
    return undefined;
  }
  const mode = meta.mode?.toUpperCase();
  const operation = meta.operation?.toUpperCase();
  const resource = meta.resource?.toUpperCase();

  if (mode === 'ADMIN') {
    return ToolDecisionRoleEnum.Admin;
  }
  if (mode === 'READ') {
    if (operation === 'LIST' || operation === 'SEARCH') {
      return ToolDecisionRoleEnum.ReadList;
    }
    if (operation === 'STATS') {
      return ToolDecisionRoleEnum.ReadStats;
    }
    return ToolDecisionRoleEnum.ReadDetail;
  }
  if (mode === 'WRITE') {
    if (
      resource === 'COLLECTION' ||
      operation === 'IMPORT' ||
      operation === 'EXPORT'
    ) {
      return ToolDecisionRoleEnum.WriteMeta;
    }
    if (operation === 'CREATE') {
      return ToolDecisionRoleEnum.WriteSingle;
    }
    if (operation === 'DELETE') {
      return ToolDecisionRoleEnum.WriteSingle;
    }
    if (operation === 'UPDATE' || operation === 'PUBLISH' || operation === 'UNPUBLISH') {
      if (resource === 'PRICE' || resource === 'INVENTORY') {
        return ToolDecisionRoleEnum.WriteBatch;
      }
      return ToolDecisionRoleEnum.WriteSingle;
    }
    return ToolDecisionRoleEnum.WriteSingle;
  }
  return undefined;
}

export function inferDecisionRoleFromHttpMethod(
  method: string,
): ConfiguredToolDecisionRole | undefined {
  const normalized = method.trim().toLowerCase();
  switch (normalized) {
    case 'get':
      return ToolDecisionRoleEnum.ReadDetail;
    case 'post':
      return ToolDecisionRoleEnum.WriteSingle;
    case 'put':
      return ToolDecisionRoleEnum.WriteBatch;
    case 'patch':
      return ToolDecisionRoleEnum.WriteSingle;
    case 'delete':
      return ToolDecisionRoleEnum.WriteSingle;
    default:
      return undefined;
  }
}

/** Swagger 导入占位 responseProfile（decisionRole 由 agentMetadata 推导）。 */
export function buildSwaggerImportResponseProfile(
  method: string,
  agentMetadata?: { mode: string; resource?: string; operation: string } | null,
): {
  decisionRole: ConfiguredToolDecisionRole;
  coreFields: Array<{ path: string; label: string; description: string }>;
} {
  const decisionRole =
    deriveDecisionRoleFromAgentMetadata(agentMetadata) ??
    inferDecisionRoleFromHttpMethod(method) ??
    ToolDecisionRoleEnum.ReadDetail;
  return {
    decisionRole,
    coreFields: [
      {
        path: 'id',
        label: '标识',
        description:
          '资源唯一标识（Swagger 导入占位；调试推断 schema 后可覆盖 coreFields）',
      },
    ],
  };
}
