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

/** 由 scopedTools 交集推导出的可用 Skill（外层 Plan 候选）。 */
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
  /** 当前页 scope 下可用的 Host Tool id（与 intent HTTP scoped 一并用于解析 Skill）。 */
  scopedHostToolIds?: number[];
};

/** 外层 Plan：在 scopedTools 上解析 Skill，可选保证 requestedSkillId 入列。 */
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
  /** 用户显式 skillId：放宽 scoped 限制，仅校验角色可见与绑定能力。 */
  forRequestedSkill?: boolean;
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
  /** SkillHostTool ∩ AgentHostTool 且 HostTool.isActive */
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
