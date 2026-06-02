/**
 * 意图召回模块的类型定义。
 * 分为「类目召回」与「工具 bind 召回」两套数据结构。
 */

/** 参与类目向量召回的 ToolCategory 行（来自 Prisma select）。 */
export type ToolCategoryRecallRow = {
  id: number;
  label: string;
  description: string | null;
};

/** 参与工具 bind 召回的工具行（含所属类目，用于优先加分）。 */
export type ToolBindRecallRow = {
  id: number;
  name: string;
  description: string;
  toolCategoryId: number | null;
};

/** 单条类目召回命中项（含相似度分数与召回来源）。 */
export type CategoryRecallMatch = {
  id: number;
  label: string;
  score: number;
  /** vector：embedding 余弦相似度；keyword：关键词 overlap 降级 */
  source: 'vector' | 'keyword';
};

/** 类目向量 Top-K 召回结果。 */
export type CategoryRecallResult = {
  /** 命中的类目 id 列表，供 filterToolsByIntent 白名单过滤 */
  matchedCategoryIds: number[];
  matches: CategoryRecallMatch[];
  /** none：输入为空或未召回 */
  source: 'vector' | 'keyword' | 'none';
  /** 调试信息（可选）：用于落盘召回过程。 */
  debug?: {
    mode: 'vector' | 'keyword' | 'none';
    topK: number;
    minScore: number;
    candidateCount: number;
    scoredTop: Array<{
      id: number;
      label: string;
      score: number;
      source: 'vector' | 'keyword';
    }>;
  };
};

/** 单条工具 bind 召回命中项。 */
export type ToolBindRecallMatch = {
  id: number;
  name: string;
  score: number;
  source: 'vector' | 'keyword';
};

/** 工具 bind Top-K 召回结果。 */
export type ToolBindRecallResult = {
  /** 按分数排序后截断的工具列表（长度 ≤ topK） */
  tools: ToolBindRecallRow[];
  matches: ToolBindRecallMatch[];
  source: 'vector' | 'keyword' | 'none';
  /** 是否发生了截断（候选数 > AGENT_BIND_TOOLS_MAX） */
  capped: boolean;
};
