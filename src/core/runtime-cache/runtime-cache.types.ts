import type { HostToolSkillTrigger } from '../../../generated/prisma/client';
import type { HostToolDecisionDefinition } from '../host-bridge';

export type RuntimeRevision = {
  tools: string;
  skills: string;
  hostTools: string;
  integrations: string;
};

export type SessionPrepareSkillRow = {
  id: number;
  name: string;
  updatedAt?: string;
};

export type SessionHostToolsPageEntry = {
  pageScope: string;
  routePath?: string;
  routeParams?: Record<string, unknown>;
  llmTools: HostToolDecisionDefinition[];
  warmedAt: string;
};

/** @deprecated v1 兼容读取 */
export type LegacySessionPrepareSnapshot = {
  schemaVersion?: undefined;
  sessionId: string;
  userId: number;
  appClientId: number;
  agentId: number;
  toolIdsFingerprint: string;
  skillIdsFingerprint: string;
  tools: unknown[];
  skills: SessionPrepareSkillRow[];
  warmedAt: string;
};

/** L1 会话运行快照 schema v2 */
export type SessionRuntimeSnapshot = {
  schemaVersion: 2;
  sessionId: string;
  userId: number;
  appClientId: number;
  agentId: number;
  revision: RuntimeRevision;
  tools: unknown[];
  skills: SessionPrepareSkillRow[];
  hostToolsByPage?: Record<string, SessionHostToolsPageEntry>;
  lastPreparedPage?: string;
  warmedAt: string;
};

export type AgentHostToolCatalogRow = {
  hostToolId: number;
  definitionKey: string;
  name: string;
  description: string;
  hostPageScope: string | null;
  argsSchema: Record<string, unknown>;
  argsTemplate: unknown;
  config: unknown | null;
  isActive: boolean;
  updatedAt: string;
};

export type AgentHostToolSkillBindingRow = {
  skillId: number;
  hostToolId: number;
  trigger: HostToolSkillTrigger;
  isRequired: boolean;
  priority: number;
  argsTemplate: unknown;
  updatedAt: string;
};

export type AgentHostToolCatalogSnapshot = {
  appClientId: number;
  agentId: number;
  revision: string;
  agentBoundHostToolIds: number[];
  agentBoundTools: AgentHostToolCatalogRow[];
  skillBindings: AgentHostToolSkillBindingRow[];
  warmedAt: string;
};

/** L2 Agent 绑定的 HTTP Tool 目录快照 */
export type AgentToolCatalogSnapshot = {
  appClientId: number;
  agentId: number;
  revision: string;
  agentBoundToolIds: number[];
  tools: import('./agent-tool-catalog.types').AgentToolCatalogRow[];
  warmedAt: string;
};

export type AgentSkillCatalogRow = {
  id: number;
  name: string;
  description: string | null;
  capabilityKey: string | null;
  riskLevel: import('../../../generated/prisma/client').ToolLevel;
  updatedAt: string;
  toolIds: number[];
  skillHostToolIds: number[];
  workflowId: number | null;
  workflowVersion: number | null;
};

export type AgentSkillCatalogSnapshot = {
  appClientId: number;
  agentId: number;
  roleId: number;
  revision: string;
  skills: AgentSkillCatalogRow[];
  runnableHostToolIds: number[];
  warmedAt: string;
};
