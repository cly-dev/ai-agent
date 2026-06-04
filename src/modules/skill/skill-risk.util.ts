import { ToolLevel } from '../../../generated/prisma/client';
import { maxToolLevel } from '../../core/risk/risk-level.util';

export function resolveSkillRiskLevel(input: {
  explicit?: ToolLevel | null;
  toolRiskLevels: ToolLevel[];
}): ToolLevel {
  const fromTools =
    input.toolRiskLevels.length > 0
      ? maxToolLevel(input.toolRiskLevels)
      : ToolLevel.L1;
  if (input.explicit == null) {
    return fromTools;
  }
  return maxToolLevel([input.explicit, fromTools]);
}
