import { HostToolSkillTrigger } from '../../../../generated/prisma/client';
export declare class BindAgentHostToolsDto {
    hostToolIds: number[];
}
export declare class SkillHostToolBindingItemDto {
    hostToolId: number;
    trigger?: HostToolSkillTrigger;
    argsTemplate?: Record<string, unknown> | null;
    priority?: number;
    isRequired?: boolean;
}
export declare class ReplaceSkillHostToolsDto {
    tools: SkillHostToolBindingItemDto[];
}
