import type { TaskPlanStep } from '../agent-engine/engine/main/plan/task-plan.types';
import {
  PLAN_COMPOSE_WRITE_STEP_ID,
  PLAN_WRITE_STEP_ID,
} from '../agent-engine/engine/main/plan/task-plan.util';
import { initWorkflowRun } from './workflow-run.util';
import {
  isWorkflowAwaitUserConfirmResume,
  resolveApprovedWriteToolNamesAfterWorkflowAwait,
  resolveWriteConfirmationPolicy,
  workflowHasAwaitUserConfirmNode,
} from './workflow-mutation-write-gate.util';
import type { WorkflowNodeDef } from './workflow.types';

const mutationWorkflowNodes: WorkflowNodeDef[] = [
  {
    id: 'compose',
    action: 'compose_mutation',
    name: 'Compose',
    objective: 'Compose write args',
    input: { toolId: 1 },
  },
  {
    id: 'present',
    action: 'present_mutation',
    name: 'Present',
    objective: 'Present draft',
    input: {},
  },
  {
    id: 'await',
    action: 'await_user_confirm',
    name: 'Confirm',
    objective: 'Wait',
    input: {},
  },
  {
    id: 'write',
    action: 'write_data',
    name: 'Write',
    objective: 'Execute write',
    input: { toolId: 1 },
  },
];

describe('workflow-mutation-write-gate.util', () => {
  it('workflowHasAwaitUserConfirmNode detects await node', () => {
    expect(workflowHasAwaitUserConfirmNode(mutationWorkflowNodes)).toBe(true);
    expect(
      workflowHasAwaitUserConfirmNode([
        {
          id: 'fetch',
          action: 'fetch_data',
          name: 'Fetch',
          objective: 'Fetch',
          input: {},
        },
      ]),
    ).toBe(false);
  });

  it('resolveWriteConfirmationPolicy defers before await and bypasses at write_data', () => {
    let run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes: mutationWorkflowNodes,
      compiledFrom: 'workflow_db',
    });
    run = {
      ...run,
      currentNodeId: 'compose',
      nodes: run.nodes.map((row) =>
        row.nodeId === 'compose'
          ? { ...row, status: 'running' as const }
          : row,
      ),
    };
    expect(
      resolveWriteConfirmationPolicy({
        workflowRun: run,
        workflowNodeDefs: mutationWorkflowNodes,
      }).kind,
    ).toBe('defer_to_workflow_await');

    const afterAwait = {
      ...run,
      currentNodeId: 'write',
      nodes: run.nodes.map((row) => {
        if (
          row.nodeId === 'compose' ||
          row.nodeId === 'present' ||
          row.nodeId === 'await'
        ) {
          return { ...row, status: 'succeeded' as const };
        }
        if (row.nodeId === 'write') {
          return { ...row, status: 'running' as const };
        }
        return row;
      }),
    };
    expect(
      resolveWriteConfirmationPolicy({
        workflowRun: afterAwait,
        workflowNodeDefs: mutationWorkflowNodes,
      }).kind,
    ).toBe('bypass_after_workflow_await');
  });

  it('resolveWriteConfirmationPolicy gate_now without workflow await node', () => {
    const run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes: [
        {
          id: 'fetch',
          action: 'fetch_data',
          name: 'Fetch',
          objective: 'Fetch',
          input: {},
        },
      ],
      compiledFrom: 'plan_llm',
    });
    expect(
      resolveWriteConfirmationPolicy({
        workflowRun: run,
        workflowNodeDefs: [
          {
            id: 'fetch',
            action: 'fetch_data',
            name: 'Fetch',
            objective: 'Fetch',
            input: {},
          },
        ],
      }).kind,
    ).toBe('gate_now');
  });

  it('isWorkflowAwaitUserConfirmResume detects empty toolCalls at await node', () => {
    const run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes: mutationWorkflowNodes,
      compiledFrom: 'workflow_db',
    });
    const awaiting = {
      ...run,
      currentNodeId: 'await',
      nodes: run.nodes.map((row) =>
        row.nodeId === 'await'
          ? { ...row, status: 'running' as const }
          : row,
      ),
    };
    expect(
      isWorkflowAwaitUserConfirmResume({
        pendingToolCalls: [],
        workflowRun: awaiting,
      }),
    ).toBe(true);
    expect(
      isWorkflowAwaitUserConfirmResume({
        pendingToolCalls: [{ name: 'writeTool', arguments: {} }],
        workflowRun: awaiting,
      }),
    ).toBe(false);
  });

  it('resolveApprovedWriteToolNamesAfterWorkflowAwait prefers plan_compose_write', () => {
    const names = resolveApprovedWriteToolNamesAfterWorkflowAwait({
      observations: [
        {
          name: 'plan_compose_write',
          output: { tool: 'updateCampaign', arguments: { id: 1 } },
        },
      ],
      scopedTools: [
        {
          id: 1,
          name: 'updateCampaign',
          riskLevel: 'L2',
          agentMetadata: { isMutation: true },
        } as never,
      ],
      workflowNodeDefs: mutationWorkflowNodes,
    });
    expect(names).toEqual(['updateCampaign']);
  });

  it('shouldDeferPlanPresentWriteGate is true while on present before await', () => {
    const { shouldDeferPlanPresentWriteGate } = require('./workflow-mutation-write-gate.util');
    const { initWorkflowRun } = require('./workflow-run.util');
    const defs = [
      {
        id: 'compose',
        action: 'compose_mutation',
        name: 'Compose',
        objective: 'Compose',
        input: { toolId: 1 },
      },
      {
        id: 'present',
        action: 'present_mutation',
        name: 'Present',
        objective: 'Present',
        input: {},
      },
      {
        id: 'await',
        action: 'await_user_confirm',
        name: 'Confirm',
        objective: 'Wait',
        input: {},
      },
      {
        id: 'write',
        action: 'write_data',
        name: 'Write',
        objective: 'Write',
        input: { toolId: 1 },
      },
    ];
    let run = initWorkflowRun({
      workflowId: 1,
      version: 1,
      nodes: defs,
      compiledFrom: 'workflow_db',
    });
    run = {
      ...run,
      currentNodeId: 'present',
      nodes: run.nodes.map((row) =>
        row.nodeId === 'present'
          ? { ...row, status: 'running' as const }
          : row,
      ),
    };
    expect(
      shouldDeferPlanPresentWriteGate({
        workflowRun: run,
        workflowNodeDefs: defs,
      }),
    ).toBe(true);
  });
});

describe('isComposeMutationParameterStep', () => {
  it('matches compose_write and workflow compose_mutation analyze step', async () => {
    const { isComposeMutationParameterStep } = await import(
      '../agent-engine/engine/main/plan/task-plan.util'
    );
    const composeWriteStep = {
      id: PLAN_COMPOSE_WRITE_STEP_ID,
      kind: 'tool',
      phase: 'analyze',
      toolRole: 'write-single',
      objective: 'compose',
    } satisfies TaskPlanStep;
    expect(isComposeMutationParameterStep(composeWriteStep)).toBe(true);
    expect(
      isComposeMutationParameterStep(
        {
          id: 'compose_node',
          kind: 'tool',
          phase: 'analyze',
          toolRole: 'write-single',
          objective: 'compose',
        },
        'compose_mutation',
      ),
    ).toBe(true);
    expect(
      isComposeMutationParameterStep(
        {
          id: PLAN_WRITE_STEP_ID,
          kind: 'tool',
          phase: 'mutate',
          toolRole: 'write-single',
          objective: 'write',
        },
        'write_data',
      ),
    ).toBe(false);
  });
});
