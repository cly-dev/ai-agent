import type { AgentRunStep } from '../agent-engine/engine/main/types/agent-engine.types';
import type { WorkflowInitSkipReason } from './workflow-init-skip.util';
import type { WorkflowNodeDef, WorkflowRunState } from './workflow.types';

export function buildWorkflowInitRunStepOutput(input: {
  workflowRun: WorkflowRunState;
  nodes: WorkflowNodeDef[];
  source: 'resume' | 'workflow_db' | 'plan_compile';
  skillId?: number | null;
}): Record<string, unknown> {
  return {
    event: 'workflow_init',
    source: input.source,
    compiledFrom: input.workflowRun.compiledFrom ?? null,
    workflowId: input.workflowRun.workflowId,
    version: input.workflowRun.version,
    currentNodeId: input.workflowRun.currentNodeId,
    nodeCount: input.nodes.length,
    nodeIds: input.nodes.map((row) => row.id),
    actions: input.nodes.map((row) => row.action),
    ...(input.skillId != null ? { skillId: input.skillId } : {}),
  };
}

export function appendWorkflowInitRunStep(
  steps: AgentRunStep[],
  stepNum: number,
  output: Record<string, unknown>,
): AgentRunStep[] {
  return [
    ...steps,
    {
      step: stepNum,
      type: 'workflow',
      name: 'workflow_init',
      output,
    },
  ];
}

export function appendWorkflowInitSkippedStep(
  steps: AgentRunStep[],
  stepNum: number,
  input: {
    reason: WorkflowInitSkipReason;
    skillId?: number | null;
    nodeIds?: string[];
  },
): AgentRunStep[] {
  return [
    ...steps,
    {
      step: stepNum,
      type: 'workflow',
      name: 'workflow_init_skipped',
      output: {
        event: 'workflow_init_skipped',
        reason: input.reason,
        ...(input.skillId != null ? { skillId: input.skillId } : {}),
        ...(input.nodeIds?.length ? { nodeIds: input.nodeIds } : {}),
      },
    },
  ];
}
