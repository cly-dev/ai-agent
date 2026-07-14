import { ToolLevel } from '../../../../generated/prisma/client';
export declare class UpdateSkillDto {
    name?: string;
    prompt?: string;
    capabilityKey?: string | null;
    description?: string | null;
    config?: Record<string, unknown> | null;
    isActive?: boolean;
    riskLevel?: ToolLevel;
    workflowId?: number | null;
    workflowVersion?: number | null;
    workflowOverrides?: Record<string, {
        objective?: string;
    }> | null;
}
