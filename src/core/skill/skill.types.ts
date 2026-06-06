import type { ToolLevel } from '../../../generated/prisma/client';
import type { AgentEngineTool } from '../agent-engine/engine/main/agent-engine.types';
import type {
  BuiltLangChainTools,
  ToolBuildContext,
} from '../tool-engine/tool-engine.service';

export type SkillResolveInput = {
  agentId: number;
  userId: number;
  appClientId: number;
  userMessage: string;
  allowedTools: AgentEngineTool[];
  toolBuildCtx: ToolBuildContext;
};

export type ActiveSkillSnapshot = {
  id: number;
  name: string;
  prompt: string;
  riskLevel: ToolLevel;
  capabilityKey: string | null;
};

export type SkillRecallMatch = {
  id: number;
  name: string;
  score: number;
};

export type SkillResolveMiss = {
  hit: false;
  reason:
    | 'no_user_app'
    | 'no_candidates'
    | 'no_relevant_match'
    | 'empty_gate'
    | 'tools_disabled';
  candidateCount?: number;
};

export type SkillResolveHit = {
  hit: true;
  skill: ActiveSkillSnapshot;
  scopedTools: AgentEngineTool[];
  scopedAllowedToolIds: number[];
  scopedToolBundle: BuiltLangChainTools;
  gatedToolCount: number;
  allowedToolCount: number;
  recallSource: 'vector' | 'keyword';
  recallScore: number;
  recallMatches: SkillRecallMatch[];
  roleSkillFiltered: boolean;
};

export type SkillResolveResult = SkillResolveMiss | SkillResolveHit;
