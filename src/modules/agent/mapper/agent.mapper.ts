import type {
  AgentLinkedToolResponse,
  AgentLinkedToolRow,
  AgentToolBindingItem,
  AgentWithToolsResponse,
  AgentWithToolsRow,
} from '../types/agent.types';

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
  const { agentTools, ...agent } = row;
  const tools = agentTools.map(({ tool }) => toAgentLinkedToolResponse(tool));
  return {
    ...agent,
    tools,
    agentTools: agentTools.map(({ id, agentId, toolId, tool }) => ({
      id,
      agentId,
      toolId,
      tool: toAgentLinkedToolResponse(tool),
    })),
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
