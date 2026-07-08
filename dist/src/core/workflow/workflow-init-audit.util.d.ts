import type { AgentRunStep } from '../agent-engine/engine/main/types/agent-engine.types';
import type { WorkflowInitSkipReason } from './workflow-init-skip.util';
import type { WorkflowNodeDef, WorkflowRunState } from './workflow.types';
export declare function buildWorkflowInitRunStepOutput(input: {
    workflowRun: WorkflowRunState;
    nodes: WorkflowNodeDef[];
    source: 'resume' | 'workflow_db' | 'plan_compile';
    skillId?: number | null;
}): Record<string, unknown>;
export declare function appendWorkflowInitRunStep(steps: AgentRunStep[], stepNum: number, output: Record<string, unknown>): AgentRunStep[];
export declare function appendWorkflowInitSkippedStep(steps: AgentRunStep[], stepNum: number, input: {
    reason: WorkflowInitSkipReason;
    skillId?: number | null;
    nodeIds?: string[];
}): AgentRunStep[];
