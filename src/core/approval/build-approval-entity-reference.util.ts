import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import {
  assessPageContextData,
} from '../host-bridge/page-context-usage.util';
import {
  readInlineRecordsFromPageContext,
} from '../host-bridge/page-context-metadata-scan.util';

export type ApprovalEntityReferenceSource = {
  /** workflow observation ref，如 obs:fetch_data:read */
  ref: string;
  action: string;
  toolName: string | null;
  toolId: number | null;
  data: unknown;
};

/** 审批对照用实体数据：页上下文 + workflow 读取结果。 */
export type ApprovalEntityReference = {
  page: string | null;
  routePath: string | null;
  entityType: string | null;
  entityId: string | null;
  /** pageContext.metadata 内联正文（协议：{ kind: { content, ... } }） */
  inlineRecords: Array<{ kind: string; record: Record<string, unknown> }>;
  /** fetch_data / load_page_context 等节点产出，供与 writeDraft 对照 */
  sources: ApprovalEntityReferenceSource[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseObservationAction(ref: string): string | null {
  const match = /^obs:([^:]+):/.exec(ref.trim());
  return match?.[1] ?? null;
}

function readFetchDataSource(
  ref: string,
  value: unknown,
): ApprovalEntityReferenceSource | null {
  if (!isRecord(value)) {
    return null;
  }
  const toolName = pickString(value.toolName);
  const toolId = typeof value.toolId === 'number' ? value.toolId : null;
  const output = value.output ?? value;
  if (output === undefined) {
    return null;
  }
  return {
    ref,
    action: 'fetch_data',
    toolName,
    toolId,
    data: output,
  };
}

function readLoadPageContextSource(
  ref: string,
  value: unknown,
): ApprovalEntityReferenceSource {
  return {
    ref,
    action: 'load_page_context',
    toolName: null,
    toolId: null,
    data: value,
  };
}

function collectWorkflowSources(
  workflowNodeOutputs: Record<string, unknown>,
): ApprovalEntityReferenceSource[] {
  const sources: ApprovalEntityReferenceSource[] = [];
  for (const [ref, value] of Object.entries(workflowNodeOutputs)) {
    const action = parseObservationAction(ref);
    if (action === 'fetch_data') {
      const row = readFetchDataSource(ref, value);
      if (row) {
        sources.push(row);
      }
      continue;
    }
    if (action === 'load_page_context') {
      sources.push(readLoadPageContextSource(ref, value));
    }
  }
  return sources.sort((left, right) => left.ref.localeCompare(right.ref));
}

export function buildApprovalEntityReferenceFromSnapshot(
  snapshotInput: unknown,
): ApprovalEntityReference {
  const snapshot = snapshotInput as ApprovalResumeSnapshot | null;
  const pageContext = (snapshot?.pageContext ?? null) as AgentChatPageContext | null;
  const assessment = assessPageContextData(pageContext);
  const inlineRecords = pageContext
    ? readInlineRecordsFromPageContext(pageContext).map((row) => ({
        kind: row.kind,
        record: row.record,
      }))
    : [];

  const workflowSources = collectWorkflowSources(
    snapshot?.workflowNodeOutputs ?? {},
  );

  return {
    page: assessment.page,
    routePath: pickString(pageContext?.routePath),
    entityType: assessment.entityType,
    entityId: assessment.entityId,
    inlineRecords,
    sources: workflowSources,
  };
}
