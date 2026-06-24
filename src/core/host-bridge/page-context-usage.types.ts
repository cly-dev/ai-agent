/** 页面上是否已有可作答的内联业务数据（由结构化 pageContext 推导，非用户话术）。 */
export type PageContextDataSufficiency = 'inline' | 'entity_only' | 'none';

export type PageContextDataAssessment = {
  page: string | null;
  entityType: string | null;
  entityId: string | null;
  dataSufficiency: PageContextDataSufficiency;
  /** 已有内联正文的实体种类，如 review */
  inlineContentKinds: string[];
};

/** Turn 契约：用户是否在消费当前页上下文 + 页上数据是否够用。 */
export type PageContextUsage = PageContextDataAssessment & {
  applies: boolean;
};

/**
 * Route LLM 判定：用户想如何用页上内联数据（非话术匹配）。
 * - analyze: 分析/总结当前实体正文 → 可走 inline_answer Plan
 * - answer: 基于页上数据直接作答（非变更）
 * - mutation: 回复/提交/修改 → 走 Skill / mutation Plan，仅物化 observation 跳 read
 * - none: 未消费页上下文或无关
 */
export type PageContextTaskKind =
  | 'analyze'
  | 'answer'
  | 'mutation'
  | 'none';

/**
 * Plan 如何消费 pageContext（由 route + 确定性评估写入契约，plan 只读）。
 * - none: 常规 Plan
 * - inline_answer: 页上已有正文，直接 summarize
 * - entity_read_detail: 仅有实体 id，read-detail → summarize
 */
export type PageContextPlanKind =
  | 'none'
  | 'inline_answer'
  | 'entity_read_detail';
