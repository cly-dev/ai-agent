import type { AgentService } from '../agent/agent.service';

export type SessionAllowedToolsRow = Awaited<
  ReturnType<AgentService['getAllowedTools']>
>[number];

export type SessionPrepareSnapshot = {
  sessionId: string;
  userId: number;
  appClientId: number;
  agentId: number;
  toolIdsFingerprint: string;
  tools: SessionAllowedToolsRow[];
  warmedAt: string;
};

export type SessionPrepareResult = {
  sessionId: string;
  prepared: boolean;
  agentReady: boolean;
  toolsCount: number;
  sessionContextWarmed: boolean;
  warmedAt: string;
  fromCache: boolean;
};
