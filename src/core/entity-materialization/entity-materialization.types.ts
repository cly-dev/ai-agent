/**
 * Entity Materialization — 运行期业务对象与 Evidence 协议真源。
 *
 * 原则：
 * - Entity 承载业务对象；Evidence 承载 AI 理解结果
 * - entityKey 仅 run 内引用，不承担业务主键
 * - entityType 来自协议/Tool 配置，不在引擎内写死垂直业务分支
 *
 * @see v2/docs/entity-materialization-architecture.md
 */

/** 物化来源（与 Runtime Context 分层一致）。 */
export type EntityMaterializationSource =
  | 'page_context'
  | 'action_context'
  | 'upstream';

/** 实体类型：配置/协议字符串，非代码内枚举词表。 */
export type EntityType = string;

export type MaterializedEntityContent = {
  /** 主可读正文（评论 content、说明文案等） */
  text?: string;
  /** 结构化字段投影（来自 responseProfile.coreFields 等） */
  fields?: Record<string, unknown>;
};

/** 原始资产挂在 Entity，不混入 AI 摘要。 */
export type MaterializedEntityAssets = {
  imageUrls?: string[];
};

export type MaterializedEntity = {
  /** run 内唯一引用 id，如 ent_001 */
  entityKey: string;
  /**
   * 同类输入指纹，辅助去重/重跑比对；不承诺跨 run 稳定。
   * 建议 hash(source + path [+ stable payload slice])
   */
  fingerprint: string;
  entityType: EntityType;
  source: EntityMaterializationSource;
  /** 结构路径，排障用，如 metadata.review / data.list[2] */
  path: string;
  content: MaterializedEntityContent;
  assets: MaterializedEntityAssets;
  metadata?: Record<string, unknown>;
};

export type EntityEvidenceType = 'image' | 'text' | 'classification' | 'rag' | 'other';

export type EntityEvidenceItem = {
  type: EntityEvidenceType;
  /** 产出方：vision / llm / rule … */
  source: string;
  summary?: string;
  /** 识图等保留关联 URL */
  urls?: string[];
  legible?: boolean;
  raw?: unknown;
  createdAt?: string;
};

/** 单实体 Evidence 包；追加式，不覆盖 Entity。 */
export type MaterializedEntityEvidence = {
  entityKey: string;
  evidence: EntityEvidenceItem[];
};

/** 下游 judge / deliver / mutate 统一输入面。 */
export type EntityExecutionContext = {
  entity: MaterializedEntity;
  evidence: EntityEvidenceItem[];
};
