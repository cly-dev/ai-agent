import type { TaskPlanSnapshot, TaskPlanStep } from '../agent-engine/engine/main/plan/task-plan.types';
import {
  isPlanComposeWriteStep,
  isComposeMutationParameterStep,
  isPlanPresentSummarizeStep,
  isPlanWriteFallbackStep,
  isPlanWriteToolStep,
  planHasChitchatConstraint,
} from '../agent-engine/engine/main/plan/task-plan.util';
import { initWorkflowRun } from './workflow-run.util';
import type {
  WorkflowNodeDef,
  WorkflowRunCompiledFrom,
  WorkflowRunState,
} from './workflow.types';

function mapPlanSourceToCompiledFrom(
  source: TaskPlanSnapshot['source'],
  method?: string,
): WorkflowRunCompiledFrom {
  if (source === 'llm') {
    return 'plan_llm';
  }
  if (source === 'template' || source === 'page_context') {
    return 'template';
  }
  if (source === 'minimal') {
    return 'minimal';
  }
  if (source === 'workflow') {
    return 'legacy_config';
  }
  if (method === 'session_resume') {
    return 'resume';
  }
  return 'template';
}

function baseNodeFromStep(step: TaskPlanStep): Pick<
  WorkflowNodeDef,
  'id' | 'name' | 'objective'
> {
  return {
    id: step.id,
    name: step.id,
    objective: step.objective,
  };
}

function mapAwaitUserConfirmNode(step: TaskPlanStep): WorkflowNodeDef {
  return {
    ...baseNodeFromStep({
      ...step,
      id: `${step.id}_await`,
      objective: 'Wait for user confirmation before executing write.',
    }),
    action: 'await_user_confirm',
    input: { confirmKind: 'mutation' },
  };
}

function mapPlanStepToWorkflowNodes(
  step: TaskPlanStep,
  constraints: string[] = [],
): WorkflowNodeDef[] {
  if (isPlanComposeWriteStep(step)) {
    return [
      {
        ...baseNodeFromStep(step),
        action: 'compose_mutation',
        input: {},
      },
    ];
  }

  if (isPlanPresentSummarizeStep(step)) {
    return [
      {
        ...baseNodeFromStep(step),
        action: 'present_mutation',
        input: {},
      },
    ];
  }

  if (isComposeMutationParameterStep(step)) {
    return [
      {
        ...baseNodeFromStep(step),
        action: 'compose_mutation',
        input: {},
      },
    ];
  }

  if (isPlanWriteFallbackStep(step)) {
    return [
      mapAwaitUserConfirmNode(step),
      {
        ...baseNodeFromStep(step),
        action: 'write_data',
        input: {},
      },
    ];
  }

  switch (step.kind) {
    case 'tool':
      if (isPlanWriteToolStep(step) && step.phase === 'mutate') {
        if (isPlanWriteFallbackStep(step)) {
          return [
            mapAwaitUserConfirmNode(step),
            {
              ...baseNodeFromStep(step),
              action: 'write_data',
              input: {},
            },
          ];
        }
        return [
          {
            ...baseNodeFromStep(step),
            action: 'write_data',
            input: {},
          },
        ];
      }
      return [
        {
          ...baseNodeFromStep(step),
          action: 'fetch_data',
          input: {},
        },
      ];
    case 'host_tool':
      return [
        {
          ...baseNodeFromStep(step),
          action: 'generate_and_push',
          objective: step.objective,
          input: { hostToolId: 0 },
        },
      ];
    case 'summarize':
      return [
        {
          ...baseNodeFromStep(step),
          action: 'summarize',
          input: { mode: 'final' },
        },
      ];
    case 'reason':
      if (planHasChitchatConstraint({ constraints })) {
        return [
          {
            ...baseNodeFromStep(step),
            action: 'fetch_data',
            input: {},
          },
        ];
      }
      return [
        {
          ...baseNodeFromStep(step),
          action: 'summarize',
          input: { mode: 'draft' },
        },
      ];
    case 'workflow_gate':
      return [
        {
          ...baseNodeFromStep(step),
          action: 'await_user_confirm',
          input: { confirmKind: 'mutation' },
        },
      ];
    case 'skill':
      return [];
    default:
      return [];
  }
}

export function compileTaskPlanToWorkflowNodes(
  steps: TaskPlanStep[],
  constraints: string[] = [],
): WorkflowNodeDef[] {
  const nodes: WorkflowNodeDef[] = [];
  for (const step of steps) {
    nodes.push(...mapPlanStepToWorkflowNodes(step, constraints));
  }
  if (nodes.length === 0 && steps.length > 0) {
    const fallback = steps[steps.length - 1];
    if (fallback) {
      nodes.push({
        id: fallback.id,
        action: 'summarize',
        name: fallback.id,
        objective: fallback.objective,
        input: { mode: 'final' },
      });
    }
  }
  return nodes;
}

export type CompileTaskPlanToWorkflowResult = {
  nodes: WorkflowNodeDef[];
  workflowRun: WorkflowRunState;
  compiledFrom: WorkflowRunCompiledFrom;
};

export function compileTaskPlanToWorkflow(input: {
  plan: TaskPlanSnapshot;
  workflowId?: number;
  version?: number;
  resolveMethod?: string;
}): CompileTaskPlanToWorkflowResult | null {
  const nodes = compileTaskPlanToWorkflowNodes(
    input.plan.steps,
    input.plan.constraints,
  );
  if (nodes.length === 0) {
    return null;
  }
  const compiledFrom = mapPlanSourceToCompiledFrom(
    input.plan.source,
    input.resolveMethod,
  );
  const workflowRun = initWorkflowRun({
    workflowId: input.workflowId ?? 0,
    version: input.version ?? 1,
    nodes,
    compiledFrom,
  });
  return { nodes, workflowRun, compiledFrom };
}
