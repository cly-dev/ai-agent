import type { AgentGraphNodeBundle } from '../agent-engine/engine/main/agent-graph/types/graph.types';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import type { AgentEngineTool, AgentGraphState, AgentLangGraphRunInput, ToolObservation } from '../agent-engine/engine/main/types/agent-engine.types';
import type { WorkflowNodeDef, WorkflowRunState } from './workflow.types';
export declare function minimalAgentLangGraphInput(overrides?: Partial<AgentLangGraphRunInput>): AgentLangGraphRunInput;
export declare function createMinimalAgentGraphBundle(inputOverrides?: Partial<AgentLangGraphRunInput>): AgentGraphNodeBundle;
export declare const workflowGraphFixtureNodes: WorkflowNodeDef[];
export declare function workflowGraphFixtureTaskPlan(): TaskPlanSnapshot;
export declare function seedWorkflowGraphState(input?: {
    nodes?: WorkflowNodeDef[];
    taskPlan?: TaskPlanSnapshot;
    pageContext?: AgentGraphState['pageContext'];
}): AgentGraphState;
export declare function completedNodeRun(workflowRun: WorkflowRunState, nodeId: string): WorkflowRunState;
export declare const fetchSummarizeWorkflowNodes: WorkflowNodeDef[];
export declare function fetchSummarizeTaskPlan(): TaskPlanSnapshot;
export declare function mockReadDetailTool(): AgentEngineTool;
export declare function mockFetchToolObservation(): ToolObservation;
export declare function seedFetchSummarizeWorkflowState(): AgentGraphState;
