/** 页面上是否已有可作答的内联业务数据（由结构化 pageContext 推导，非用户话术）。 */
export type PageContextDataSufficiency = 'inline' | 'entity_only' | 'none';

export type PageContextDataAssessment = {
  page: string | null;
  entityType: string | null;
  entityId: string | null;
  dataSufficiency: PageContextDataSufficiency;
  /** 已有内联正文的 metadata 键名（含非空 content 字段的对象）。 */
  inlineContentKinds: string[];
};

/** Turn 契约：用户是否在消费当前页上下文 + 页上数据是否够用。 */
export type PageContextUsage = PageContextDataAssessment & {
  applies: boolean;
};

/**
 * Route LLM 判定：用户想如何消费页上内联数据（读路径）。
 * - analyze / answer / none：读路径
 * - mutation：LLM 遗留字段，结构化层映射为 hostMutationIntent（写路径）
 */
export type PageContextTaskKind =
  | 'analyze'
  | 'answer'
  | 'mutation'
  | 'none';

/** 结构化最终态读路径 taskKind（不含 mutation）。 */
export type TurnPageReadKind = 'analyze' | 'answer' | 'none';

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
