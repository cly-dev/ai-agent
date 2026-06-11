import type { ToolLevel } from '../../../generated/prisma/client';
import type { AgentEngineTool } from '../agent-engine/engine/main/agent-engine.types';
import type {
  BuiltLangChainTools,
  ToolBuildContext,
} from '../tool-engine/tool-engine.service';
import type { SkillRecallStage } from './skill-recall.util';

/** Skill 二次召回用的会话摘要（来自 GOA，非完整 observation）。 */
export type SkillRecallSessionContext = {
  recentEpisodeGoals?: string[];
  activeTaskDeliverable?: string | null;
};

export type SkillRecallPhase = 'solo' | 'contextual';

export type SkillRecallContextGateReason =
  | 'solo_hit'
  | 'context_disabled'
  | 'no_prior_episode'
  | 'new_topic'
  | 'lift_insufficient'
  | 'contextual_miss'
  | 'contextual_hit'
  | 'contextual_eligible';

export type SkillResolveInput = {
  agentId: number;
  userId: number;
  appClientId: number;
  userMessage: string;
  sessionContext?: SkillRecallSessionContext | null;
  allowedTools: AgentEngineTool[];
  toolBuildCtx: ToolBuildContext;
};

export type ActiveSkillSnapshot = {
  id: number;
  name: string;
  description: string | null;
  prompt: string;
  config: unknown;
  riskLevel: ToolLevel;
  capabilityKey: string | null;
};

export type SkillRecallMatch = {
  id: number;
  name: string;
  score: number;
};

export type SkillRecallStageAttempt = {
  stage: SkillRecallStage;
  source: 'vector' | 'keyword' | 'none';
  minScore: number;
  matches: SkillRecallMatch[];
  hit: boolean;
};

export type SkillRecallObservability = {
  recallStage?: SkillRecallStage | null;
  recallSource?: 'vector' | 'keyword' | 'none';
  recallMatches?: SkillRecallMatch[];
  recallStageAttempts?: SkillRecallStageAttempt[];
  /** 实际用于向量/关键词召回的 query（contextual 阶段可能含会话摘要） */
  recallQuery?: string;
  sessionContextUsed?: boolean;
  recallPhase?: SkillRecallPhase;
  soloTopScore?: number | null;
  contextualTopScore?: number | null;
  contextLift?: number | null;
  contextGateReason?: SkillRecallContextGateReason | null;
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
} & SkillRecallObservability;

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
  recallStage: SkillRecallStage;
  recallStageAttempts: SkillRecallStageAttempt[];
  roleSkillFiltered: boolean;
  recallQuery?: string;
  sessionContextUsed?: boolean;
  recallPhase?: SkillRecallPhase;
  soloTopScore?: number | null;
  contextualTopScore?: number | null;
  contextLift?: number | null;
  contextGateReason?: SkillRecallContextGateReason | null;
};

export type SkillResolveResult = SkillResolveMiss | SkillResolveHit;
