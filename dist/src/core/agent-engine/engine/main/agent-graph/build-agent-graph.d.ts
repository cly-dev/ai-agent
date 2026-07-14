import type { AgentGraphState, AgentLangGraphRunInput } from '../types/agent-engine.types';
import type { AgentGraphDeps } from './types/graph.types';
export declare function buildAndRunAgentGraph(deps: AgentGraphDeps, input: AgentLangGraphRunInput): Promise<AgentGraphState>;
