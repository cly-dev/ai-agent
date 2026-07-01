import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import type { ToolObservation } from '../agent-engine/engine/main/types/agent-engine.types';
import {
  filterObservationsForPlanSummarize,
  filterScopedToolsForPlanStep,
  finalizePlanAfterSummarize,
  isPendingPlanAnswerStep,
  isPlanAwaitUserConfirmStep,
  isPlanStepBlockingToolScope,
  isPlanTextGenerationStep,
  isPlanWorkflowGateStep,
  planExecutionContextFromState,
  resolveEffectivePlanStep,
  resolvePlanExecutionStep,
  resolvePlanStepExecutionRoute,
  shouldContinuePlanAfterSummarize,
  type PlanScopedTool,
} from '../agent-engine/engine/main/plan/task-plan.util';
import { isPlanDraftSummarizeBeforeWrite } from '../agent-engine/engine/main/plan-present/plan-draft-summarize.util';
import { compileTaskPlanFromWorkflow } from './compile-task-plan-from-workflow.util';
import {
  advanceWorkflowRunAfterWriteConfirm,
  prepareTaskPlanForWorkflowWriteConfirmResume,
} from './workflow-resume.util';
import { initWorkflowRun } from './workflow-run.util';
import type { WorkflowNodeDef, WorkflowRunState } from './workflow.types';

const skill2MutationNodes: WorkflowNodeDef[] = [
  {
    id: 'fetch_before_write',
    action: 'fetch_data',
    name: 'Fetch',
    objective: 'Fetch review detail',
    input: { toolId: 1 },
  },
  {
    id: 'compose_mutation',
    action: 'compose_mutation',
    name: 'Compose',
    objective: 'Compose reply args',
    input: { toolId: 2 },
  },
  {
    id: 'present_mutation',
    action: 'present_mutation',
    name: 'Present',
    objective: 'Present draft',
    input: {},
  },
  {
    id: 'await_confirm',
    action: 'await_user_confirm',
    name: 'Confirm',
    objective: 'Wait for confirmation',
    input: { confirmKind: 'mutation' },
  },
  {
    id: 'write_data',
    action: 'write_data',
    name: 'Write',
    objective: 'Submit reply',
    input: { toolId: 2 },
  },
  {
    id: 'summarize',
    action: 'summarize',
    name: 'Summarize',
    objective: 'Summarize outcome',
    input: { mode: 'final' },
  },
];

const scopedTools: PlanScopedTool[] = [
  {
    name: 'get_review_detail',
    description: 'Read review',
    agentMetadata: {},
    responseProfile: { decisionRole: 'read-detail' },
  },
  {
    name: 'reply_review',
    description: 'Reply to review',
    agentMetadata: {},
    responseProfile: { decisionRole: 'write-single' },
  },
];

function buildMutationPlanAfterPresent(): {
  plan: TaskPlanSnapshot;
  workflowRun: WorkflowRunState;
} {
  const base = compileTaskPlanFromWorkflow({
    nodes: skill2MutationNodes,
    originalUserRequest: 'reviewId 43690 自动回复',
  })!;
  const plan: TaskPlanSnapshot = {
    ...base,
    deliverable: 'mutation',
    completedStepIds: [
      'fetch_before_write',
      'compose_mutation',
      'present_mutation',
    ],
    pendingStepIds: ['await_confirm', 'write_data', 'summarize'],
    currentStepId: 'await_confirm',
    currentObjective: 'Wait for confirmation',
    taskPhase: 'answer',
  };
  let workflowRun = initWorkflowRun({
    workflowId: 2,
    version: 1,
    nodes: skill2MutationNodes,
    compiledFrom: 'workflow_db',
  });
  workflowRun = {
    ...workflowRun,
    currentNodeId: 'await_confirm',
    nodes: workflowRun.nodes.map((row) => {
      if (row.nodeId === 'await_confirm') {
        return { ...row, status: 'pending' as const };
      }
      if (
        row.nodeId === 'fetch_before_write' ||
        row.nodeId === 'compose_mutation' ||
        row.nodeId === 'present_mutation'
      ) {
        return { ...row, status: 'succeeded' as const };
      }
      return row;
    }),
  };
  return { plan, workflowRun };
}

describe('mutation workflow plan flow', () => {
  it('after present: continues graph to workflow_gate instead of END', () => {
    const { plan, workflowRun } = buildMutationPlanAfterPresent();
    const afterPresentPlan = finalizePlanAfterSummarize({
      ...plan,
      pendingStepIds: ['present_mutation', 'await_confirm', 'write_data', 'summarize'],
      completedStepIds: ['fetch_before_write', 'compose_mutation'],
      currentStepId: 'present_mutation',
    });
    expect(afterPresentPlan?.pendingStepIds[0]).toBe('await_confirm');

    const effective = resolveEffectivePlanStep({
      taskPlan: afterPresentPlan,
      workflowRun,
    });
    expect(effective?.kind).toBe('workflow_gate');
    expect(resolvePlanStepExecutionRoute(effective)).toBe('workflow');
    expect(shouldContinuePlanAfterSummarize(afterPresentPlan, workflowRun)).toBe(
      true,
    );
  });

  it('workflow_gate is not treated as answer summarize shortcut', () => {
    const { plan, workflowRun } = buildMutationPlanAfterPresent();
    const effective = resolveEffectivePlanStep({ taskPlan: plan, workflowRun });
    expect(isPlanWorkflowGateStep(effective)).toBe(true);
    expect(isPlanTextGenerationStep(effective)).toBe(false);
    expect(isPlanStepBlockingToolScope(effective)).toBe(true);
    expect(isPendingPlanAnswerStep(plan, workflowRun)).toBe(false);
    expect(isPlanAwaitUserConfirmStep(effective, 'await_user_confirm')).toBe(
      true,
    );
    expect(
      filterScopedToolsForPlanStep(
        [{ name: 'reply_review', description: '', agentMetadata: {}, responseProfile: {} }],
        plan,
        workflowRun,
      ),
    ).toEqual([]);
  });

  it('isPlanDraftSummarizeBeforeWrite is true at present_mutation with workflow_gate next', () => {
    const base = compileTaskPlanFromWorkflow({
      nodes: skill2MutationNodes,
      originalUserRequest: 'reviewId 43690 自动回复',
    })!;
    const plan: TaskPlanSnapshot = {
      ...base,
      deliverable: 'mutation',
      completedStepIds: ['fetch_before_write', 'compose_mutation'],
      pendingStepIds: [
        'present_mutation',
        'await_confirm',
        'write_data',
        'summarize',
      ],
      currentStepId: 'present_mutation',
      currentObjective: 'Present draft',
      taskPhase: 'answer',
    };
    expect(
      isPlanDraftSummarizeBeforeWrite(
        planExecutionContextFromState({
          taskPlan: plan,
          workflowNodeDefs: skill2MutationNodes,
        }),
      ),
    ).toBe(true);
  });

  it('legacy summarize-shaped await routes via workflow action hint without normalize', () => {
    const legacyPlan: TaskPlanSnapshot = {
      source: 'workflow',
      originalUserRequest: 'reply',
      goal: 'reply',
      deliverable: 'answer',
      constraints: [],
      steps: [
        {
          id: 'await_confirm',
          kind: 'summarize',
          phase: 'answer',
          objective: 'Wait',
          stopWhen: 'always',
        },
      ],
      pendingStepIds: ['await_confirm'],
      completedStepIds: [],
      taskPhase: 'answer',
      currentObjective: 'Wait',
      currentStepId: 'await_confirm',
      frames: [],
      activeFrameIndex: 0,
    };
    const run = initWorkflowRun({
      workflowId: 2,
      version: 1,
      nodes: skill2MutationNodes,
      compiledFrom: 'workflow_db',
    });
    const ctx = planExecutionContextFromState({
      taskPlan: legacyPlan,
      workflowRun: {
        ...run,
        currentNodeId: 'await_confirm',
        status: 'running',
      },
      workflowNodeDefs: skill2MutationNodes,
    });
    const { step, workflowNodeAction } = resolvePlanExecutionStep(ctx);
    expect(isPlanTextGenerationStep(step, workflowNodeAction)).toBe(false);
    expect(isPlanWorkflowGateStep(step, workflowNodeAction)).toBe(true);
    expect(shouldContinuePlanAfterSummarize(legacyPlan, ctx.workflowRun, ctx.workflowNodeDefs)).toBe(
      true,
    );
  });

  it('isPlanAwaitUserConfirmStep accepts legacy summarize-shaped await steps', () => {
    expect(
      isPlanAwaitUserConfirmStep(
        {
          id: 'await_confirm',
          kind: 'summarize',
          phase: 'answer',
          objective: 'Wait',
        },
        'await_user_confirm',
      ),
    ).toBe(true);
  });

  it('resolveEffectivePlanStep prefers workflowRun.currentNodeId over stale pending head', () => {
    const { plan, workflowRun } = buildMutationPlanAfterPresent();
    const desyncedPlan: TaskPlanSnapshot = {
      ...plan,
      pendingStepIds: ['await_confirm', 'write_data', 'summarize'],
      currentStepId: 'await_confirm',
    };
    const runOnWrite: WorkflowRunState = {
      ...workflowRun,
      currentNodeId: 'write_data',
      nodes: workflowRun.nodes.map((row) => {
        if (row.nodeId === 'await_confirm') {
          return { ...row, status: 'succeeded' as const };
        }
        if (row.nodeId === 'write_data') {
          return { ...row, status: 'running' as const };
        }
        return row;
      }),
    };
    const effective = resolveEffectivePlanStep({
      taskPlan: desyncedPlan,
      workflowRun: runOnWrite,
    });
    expect(effective?.id).toBe('write_data');
    expect(effective?.kind).toBe('tool');
    expect(isPendingPlanAnswerStep(desyncedPlan, runOnWrite)).toBe(false);
  });

  it('prepareTaskPlanForWorkflowWriteConfirmResume aligns plan after user confirms', () => {
    const { plan, workflowRun } = buildMutationPlanAfterPresent();
    const runBefore = {
      ...workflowRun,
      currentNodeId: 'await_confirm',
      nodes: workflowRun.nodes.map((row) =>
        row.nodeId === 'await_confirm'
          ? { ...row, status: 'running' as const }
          : row,
      ),
    };
    const runAfter = advanceWorkflowRunAfterWriteConfirm(runBefore);
    expect(runAfter.currentNodeId).toBe('write_data');

    const synced = prepareTaskPlanForWorkflowWriteConfirmResume({
      taskPlan: plan,
      workflowRunBeforeAdvance: runBefore,
      workflowNodeDefs: skill2MutationNodes,
      workflowRunAfterAdvance: runAfter,
    });
    expect(synced?.completedStepIds).toContain('await_confirm');
    expect(synced?.pendingStepIds[0]).toBe('write_data');
    expect(synced?.currentStepId).toBe('write_data');
  });

  it('finalizePlanAfterSummarize does not advance workflow_gate steps', () => {
    const { plan } = buildMutationPlanAfterPresent();
    const unchanged = finalizePlanAfterSummarize(plan);
    expect(unchanged?.pendingStepIds[0]).toBe('await_confirm');
    expect(unchanged?.completedStepIds).not.toContain('await_confirm');
  });

  it('terminal mutation summarize includes completed write observations', () => {
    const base = compileTaskPlanFromWorkflow({
      nodes: skill2MutationNodes,
      originalUserRequest: 'reviewId 43690 自动回复',
    })!;
    const plan: TaskPlanSnapshot = {
      ...base,
      deliverable: 'mutation',
      completedStepIds: [
        'fetch_before_write',
        'compose_mutation',
        'present_mutation',
        'await_confirm',
        'write_data',
      ],
      pendingStepIds: ['summarize'],
      currentStepId: 'summarize',
      currentObjective: 'Summarize outcome',
      taskPhase: 'answer',
    };
    const observations: ToolObservation[] = [
      {
        name: 'get_review_detail',
        output: { reviewId: 43690, text: 'Great product' },
      },
      {
        name: 'reply_review',
        output: { success: true, replyText: 'Thank you!' },
      },
      {
        name: 'stale_list',
        output: { items: [] },
      },
    ];
    const { observations: filtered } = filterObservationsForPlanSummarize({
      plan,
      observations,
      scopedTools,
      workflowRun: {
        status: 'running',
        currentNodeId: 'summarize',
      } as WorkflowRunState,
    });
    const names = filtered.map((row) => row.name);
    expect(names).toContain('get_review_detail');
    expect(names).toContain('reply_review');
    expect(names).not.toContain('stale_list');
  });
});
