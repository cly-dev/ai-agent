import type { WorkflowIrDocument } from './workflow-ir.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function parseWorkflowIrDocument(
  value: unknown,
): WorkflowIrDocument | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (typeof value.entryNodeId !== 'string') return null;
  if (!Array.isArray(value.nodes) || !Array.isArray(value.edges)) return null;
  return value as unknown as WorkflowIrDocument;
}
