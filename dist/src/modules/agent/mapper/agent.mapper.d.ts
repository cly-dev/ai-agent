import type { AgentLinkedToolResponse, AgentLinkedToolRow, AgentListRow, AgentToolBindingItem, AgentWithToolsResponse, AgentWithToolsRow } from '../types/agent.types';
export declare function toAgentLinkedToolResponse(tool: AgentLinkedToolRow): AgentLinkedToolResponse;
export declare function toAgentWithToolsResponse(row: AgentWithToolsRow): AgentWithToolsResponse;
export declare function toAgentListResponse(row: AgentListRow): AgentWithToolsResponse;
type AgentToolBindingRow = {
    id: number;
    agentId: number;
    toolId: number;
    tool: AgentLinkedToolRow;
};
export declare function toAgentToolBindingItem(binding: AgentToolBindingRow): AgentToolBindingItem;
export declare function toAgentToolBindingItemList(bindings: AgentToolBindingRow[]): AgentToolBindingItem[];
export declare function toAgentToolsBindingResponse(agentId: number, appClientId: number, bindings: AgentToolBindingRow[]): {
    agentId: number;
    appClientId: number;
    tools: AgentLinkedToolResponse[];
    agentTools: AgentToolBindingItem[];
};
export declare function toAgentWithToolsResponseList(rows: AgentWithToolsRow[]): AgentWithToolsResponse[];
export declare function toAgentListResponseList(rows: AgentListRow[]): AgentWithToolsResponse[];
export {};
