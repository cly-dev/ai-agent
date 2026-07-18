import type { ToolLevel } from '../../../generated/prisma/client';
import type { AgentEngineTool } from '../agent-engine/engine/main/types/agent-engine.types';
import type { BuiltLangChainTools } from '../tool-engine/tool-engine.service';
export type ActiveSkillSnapshot = {
    id: number;
    name: string;
    description: string | null;
    prompt: string;
    config: unknown;
    riskLevel: ToolLevel;
    capabilityKey: string | null;
};
export type AvailableSkillRow = ActiveSkillSnapshot & {
    skillToolIds: number[];
    hostToolIds: number[];
    runnableKind: 'http' | 'host' | 'both';
    workflowId?: number | null;
    workflowVersion?: number | null;
    flowId?: number | null;
    flowVersion?: number | null;
    workflowOverrides?: unknown;
};
export type ListAvailableSkillsInput = {
    agentId: number;
    userId: number;
    appClientId: number;
    scopedTools: AgentEngineTool[];
    scopedHostToolIds?: number[];
};
export type ResolveSkillsForOuterPlanInput = ListAvailableSkillsInput & {
    requestedSkillId?: number | null;
};
export type GetRunnableSkillDetailInput = {
    agentId: number;
    userId: number;
    appClientId: number;
    skillId: number;
    scopedTools: AgentEngineTool[];
    scopedHostToolIds?: number[];
    forRequestedSkill?: boolean;
};
export type ListAgentSkillsInput = {
    agentId: number;
    userId: number;
    appClientId: number;
};
export type AgentSkillWarmupRow = {
    id: number;
    name: string;
    description: string | null;
    capabilityKey: string | null;
    riskLevel: ToolLevel;
    toolIds: number[];
    hostToolIds: number[];
    workflowId?: number | null;
    workflowVersion?: number | null;
    flowId?: number | null;
    flowVersion?: number | null;
    workflowOverrides?: unknown;
};
export type SkillBindResult = {
    scopedTools: AgentEngineTool[];
    scopedAllowedToolIds: number[];
    scopedToolBundle: BuiltLangChainTools;
};
