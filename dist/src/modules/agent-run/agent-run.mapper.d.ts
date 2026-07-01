import type { AgentRunDetailRow, AgentRunResponse } from './agent-run.types';
export declare function toAgentRunResponse(row: AgentRunDetailRow): AgentRunResponse;
export declare function toAgentRunResponseList(rows: AgentRunDetailRow[]): AgentRunResponse[];
