import type { ToolLevel } from '../../../generated/prisma/client';
import type { AgentEngineTool } from '../agent-engine/engine/main/agent-engine.types';
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

/** 由 scopedTools 交集推导出的可用 Skill（外层 Plan 候选）。 */
export type AvailableSkillRow = ActiveSkillSnapshot & {
  skillToolIds: number[];
};

export type ListAvailableSkillsInput = {
  agentId: number;
  userId: number;
  appClientId: number;
  scopedTools: AgentEngineTool[];
};

export type ListAgentSkillsInput = {
  agentId: number;
  userId: number;
  appClientId: number;
};

/** 预热用：Agent 下用户角色可见的 Skill 摘要（不按 scopedTools 过滤）。 */
export type AgentSkillWarmupRow = {
  id: number;
  name: string;
  description: string | null;
  capabilityKey: string | null;
  riskLevel: ToolLevel;
  toolIds: number[];
};

export type SkillBindResult = {
  scopedTools: AgentEngineTool[];
  scopedAllowedToolIds: number[];
  scopedToolBundle: BuiltLangChainTools;
};
