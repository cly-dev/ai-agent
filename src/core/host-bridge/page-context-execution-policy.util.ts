import type { AgentChatPageContext } from './page-context.types';
import {
  assessPageContextData,
  isPageContextSourcedObservation,
} from './page-context-usage.util';
import type {
  PageContextDataAssessment,
  PageContextPlanKind,
  PageContextUsage,
  TurnPageReadKind,
} from './page-context-usage.types';

/** Turn 执行通道（与 pageContext 消费策略正交）。 */
export type TurnExecutionRoute =
  | 'direct_answer'
  | 'on_page_task'
  | 'orchestrated_task';

export type PageContextExecutionPolicy = {
  usage: PageContextUsage;
  plan: PageContextPlanKind;
};

type PageContextWriteChannel = 'none' | 'http' | 'host';

function isWriteIntentActive(input: {
  writeChannel?: PageContextWriteChannel;
  hostMutationIntent?: boolean;
}): boolean {
  if (input.writeChannel != null) {
    return input.writeChannel !== 'none';
  }
  return Boolean(input.hostMutationIntent);
}

/**
 * pageContext 消费策略：只依赖 applies + 结构化评估 + taskKind。
 * 任意写通道（http / host）激活时不走读 plan。
 */
export function resolvePageContextExecutionPolicy(input: {
  route: TurnExecutionRoute;
  pageContextApplies: boolean;
  pageContextTaskKind: TurnPageReadKind;
  pageContext: AgentChatPageContext | null | undefined;
  writeChannel?: PageContextWriteChannel;
  /** @deprecated 使用 writeChannel */
  hostMutationIntent?: boolean;
}): PageContextExecutionPolicy {
  const assessment = assessPageContextData(input.pageContext);
  const baseUsage = toPageContextUsage(assessment, false);

  if (input.route === 'direct_answer') {
    return { usage: baseUsage, plan: 'none' };
  }

  if (isWriteIntentActive(input)) {
    const usage = input.pageContextApplies
      ? toPageContextUsage(assessment, true)
      : baseUsage;
    return { usage, plan: 'none' };
  }

  if (!input.pageContextApplies || assessment.dataSufficiency === 'none') {
    return { usage: baseUsage, plan: 'none' };
  }

  const appliesUsage = toPageContextUsage(assessment, true);

  if (
    (input.pageContextTaskKind === 'analyze' ||
      input.pageContextTaskKind === 'answer') &&
    assessment.dataSufficiency === 'inline'
  ) {
    return { usage: appliesUsage, plan: 'inline_answer' };
  }

  if (
    (input.pageContextTaskKind === 'analyze' ||
      input.pageContextTaskKind === 'answer') &&
    assessment.dataSufficiency === 'entity_only'
  ) {
    return { usage: appliesUsage, plan: 'entity_read_detail' };
  }

  return { usage: appliesUsage, plan: 'none' };
}

/**
 * on_page_task 仅表示 Host / 浏览器工作流。
 * 分析/作答类 pageContext 消费一律走 orchestrated_task（结构化不变式）。
 */
export function resolveCanonicalTurnRoute(input: {
  llmRoute: TurnExecutionRoute;
  pageContextTaskKind: TurnPageReadKind;
}): TurnExecutionRoute {
  if (input.llmRoute === 'direct_answer') {
    return 'direct_answer';
  }
  if (
    input.pageContextTaskKind === 'analyze' ||
    input.pageContextTaskKind === 'answer'
  ) {
    return 'orchestrated_task';
  }
  return input.llmRoute;
}

/** 物化条件只读契约 usage，与 route 无关。 */
export function shouldMaterializePageContextFromUsage(
  usage: Pick<PageContextUsage, 'applies' | 'dataSufficiency'>,
): boolean {
  return usage.applies && usage.dataSufficiency === 'inline';
}

/** 外层 plan 是否由 pageContext 契约接管（优先于 skill 展开）。 */
export function isPageContextOuterPlanActive(
  pageContextPlan: PageContextPlanKind,
): boolean {
  return pageContextPlan !== 'none';
}

/** 物化 observation 是否已注入观测桶。 */
export function hasPageContextMaterializedObservations(
  observations: Array<{ name: string; output?: unknown }>,
): boolean {
  return observations.some((row) => isPageContextSourcedObservation(row));
}

/** fresh run：pageContext inline plan 是否可跳过 ReAct 直接 summarize（不含 gather 模板）。 */
export function planInitialSummarizeReadyOnFresh(input: {
  planSource: string;
  planConstraints: string[];
  allObservations: Array<{ name: string; output?: unknown }>;
}): boolean {
  if (
    input.planSource === 'page_context' ||
    input.planConstraints.includes('page_context_inline')
  ) {
    return hasPageContextMaterializedObservations(input.allObservations);
  }
  return false;
}

function toPageContextUsage(
  assessment: PageContextDataAssessment,
  applies: boolean,
): PageContextUsage {
  return { ...assessment, applies };
}
