import type { AgentGraphNodeBundle, AgentGraphNodeFn } from '../types/graph.types';
import { routeAfterWorkflowReact } from '../../../../../workflow/workflow-graph-routing.util';
export declare function createWorkflowReactNode(bundle: AgentGraphNodeBundle): AgentGraphNodeFn;
export declare function resolveWorkflowReactRoute(state: Parameters<typeof routeAfterWorkflowReact>[0]): string;
