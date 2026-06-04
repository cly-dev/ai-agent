import { ToolLevel } from '../../../generated/prisma/client';
import { parseAgentMetadata } from '../tool-engine/tool-agent-metadata.util';

const LEVEL_WEIGHT: Record<ToolLevel, number> = {
  [ToolLevel.L1]: 1,
  [ToolLevel.L2]: 2,
  [ToolLevel.L3]: 3,
};

/** 取多个等级中的最高档。 */
export function maxToolLevel(levels: ToolLevel[]): ToolLevel {
  if (levels.length === 0) {
    return ToolLevel.L1;
  }
  return levels.reduce((max, level) =>
    LEVEL_WEIGHT[level] > LEVEL_WEIGHT[max] ? level : max,
  );
}

export function isWriteRiskLevel(level: ToolLevel): boolean {
  return level === ToolLevel.L2 || level === ToolLevel.L3;
}

export function toolRequiresWriteConfirmation(input: {
  riskLevel: ToolLevel;
  agentMetadata: unknown;
}): boolean {
  if (isWriteRiskLevel(input.riskLevel)) {
    return true;
  }
  const meta = parseAgentMetadata(input.agentMetadata);
  return meta?.isMutation === true;
}

export function skillRequiresWriteConfirmation(riskLevel: ToolLevel): boolean {
  return isWriteRiskLevel(riskLevel);
}

export function resolveToolWriteConfirmationReason(input: {
  riskLevel: ToolLevel;
  agentMetadata: unknown;
}): string {
  const meta = parseAgentMetadata(input.agentMetadata);
  if (input.riskLevel === ToolLevel.L3) {
    return 'high_risk_tool';
  }
  if (input.riskLevel === ToolLevel.L2) {
    return 'write_risk_tool';
  }
  if (meta?.isMutation) {
    return 'mutation_tool';
  }
  return 'write_operation';
}
