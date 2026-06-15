import type { ToolLevel } from '../../../../generated/prisma/client';
import {
  resolveToolWriteConfirmationReason,
  toolRequiresWriteConfirmation,
} from '../../risk/risk-level.util';
import { satisfiesRequiredWriteToolArgs } from '../../tool-engine/write-tool-draft-injection.util';

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

/** 写确认 gate 仅接受 schema 校验通过的 pending call（禁止无效必填项进 gate）。 */
export function filterSchemaValidWriteConfirmationCalls(
  calls: WriteConfirmationToolCall[],
  scopedTools: ToolLikeForWriteGate[],
): WriteConfirmationToolCall[] {
  const byName = new Map(scopedTools.map((tool) => [tool.name, tool]));
  return calls.filter((call) => {
    const def = byName.get(call.name);
    if (!def) {
      return false;
    }
    return satisfiesRequiredWriteToolArgs(call.arguments, def);
  });
}

/** 展示给用户的确认文案（引导确认上方已展示的操作内容）。 */
export function buildWriteConfirmationUserMessage(): string {
  return '请确认上方展示的操作内容；确认后将执行数据变更。';
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
