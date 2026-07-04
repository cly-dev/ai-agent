import type { RuntimeRevision } from './runtime-cache.types';

type RevisionRow = { id: number; updatedAt?: Date | string | null };

export function toRevisionIso(value: Date | string | null | undefined): string {
  if (value == null) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

export function buildEntityRevisionsFingerprint(
  rows: RevisionRow[],
): string {
  return [...rows]
    .map((row) => `${row.id}:${toRevisionIso(row.updatedAt)}`)
    .sort()
    .join(',');
}

export function buildToolsRuntimeRevision(
  tools: Array<{
    id: number;
    updatedAt?: Date | string;
    integration?: { id: number; updatedAt?: Date | string };
  }>,
): Pick<RuntimeRevision, 'tools' | 'integrations'> {
  const toolsPart = buildEntityRevisionsFingerprint(tools);
  const integrationById = new Map<number, RevisionRow>();
  for (const tool of tools) {
    const integration = tool.integration;
    if (integration) {
      integrationById.set(integration.id, {
        id: integration.id,
        updatedAt: integration.updatedAt,
      });
    }
  }
  const integrationsPart = buildEntityRevisionsFingerprint([
    ...integrationById.values(),
  ]);
  return { tools: toolsPart, integrations: integrationsPart };
}

export function buildSkillsRuntimeRevision(
  skills: Array<{ id: number; updatedAt?: Date | string }>,
): string {
  return buildEntityRevisionsFingerprint(skills);
}

export function buildHostToolCatalogRevision(input: {
  hostTools: Array<{ id: number; updatedAt: Date | string }>;
  hostPages?: Array<{ id: number; updatedAt: Date | string }>;
  skillBindings: Array<{ id: number; updatedAt: Date | string }>;
  agentBoundHostToolIds: number[];
}): string {
  const hostPart = buildEntityRevisionsFingerprint(
    input.hostTools.map((row) => ({ id: row.id, updatedAt: row.updatedAt })),
  );
  const pagePart = buildEntityRevisionsFingerprint(
    (input.hostPages ?? []).map((row) => ({
      id: row.id,
      updatedAt: row.updatedAt,
    })),
  );
  const skillPart = buildEntityRevisionsFingerprint(input.skillBindings);
  const bindPart = [...input.agentBoundHostToolIds].sort((a, b) => a - b).join(',');
  return `h:${hostPart}|p:${pagePart}|s:${skillPart}|b:${bindPart}`;
}

export function isRuntimeRevisionEqual(
  left: RuntimeRevision | null | undefined,
  right: RuntimeRevision | null | undefined,
): boolean {
  if (!left || !right) {
    return false;
  }
  return (
    left.tools === right.tools &&
    left.skills === right.skills &&
    left.hostTools === right.hostTools &&
    left.integrations === right.integrations
  );
}
