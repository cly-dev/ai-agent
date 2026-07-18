import type { AgentGraphNodeBundle } from '../agent-engine/engine/main/agent-graph/types/graph.types';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';

jest.mock('./load-workflow-definition.util', () => ({
  parseWorkflowOverridesJson: jest.fn(() => null),
}));

jest.mock('./load-flow-for-run.util', () => ({
  loadFlowForRunDetailed: jest.fn(),
}));

import { loadFlowForRunDetailed } from './load-flow-for-run.util';
import {
  resolveSkillWorkflowForInit,
  resolveWorkflowBoundSkillId,
} from './workflow-init-skill.util';

function mockBundle(skillId: number | null): AgentGraphNodeBundle {
  return {
    ctx: {
      input: { requestedSkillId: skillId ?? undefined },
      requestedSkillCtx: skillId != null ? { skillId } : null,
    },
  } as AgentGraphNodeBundle;
}

function mockState(input: Partial<AgentGraphState>): AgentGraphState {
  return input as AgentGraphState;
}

describe('workflow-init-skill.util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolveWorkflowBoundSkillId returns null on intent_first', () => {
    expect(
      resolveWorkflowBoundSkillId(
        mockBundle(9),
        mockState({
          turnExecutionContract: {
            skillAlignment: { status: 'intent_first' },
          } as never,
        }),
      ),
    ).toBeNull();
  });

  it('resolveWorkflowBoundSkillId prefers requested skill over autoSelected', () => {
    expect(
      resolveWorkflowBoundSkillId(
        mockBundle(3),
        mockState({
          activeSkillId: 8,
          taskPlan: { autoSelectedSkillId: 5 } as never,
        }),
      ),
    ).toBe(3);
  });

  it('resolveWorkflowBoundSkillId falls back to autoSelectedSkillId', () => {
    expect(
      resolveWorkflowBoundSkillId(
        mockBundle(null),
        mockState({
          taskPlan: { autoSelectedSkillId: 12 } as never,
        }),
      ),
    ).toBe(12);
  });

  it('resolveSkillWorkflowForInit returns no_workflow_binding when skill has no flowId', async () => {
    const prisma = {
      skill: {
        findUnique: jest.fn().mockResolvedValue({
          flowId: null,
          flowVersion: null,
          workflowOverrides: null,
        }),
      },
    };
    await expect(
      resolveSkillWorkflowForInit(prisma as never, {
        skillId: 2,
        appClientId: 1,
        scope: { allowedToolIds: [1], allowedHostToolIds: [] },
      }),
    ).resolves.toEqual({ kind: 'no_workflow_binding' });
    expect(loadFlowForRunDetailed).not.toHaveBeenCalled();
  });

  it('resolveSkillWorkflowForInit ignores legacy workflowId-only binding', async () => {
    const prisma = {
      skill: {
        findUnique: jest.fn().mockResolvedValue({
          flowId: null,
          flowVersion: null,
          workflowId: 9,
          workflowVersion: 1,
          workflowOverrides: null,
        }),
      },
    };
    await expect(
      resolveSkillWorkflowForInit(prisma as never, {
        skillId: 2,
        appClientId: 1,
      }),
    ).resolves.toEqual({ kind: 'no_workflow_binding' });
    expect(loadFlowForRunDetailed).not.toHaveBeenCalled();
  });

  it('resolveSkillWorkflowForInit loads Flow when flowId present', async () => {
    const prisma = {
      skill: {
        findUnique: jest.fn().mockResolvedValue({
          flowId: 4,
          flowVersion: 1,
          workflowOverrides: null,
        }),
      },
    };
    const workflow = {
      workflowId: 4,
      version: 1,
      compiledFrom: 'flow_db' as const,
      nodes: [] as [],
      edges: [] as [],
      entryNodeId: null as string | null,
      edgesDeclared: false,
      workflowRun: { workflowId: 4 } as never,
    };
    jest.mocked(loadFlowForRunDetailed).mockResolvedValue({
      status: 'loaded',
      ...workflow,
    });
    await expect(
      resolveSkillWorkflowForInit(prisma as never, {
        skillId: 2,
        appClientId: 1,
      }),
    ).resolves.toEqual({ kind: 'loaded', workflow, source: 'flow' });
  });

  it('resolveSkillWorkflowForInit returns load_failed when flow asset is missing', async () => {
    const prisma = {
      skill: {
        findUnique: jest.fn().mockResolvedValue({
          flowId: 9,
          flowVersion: 1,
          workflowOverrides: null,
        }),
      },
    };
    jest.mocked(loadFlowForRunDetailed).mockResolvedValue({
      status: 'failed',
      reason: 'asset_missing',
      workflowId: 9,
    });
    await expect(
      resolveSkillWorkflowForInit(prisma as never, {
        skillId: 2,
        appClientId: 1,
        scope: { allowedToolIds: [1], allowedHostToolIds: [] },
      }),
    ).resolves.toEqual({
      kind: 'load_failed',
      workflowId: 9,
      reason: 'asset_missing',
      source: 'flow',
    });
  });

  it('resolveSkillWorkflowForInit returns scope_incompatible when flow scope mismatches', async () => {
    const prisma = {
      skill: {
        findUnique: jest.fn().mockResolvedValue({
          flowId: 1,
          flowVersion: 1,
          workflowOverrides: null,
        }),
      },
    };
    jest.mocked(loadFlowForRunDetailed).mockResolvedValue({
      status: 'failed',
      reason: 'scope_incompatible',
      workflowId: 1,
    });
    await expect(
      resolveSkillWorkflowForInit(prisma as never, {
        skillId: 3,
        appClientId: 1,
        scope: { allowedToolIds: [1], allowedHostToolIds: [3] },
      }),
    ).resolves.toEqual({
      kind: 'scope_incompatible',
      workflowId: 1,
      source: 'flow',
    });
  });
});
