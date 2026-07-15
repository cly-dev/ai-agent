import type {
  TaskPlanSnapshot,
  TaskPlanStep,
} from '../agent-engine/engine/main/plan/task-plan.types';
import {
  inferDeliverableFromWorkflowNodes,
  normalizeTaskPlanSnapshotForWorkflow,
} from './normalize-task-plan-for-workflow.util';
import { resolveGenerateAndPushHostToolIds } from './resolve-workflow-node-tool-refs.util';
import type { WorkflowNodeDef } from './workflow.types';

function mapFetchDataToPlanStep(node: WorkflowNodeDef): TaskPlanStep {
  return {
    id: node.id,
    kind: 'tool',
    objective: node.objective,
    phase: 'gather',
    toolRole: 'read-detail',
  };
}

function mapGenerateAndPushToPlanSteps(
  node: WorkflowNodeDef<'generate_and_push'>,
): TaskPlanStep[] {
  const hostToolIds = resolveGenerateAndPushHostToolIds(node.input);
  return [
    {
      id: `${node.id}:reason`,
      kind: 'reason',
      objective: node.objective,
      phase: 'answer',
    },
    {
      id: node.id,
      kind: 'host_tool',
      objective: node.objective,
      phase: 'answer',
      ...(hostToolIds.length > 0 ? { hostToolIds } : {}),
    },
  ];
}

function mapSummarizeToPlanStep(node: WorkflowNodeDef): TaskPlanStep {
  return {
    id: node.id,
    kind: 'summarize',
    objective: node.objective,
    phase: 'answer',
  };
}

function mapWorkflowNodeToPlanSteps(node: WorkflowNodeDef): TaskPlanStep[] {
  switch (node.action) {
    case 'load_page_context':
      return [];
    case 'detect_clues':
      return [];
    case 'summarize_images':
      // Plan 镜像：workflow_inline，执行仍走 execute_node（不进 ReAct）
      return [
        {
          id: node.id,
          kind: 'workflow_inline',
          objective: node.objective,
          phase: 'gather',
          stopWhen: 'always',
          workflowAction: 'summarize_images',
        },
      ];
    case 'fetch_data':
      return [mapFetchDataToPlanStep(node)];
    case 'generate_and_push':
      return mapGenerateAndPushToPlanSteps(
        node as WorkflowNodeDef<'generate_and_push'>,
      );
    case 'summarize':
    case 'present_mutation':
      return [mapSummarizeToPlanStep(node)];
    case 'compose_mutation':
      return [
        {
          id: node.id,
          kind: 'tool',
          objective: node.objective,
          phase: 'analyze',
          toolRole: 'write-single',
        },
      ];
    case 'write_data':
      return [
        {
          id: node.id,
          kind: 'tool',
          objective: node.objective,
          phase: 'mutate',
          toolRole: 'write-single',
        },
      ];
    case 'await_user_confirm':
      return [
        {
          id: node.id,
          kind: 'workflow_gate',
          objective: node.objective,
          phase: 'answer',
          stopWhen: 'always',
        },
      ];
    default:
      return [];
  }
}

/** Workflow DB nodes → TaskPlanStep[]（Skill.workflowId 内层帧展开用）。 */
export function compileTaskPlanFromWorkflowNodes(
  nodes: WorkflowNodeDef[],
): TaskPlanStep[] {
  const steps: TaskPlanStep[] = [];
  for (const node of nodes) {
    steps.push(...mapWorkflowNodeToPlanSteps(node));
  }
  return steps;
}

export function compileTaskPlanFromWorkflow(input: {
  nodes: WorkflowNodeDef[];
  originalUserRequest: string;
  goal?: string;
}): TaskPlanSnapshot | null {
  const steps = compileTaskPlanFromWorkflowNodes(input.nodes);
  if (steps.length === 0) {
    return null;
  }
  const first = steps[0]!;
  const base: TaskPlanSnapshot = {
    source: 'workflow',
    originalUserRequest: input.originalUserRequest,
    goal: input.goal ?? input.originalUserRequest,
    deliverable: inferDeliverableFromWorkflowNodes(input.nodes),
    constraints: [],
    steps,
    pendingStepIds: steps.map((row) => row.id),
    completedStepIds: [],
    taskPhase: first.phase,
    currentObjective: first.objective,
    currentStepId: first.id,
    frames: [],
    activeFrameIndex: 0,
  };
  return normalizeTaskPlanSnapshotForWorkflow({
    plan: base,
    nodes: input.nodes,
  });
}
