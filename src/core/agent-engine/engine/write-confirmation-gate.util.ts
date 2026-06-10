import type { ToolLevel } from '../../../../generated/prisma/client';
import {
  resolveToolWriteConfirmationReason,
  toolRequiresWriteConfirmation,
} from '../../risk/risk-level.util';

export type WriteConfirmationToolCall = {
  name: string;
  arguments: Record<string, unknown>;
  riskLevel: ToolLevel;
  reason: string;
};

export type ToolLikeForWriteGate = {
  name: string;
  riskLevel: ToolLevel;
  agentMetadata: unknown;
};

export function collectWriteConfirmationRequired(
  pendingToolCalls: Array<{ name: string; arguments: Record<string, unknown> }>,
  scopedTools: ToolLikeForWriteGate[],
): WriteConfirmationToolCall[] {
  const byName = new Map(scopedTools.map((tool) => [tool.name, tool]));
  const out: WriteConfirmationToolCall[] = [];
  for (const call of pendingToolCalls) {
    const def = byName.get(call.name);
    if (!def) {
      continue;
    }
    if (
      !toolRequiresWriteConfirmation({
        riskLevel: def.riskLevel,
        agentMetadata: def.agentMetadata,
      })
    ) {
      continue;
    }
    out.push({
      name: call.name,
      arguments: call.arguments,
      riskLevel: def.riskLevel,
      reason: resolveToolWriteConfirmationReason({
        riskLevel: def.riskLevel,
        agentMetadata: def.agentMetadata,
      }),
    });
  }
  return out;
}

/** 展示给用户的确认文案（不暴露具体 Tool）。 */
export function buildWriteConfirmationUserMessage(): string {
  return '即将执行可能修改数据的操作，请确认是否继续。';
}

/** 将本轮 tool_calls 拆成可先执行的安全调用与待确认的写调用。 */
export function partitionToolCallsByWriteConfirmation(
  pendingToolCalls: Array<{ name: string; arguments: Record<string, unknown> }>,
  scopedTools: ToolLikeForWriteGate[],
  approvedWriteToolNames?: Iterable<string>,
): {
  safeCalls: Array<{ name: string; arguments: Record<string, unknown> }>;
  writeCallsNeedingConfirm: WriteConfirmationToolCall[];
} {
  const approved = new Set(approvedWriteToolNames ?? []);
  const writeCallsNeedingConfirm = collectWriteConfirmationRequired(
    pendingToolCalls,
    scopedTools,
  ).filter((call) => !approved.has(call.name));
  const pendingConfirmNames = new Set(
    writeCallsNeedingConfirm.map((call) => call.name),
  );
  const safeCalls = pendingToolCalls.filter(
    (call) => !pendingConfirmNames.has(call.name),
  );
  return { safeCalls, writeCallsNeedingConfirm };
}
