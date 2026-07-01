import type { HostToolSkillTrigger } from '../../../generated/prisma/client';
import type {
  AgentHostToolBindingResponse,
  AgentHostToolsBindingResponse,
  ClientHostToolCatalogItem,
  HostPageDetailRow,
  HostPageResponse,
  HostToolDetailRow,
  HostToolResponse,
  SkillHostToolBindingResponse,
  SkillHostToolsBindingResponse,
} from './host-tool.types';

export function toHostPageResponse(row: HostPageDetailRow): HostPageResponse {
  return {
    id: row.id,
    appClientId: row.appClientId,
    appClientName: row.appClient?.name,
    scope: row.scope,
    label: row.label,
    description: row.description,
    routePattern: row.routePattern,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    hostToolCount: row._count?.hostTools,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toHostToolResponse(row: HostToolDetailRow): HostToolResponse {
  return {
    id: row.id,
    appClientId: row.appClientId,
    appClientName: row.appClient?.name,
    hostPageId: row.hostPageId,
    pageScope: row.hostPage?.scope ?? null,
    pageLabel: row.hostPage?.label ?? null,
    definitionKey: row.definitionKey,
    name: row.name,
    description: row.description,
    argsSchema: row.argsSchema,
    argsTemplate: row.argsTemplate,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    config: row.config,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toClientHostToolCatalogItem(
  row: HostToolDetailRow,
): ClientHostToolCatalogItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    argsSchema: row.argsSchema,
    pageScope: row.hostPage?.scope ?? null,
    definitionKey: row.definitionKey,
  };
}

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

export function toAgentHostToolBindingResponse(
  row: AgentHostToolBindingRow,
): AgentHostToolBindingResponse {
  return {
    id: row.id,
    agentId: row.agentId,
    hostToolId: row.hostToolId,
    hostTool: toHostToolResponse(row.hostTool),
  };
}

export function toSkillHostToolBindingResponse(
  row: SkillHostToolBindingRow,
): SkillHostToolBindingResponse {
  return {
    id: row.id,
    skillId: row.skillId,
    hostToolId: row.hostToolId,
    trigger: row.trigger,
    priority: row.priority,
    isRequired: row.isRequired,
    skillArgsTemplate: row.argsTemplate,
    hostTool: toHostToolResponse(row.hostTool),
  };
}

export function toAgentHostToolsBindingResponse(
  agentId: number,
  appClientId: number,
  bindings: AgentHostToolBindingRow[],
): AgentHostToolsBindingResponse {
  const agentHostTools = bindings.map((row) =>
    toAgentHostToolBindingResponse(row),
  );
  return {
    agentId,
    appClientId,
    hostTools: agentHostTools.map((row) => row.hostTool),
    agentHostTools,
  };
}

export function toSkillHostToolsBindingResponse(
  skillId: number,
  appClientId: number,
  bindings: SkillHostToolBindingRow[],
): SkillHostToolsBindingResponse {
  const skillHostTools = bindings.map((row) =>
    toSkillHostToolBindingResponse(row),
  );
  return {
    skillId,
    appClientId,
    hostTools: skillHostTools.map((row) => row.hostTool),
    skillHostTools,
  };
}
