import type { AgentGraphNodeBundle } from '../agent-engine/engine/main/agent-graph/types/graph.types';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import type { WorkflowRunState } from './workflow.types';
export declare function applyWorkflowAwaitUserConfirmGate(bundle: AgentGraphNodeBundle, state: AgentGraphState, input: {
    steps: AgentGraphState['steps'];
    workflowRun: WorkflowRunState;
    taskPlan: TaskPlanSnapshot;
    nodeId: string;
}): Promise<AgentGraphState>;
