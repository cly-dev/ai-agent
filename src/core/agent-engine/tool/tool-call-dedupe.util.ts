import { normalizeToolCallArgs } from '../../llm/tool-call-args.util';
import type { LlmObservationPayload } from '../observation-format.util';
import { isLikelyReadOnlyQuestion } from '../user-response-style.util';

export type ToolCallLike = {
  name: string;
  arguments: Record<string, unknown>;
};

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(row).sort()) {
      sorted[key] = sortKeysDeep(row[key]);
    }
    return sorted;
  }
  return value;
}

export function stableSerializeToolCallArgs(
  args: Record<string, unknown>,
): string {
  return JSON.stringify(sortKeysDeep(args));
}

export function toolCallSignature(call: ToolCallLike): string {
  return `${call.name}\0${stableSerializeToolCallArgs(call.arguments)}`;
}

/** Most recent tools-node batch (same step index). */
export function getLastToolRoundFromSteps(
  steps: Array<{
    type: string;
    step?: number;
    name?: string;
    input?: unknown;
  }>,
): ToolCallLike[] {
  const toolSteps = steps.filter((row) => row.type === 'tool');
  if (toolSteps.length === 0) {
    return [];
  }
  const lastStepNum = Math.max(...toolSteps.map((row) => row.step ?? 0));
  return toolSteps
    .filter((row) => (row.step ?? 0) === lastStepNum)
    .map((row) => ({
      name: row.name ?? '',
      arguments: normalizeToolCallArgs(row.input),
    }))
    .filter((row) => row.name.length > 0);
}

/** True when current and previous rounds contain the same tool calls (name + args). */
export function areToolCallRoundsIdentical(
  current: ToolCallLike[],
  previous: ToolCallLike[],
): boolean {
  if (current.length === 0 || previous.length === 0) {
    return false;
  }
  if (current.length !== previous.length) {
    return false;
  }
  const currentSigs = current.map(toolCallSignature).sort();
  const previousSigs = previous.map(toolCallSignature).sort();
  return currentSigs.every((sig, index) => sig === previousSigs[index]);
}
