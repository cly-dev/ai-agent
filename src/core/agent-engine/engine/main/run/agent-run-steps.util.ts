import type { AgentRunStep } from '../types/agent-engine.types';

/** 审计序号：steps 中已有 step 的最大值（无 step 字段视为 0）。 */
export function maxRunStepNumber(
  steps: Array<{ step?: number | string }>,
): number {
  return steps.reduce(
    (max, row) =>
      Math.max(max, typeof row.step === 'number' ? row.step : 0),
    0,
  );
}

/** 下一条 AgentRunStep 的单调递增序号（与 ReAct iteration 无关）。 */
export function nextRunStepNumber(
  steps: Array<{ step?: number | string }>,
): number {
  return maxRunStepNumber(steps) + 1;
}

export type TurnRunStepSlice = {
  runId: number;
  role: string;
  sequence: number;
  steps: AgentRunStep[];
};

/** Turn 级执行时间线：按 run sequence 拼接各 run 的 steps，并赋予 turnStep。 */
export type TurnExecutionStep = AgentRunStep & {
  turnStep: number;
  sourceRunId: number;
  sourceRunRole: string;
};

export function mergeTurnExecutionSteps(
  runs: TurnRunStepSlice[],
): TurnExecutionStep[] {
  const ordered = [...runs].sort(
    (a, b) => a.sequence - b.sequence || a.runId - b.runId,
  );
  const merged: TurnExecutionStep[] = [];
  let turnStep = 0;
  for (const run of ordered) {
    const steps = Array.isArray(run.steps) ? run.steps : [];
    const sorted = [...steps].sort(
      (a, b) => (typeof a.step === 'number' ? a.step : 0) - (typeof b.step === 'number' ? b.step : 0),
    );
    for (const step of sorted) {
      turnStep += 1;
      merged.push({
        ...step,
        turnStep,
        sourceRunId: run.runId,
        sourceRunRole: run.role,
      });
    }
  }
  return merged;
}

export function parseAgentRunSteps(value: unknown): AgentRunStep[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (row): row is AgentRunStep =>
      row != null && typeof row === 'object' && !Array.isArray(row),
  );
}
