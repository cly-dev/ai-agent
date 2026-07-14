import { ToolLevel } from '../../../../generated/prisma/client';
export declare function resolveSkillRiskLevel(input: {
    explicit?: ToolLevel | null;
    toolRiskLevels: ToolLevel[];
}): ToolLevel;
