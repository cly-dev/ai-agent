import type { ToolLevel } from '../../../generated/prisma/client';
import {
  resolveToolWriteConfirmationReason,
  toolRequiresWriteConfirmation,
} from '../risk/risk-level.util';

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
