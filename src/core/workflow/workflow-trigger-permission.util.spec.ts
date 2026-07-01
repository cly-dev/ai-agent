import {
  evaluateWorkflowTriggerPermission,
  evaluateWorkflowTriggerPermissionForNodes,
  extractWorkflowWriteToolIds,
  isWorkflowTriggerPermissionEnabled,
} from './workflow-trigger-permission.util';
import type { WorkflowNodeDef } from './workflow.types';

describe('workflow-trigger-permission.util', () => {
  const nodes: WorkflowNodeDef[] = [
    {
      id: 'fetch',
      action: 'fetch_data',
      name: 'Fetch',
      objective: 'read',
      input: {},
    },
    {
      id: 'write',
      action: 'write_data',
      name: 'Write',
      objective: 'write',
      input: { toolId: 10 },
    },
    {
      id: 'write2',
      action: 'write_data',
      name: 'Write2',
      objective: 'write',
      input: { toolId: 20 },
    },
  ];

  it('extracts unique write_data tool ids', () => {
    expect(extractWorkflowWriteToolIds(nodes)).toEqual([10, 20]);
  });

  it('allows when all write tools covered', () => {
    const decision = evaluateWorkflowTriggerPermissionForNodes({
      nodes,
      allowedToolIds: [10, 20, 30],
    });
    expect(decision).toEqual({
      allowed: true,
      missingToolIds: [],
      skipped: false,
    });
  });

  it('denies with missing tool ids', () => {
    const decision = evaluateWorkflowTriggerPermissionForNodes({
      nodes,
      allowedToolIds: [10],
    });
    expect(decision.allowed).toBe(false);
    expect(decision.missingToolIds).toEqual([20]);
    expect(decision.skipped).toBe(false);
  });

  it('skips check when disabled', () => {
    expect(
      evaluateWorkflowTriggerPermission({
        writeToolIds: [99],
        allowedToolIds: [],
        enabled: false,
      }),
    ).toEqual({ allowed: true, missingToolIds: [], skipped: true });
  });

  it('respects WORKFLOW_TRIGGER_PERMISSION env', () => {
    expect(isWorkflowTriggerPermissionEnabled({})).toBe(true);
    expect(
      isWorkflowTriggerPermissionEnabled({
        WORKFLOW_TRIGGER_PERMISSION: 'false',
      }),
    ).toBe(false);
  });
});
