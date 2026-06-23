import type {
  AgentLinkedToolResponse,
  AgentLinkedToolRow,
  AgentListRow,
  AgentToolBindingItem,
  AgentWithToolsResponse,
  AgentWithToolsRow,
} from '../types/agent.types';
import {
  toAgentHostToolBindingResponse,
} from '../../host-tool/host-tool.mapper';

function mapAgentToolBindings(
  agentTools: AgentWithToolsRow['agentTools'] | AgentListRow['agentTools'],
): { tools: AgentLinkedToolResponse[]; agentTools: AgentToolBindingItem[] } {
  const tools = agentTools.map(({ tool }) => toAgentLinkedToolResponse(tool));
  const bindings = agentTools.map(({ id, agentId, toolId, tool }) => ({
    id,
    agentId,
    toolId,
    tool: toAgentLinkedToolResponse(tool),
  }));
  return { tools, agentTools: bindings };
}

function mapAgentCoreFields(
  row: Omit<AgentWithToolsRow, 'agentTools' | 'agentHostTools'> | Omit<AgentListRow, 'agentTools'>,
) {
  return row;
}

export function toAgentLinkedToolResponse(
  tool: AgentLinkedToolRow,
): AgentLinkedToolResponse {
  const tags: string[] = [];
  const categoryLabel = tool.toolCategory?.label?.trim();
  if (categoryLabel) {
    tags.push(categoryLabel);
  }
  return { ...tool, tags };
}

export function toAgentWithToolsResponse(
  row: AgentWithToolsRow,
): AgentWithToolsResponse {
  const { agentTools, agentHostTools, ...agent } = row;
  const { tools, agentTools: mappedAgentTools } = mapAgentToolBindings(agentTools);
  const mappedAgentHostTools = agentHostTools.map((binding) =>
    toAgentHostToolBindingResponse(binding),
  );
  return {
    ...mapAgentCoreFields(agent),
    tools,
    agentTools: mappedAgentTools,
    hostTools: mappedAgentHostTools.map((binding) => binding.hostTool),
    agentHostTools: mappedAgentHostTools,
    hostToolCount: mappedAgentHostTools.length,
  };
}

export function toAgentListResponse(row: AgentListRow): AgentWithToolsResponse {
  const { agentTools, _count, ...agent } = row;
  const { tools, agentTools: mappedAgentTools } = mapAgentToolBindings(agentTools);
  return {
    ...mapAgentCoreFields(agent),
    tools,
    agentTools: mappedAgentTools,
    hostTools: [],
    agentHostTools: [],
    hostToolCount: _count?.agentHostTools ?? 0,
  };
}

type AgentToolBindingRow = {
  id: number;
  agentId: number;
  toolId: number;
  tool: AgentLinkedToolRow;
};

export function toAgentToolBindingItem(
  binding: AgentToolBindingRow,
): AgentToolBindingItem {
  return {
    id: binding.id,
    agentId: binding.agentId,
    toolId: binding.toolId,
    tool: toAgentLinkedToolResponse(binding.tool),
  };
}

export function toAgentToolBindingItemList(
  bindings: AgentToolBindingRow[],
): AgentToolBindingItem[] {
  return bindings.map((binding) => toAgentToolBindingItem(binding));
}

export function toAgentToolsBindingResponse(
  agentId: number,
  appClientId: number,
  bindings: AgentToolBindingRow[],
) {
  const agentTools = toAgentToolBindingItemList(bindings);
  return {
    agentId,
    appClientId,
    tools: agentTools.map(({ tool }) => tool),
    agentTools,
  };
}

export function toAgentWithToolsResponseList(
  rows: AgentWithToolsRow[],
): AgentWithToolsResponse[] {
  return rows.map((row) => toAgentWithToolsResponse(row));
}

export function toAgentListResponseList(
  rows: AgentListRow[],
): AgentWithToolsResponse[] {
  return rows.map((row) => toAgentListResponse(row));
}
