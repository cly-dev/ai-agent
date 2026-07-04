import type { HostToolSkillTrigger } from '../../../generated/prisma/client';
import type { AgentHostToolBindingResponse, AgentHostToolsBindingResponse, ClientHostToolCatalogItem, HostPageDetailRow, HostPageResponse, HostToolDetailRow, HostToolResponse, SkillHostToolBindingResponse, SkillHostToolsBindingResponse } from './host-tool.types';
export declare function toHostPageResponse(row: HostPageDetailRow): HostPageResponse;
export declare function toHostToolResponse(row: HostToolDetailRow): HostToolResponse;
export declare function toClientHostToolCatalogItem(row: HostToolDetailRow): ClientHostToolCatalogItem;
type AgentHostToolBindingRow = {
    id: number;
    agentId: number;
    hostToolId: number;
    hostTool: HostToolDetailRow;
};
type SkillHostToolBindingRow = {
    id: number;
    skillId: number;
    hostToolId: number;
    trigger: HostToolSkillTrigger;
    priority: number;
    isRequired: boolean;
    argsTemplate: unknown | null;
    hostTool: HostToolDetailRow;
};
export declare function toAgentHostToolBindingResponse(row: AgentHostToolBindingRow): AgentHostToolBindingResponse;
export declare function toSkillHostToolBindingResponse(row: SkillHostToolBindingRow): SkillHostToolBindingResponse;
export declare function toAgentHostToolsBindingResponse(agentId: number, appClientId: number, bindings: AgentHostToolBindingRow[]): AgentHostToolsBindingResponse;
export declare function toSkillHostToolsBindingResponse(skillId: number, appClientId: number, bindings: SkillHostToolBindingRow[]): SkillHostToolsBindingResponse;
export {};
