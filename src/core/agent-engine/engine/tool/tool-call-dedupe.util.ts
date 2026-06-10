import { normalizeToolCallArgs } from '../../../llm/tool-call-args.util';

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

/** 本 turn 已记录过的 tool call 签名（含 skipped，避免重复 HTTP）。 */
export function getExecutedToolCallSignaturesFromSteps(
  steps: Array<{
    type: string;
    name?: string;
    input?: unknown;
    output?: unknown;
  }>,
): Set<string> {
  const signatures = new Set<string>();
  for (const step of steps) {
    if (step.type !== 'tool' || !step.name) {
      continue;
    }
    signatures.add(
      toolCallSignature({
        name: step.name,
        arguments: normalizeToolCallArgs(step.input),
      }),
    );
  }
  return signatures;
}

/** 将本轮 LLM tool_calls 拆成「未执行过」与「历史中已执行」两组。 */
export function partitionToolCallsByHistory(
  calls: ToolCallLike[],
  steps: Array<{
    type: string;
    name?: string;
    input?: unknown;
    output?: unknown;
  }>,
): { novel: ToolCallLike[]; duplicates: ToolCallLike[] } {
  const executed = getExecutedToolCallSignaturesFromSteps(steps);
  const novel: ToolCallLike[] = [];
  const duplicates: ToolCallLike[] = [];
  for (const call of calls) {
    if (executed.has(toolCallSignature(call))) {
      duplicates.push(call);
    } else {
      novel.push(call);
    }
  }
  return { novel, duplicates };
}
