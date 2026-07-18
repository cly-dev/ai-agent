import { ToolLevel } from '../../../../generated/prisma/client';
import { SkillToolBindingItemDto } from './skill-tool-binding.dto';
export declare class CreateSkillDto {
    name: string;
    prompt: string;
    capabilityKey?: string;
    description?: string;
    config?: Record<string, unknown>;
    riskLevel?: ToolLevel;
    isActive?: boolean;
    tools?: SkillToolBindingItemDto[];
    workflowId?: number | null;
    workflowVersion?: number | null;
    flowId?: number | null;
    flowVersion?: number | null;
    workflowOverrides?: Record<string, {
        objective?: string;
    }> | null;
}
