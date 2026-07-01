import type { AgentChatPageContext } from './page-context.types';
import type {
  PageContextDataAssessment,
  PageContextDataSufficiency,
  PageContextUsage,
} from './page-context-usage.types';
import {
  buildPageContextObservationName,
  readInlineRecordsFromPageContext,
  resolvePageContextEntityId,
} from './page-context-metadata-scan.util';

export type PageContextMaterializedObservation = {
  name: string;
  output: unknown;
  llmPayload?: Record<string, unknown>;
};

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** 结构化评估 pageContext 数据充足度（不解析用户自然语言）。 */
export function assessPageContextData(
  pageContext: AgentChatPageContext | null | undefined,
): PageContextDataAssessment {
  if (!pageContext) {
    return {
      page: null,
      entityType: null,
      entityId: null,
      dataSufficiency: 'none',
      inlineContentKinds: [],
    };
  }
  const page = pickString(pageContext.page);
  const entityType = pickString(pageContext.entity?.type);
  const entityId = resolvePageContextEntityId(pageContext);
  const inlineRecords = readInlineRecordsFromPageContext(pageContext);
  const inlineContentKinds = inlineRecords.map((row) => row.kind);

  let dataSufficiency: PageContextDataSufficiency = 'none';
  if (inlineContentKinds.length > 0) {
    dataSufficiency = 'inline';
  } else if (entityId) {
    dataSufficiency = 'entity_only';
  }

  return {
    page,
    entityType,
    entityId,
    dataSufficiency,
    inlineContentKinds,
  };
}

export function buildPageContextRouteHint(
  pageContext: AgentChatPageContext | null | undefined,
): Record<string, unknown> | null {
  const assessment = assessPageContextData(pageContext);
  if (
    !assessment.page &&
    assessment.dataSufficiency === 'none' &&
    !assessment.entityId
  ) {
    return null;
  }
  return {
    page: assessment.page,
    entityType: assessment.entityType,
    entityId: assessment.entityId,
    dataSufficiency: assessment.dataSufficiency,
    inlineContentKinds: assessment.inlineContentKinds,
  };
}

export function isPageContextSourcedObservation(input: {
  name: string;
  output?: unknown;
}): boolean {
  if (input.name.startsWith('page_context:')) {
    return true;
  }
  if (!isRecord(input.output)) {
    return false;
  }
  return input.output.source === 'page_context';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 从物化 observation output 读取实体 id。 */
export function readEntityIdFromPageContextObservation(
  output: unknown,
): string | null {
  if (!isRecord(output)) {
    return null;
  }
  const topLevel = pickString(output.entityId);
  if (topLevel) {
    return topLevel;
  }
  const data = output.data;
  if (isRecord(data)) {
    return pickString(data.id);
  }
  const records = output.records;
  if (Array.isArray(records) && records.length > 0 && isRecord(records[0])) {
    return pickString(records[0].id);
  }
  return null;
}

export function pageContextObservationMatchesEntity(input: {
  observation: { name: string; output?: unknown };
  entityId: string | null | undefined;
}): boolean {
  if (!isPageContextSourcedObservation(input.observation)) {
    return false;
  }
  if (!input.entityId) {
    return false;
  }
  const obsEntityId = readEntityIdFromPageContextObservation(
    input.observation.output,
  );
  return obsEntityId != null && obsEntityId === input.entityId;
}

function buildMaterializedObservation(input: {
  kind: string;
  record: Record<string, unknown>;
  entityType: string;
  entityId: string | null;
  page: string | null;
}): PageContextMaterializedObservation {
  const observationName = buildPageContextObservationName(input.kind);
  const output = {
    source: 'page_context',
    entityType: input.entityType,
    entityId: input.entityId,
    page: input.page,
    records: [input.record],
    data: input.record,
    summary: {
      total: 1,
      source: 'page_context_inline',
      entityType: input.entityType,
    },
  };
  return {
    name: observationName,
    output,
    llmPayload: {
      tool: observationName,
      executed: true,
      source: 'session',
      success: true,
      reuseNote:
        'Inline entity data from page_context. Do not call read-list or read-detail for the same entity unless the user explicitly requests a server refresh.',
      records: [input.record],
      summary: {
        total: 1,
        source: 'page_context_inline',
      },
    },
  };
}

/** 将页上内联数据物化为 preloaded observation（供 Plan 跳步与 summarize）。 */
export function materializePageContextObservations(
  pageContext: AgentChatPageContext | null | undefined,
): PageContextMaterializedObservation[] {
  if (!pageContext) {
    return [];
  }
  const assessment = assessPageContextData(pageContext);
  const inlineRecords = readInlineRecordsFromPageContext(pageContext);
  if (inlineRecords.length === 0) {
    return [];
  }
  return inlineRecords.map((row) => {
    const entityId = pickString(row.record.id) ?? assessment.entityId;
    const entityType = assessment.entityType ?? row.kind;
    return buildMaterializedObservation({
      kind: row.kind,
      record: row.record,
      entityType,
      entityId,
      page: assessment.page,
    });
  });
}

export function mergePageContextPreloadedObservations<
  T extends { name: string; output?: unknown },
>(existing: T[], pageContext: AgentChatPageContext | null | undefined): T[] {
  const materialized = materializePageContextObservations(pageContext);
  if (materialized.length === 0) {
    return existing;
  }
  const withoutPageContext = existing.filter(
    (row) => !isPageContextSourcedObservation(row),
  );
  return [...withoutPageContext, ...(materialized as T[])];
}

/**
 * 结构化兜底：仅在 route LLM 失败时，orchestrated + inline 数据视为 applies。
 * 不覆盖 LLM 显式 pageContextApplies=false；不解析用户自然语言。
 */
export function resolveEffectivePageContextApplies(input: {
  route: 'direct_answer' | 'on_page_task' | 'orchestrated_task';
  method: 'llm' | 'fallback_orchestrated';
  pageContextApplies: boolean;
  pageContext: AgentChatPageContext | null | undefined;
}): boolean {
  if (input.route === 'direct_answer') {
    return false;
  }
  if (input.pageContextApplies) {
    return true;
  }
  if (input.method !== 'fallback_orchestrated') {
    return false;
  }
  const assessment = assessPageContextData(input.pageContext);
  return (
    input.route === 'orchestrated_task' &&
    assessment.dataSufficiency === 'inline'
  );
}

/** Plan gather 跳步：从契约或 pageContext 取目标实体 id。 */
export function resolvePageContextEntityIdForPlanSatisfaction(input: {
  pageContextUsage?: Pick<PageContextUsage, 'applies' | 'entityId'> | null;
  pageContext?: AgentChatPageContext | null;
}): string | null {
  if (input.pageContextUsage?.applies && input.pageContextUsage.entityId) {
    return input.pageContextUsage.entityId;
  }
  if (!input.pageContextUsage?.applies) {
    return null;
  }
  return assessPageContextData(input.pageContext).entityId;
}
