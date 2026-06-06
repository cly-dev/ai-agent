import type { ResolvedIntentRecallConfig } from './intent-recall-config.types';

/** ≤fullBindMax 全量 bind；>fullBindMax 时走向量/keyword 召回并压至 recallBindMax。 */
export type BindToolsTierRule = 'full' | 'recall';

export type BindToolsTierConfig = {
  /** 候选数 ≤ 此值：全量 bind，不召回截断 */
  fullBindMax: number;
  /** 候选数 > fullBindMax 时召回后的 bind 上限 */
  recallBindMax: number;
  /** 全局硬顶（IntentRecallConfig.bindToolsMax） */
  hardCap: number;
};

export type BindToolsTierResult = {
  topK: number;
  tier: BindToolsTierRule;
  /** 是否需要 recallTopToolsForBind 做排序截断 */
  recallRequired: boolean;
};

const DEFAULT_FULL_BIND_MAX = 5;
const DEFAULT_RECALL_BIND_MAX = 5;

export function readBindToolsTierConfig(
  recall: ResolvedIntentRecallConfig,
): BindToolsTierConfig {
  return {
    fullBindMax: readPositiveIntEnv(
      'AGENT_BIND_FULL_MAX',
      DEFAULT_FULL_BIND_MAX,
    ),
    recallBindMax: readPositiveIntEnv(
      'AGENT_BIND_RECALL_MAX',
      readPositiveIntEnv('AGENT_BIND_MEDIUM_MAX', DEFAULT_RECALL_BIND_MAX),
    ),
    hardCap: recall.bindToolsMax,
  };
}

/**
 * 根据过滤后候选工具数计算本次 bind Top-K。
 * 仅当 recallRequired 为 true 时，调用方应走向量 + keyword 召回截断。
 */
export function resolveBindToolsTopK(
  candidateCount: number,
  cfg: BindToolsTierConfig,
): BindToolsTierResult {
  if (candidateCount <= 0) {
    return { topK: 0, tier: 'full', recallRequired: false };
  }

  if (candidateCount <= cfg.fullBindMax) {
    return {
      topK: candidateCount,
      tier: 'full',
      recallRequired: false,
    };
  }

  const topK = Math.min(cfg.recallBindMax, cfg.hardCap, candidateCount);

  return {
    topK,
    tier: 'recall',
    recallRequired: candidateCount > topK,
  };
}

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
