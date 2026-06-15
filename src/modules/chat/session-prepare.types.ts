import type { AgentService } from '../agent/agent.service';

export type SessionAllowedToolsRow = Awaited<
  ReturnType<AgentService['getAllowedTools']>
>[number];

export type SessionPrepareSkillRow = {
  id: number;
  name: string;
};

export type SessionPrepareSnapshot = {
  sessionId: string;
  userId: number;
  appClientId: number;
  agentId: number;
  toolIdsFingerprint: string;
  skillIdsFingerprint: string;
  tools: SessionAllowedToolsRow[];
  skills: SessionPrepareSkillRow[];
  warmedAt: string;
};

export type SessionPrepareResult = {
  sessionId: string;
  prepared: boolean;
  agentReady: boolean;
  toolsCount: number;
  skillsCount: number;
  sessionContextWarmed: boolean;
  warmedAt: string;
  fromCache: boolean;
};
