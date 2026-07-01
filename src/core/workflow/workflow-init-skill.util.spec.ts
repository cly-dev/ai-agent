import type { AgentGraphNodeBundle } from '../agent-engine/engine/main/agent-graph/types/graph.types';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';

jest.mock('./load-workflow-definition.util', () => ({
  loadWorkflowForRunDetailed: jest.fn(),
  parseWorkflowOverridesJson: jest.fn(() => null),
}));

import { loadWorkflowForRunDetailed } from './load-workflow-definition.util';
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

  it('resolveSkillWorkflowForInit returns no_workflow_binding when skill has no workflowId', async () => {
    const prisma = {
      skill: {
        findUnique: jest.fn().mockResolvedValue({
          workflowId: null,
          workflowVersion: null,
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
    expect(loadWorkflowForRunDetailed).not.toHaveBeenCalled();
  });

  it('resolveSkillWorkflowForInit returns load_failed when workflow asset is missing', async () => {
    const prisma = {
      skill: {
        findUnique: jest.fn().mockResolvedValue({
          workflowId: 9,
          workflowVersion: 1,
          workflowOverrides: null,
        }),
      },
    };
    jest.mocked(loadWorkflowForRunDetailed).mockResolvedValue({
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
    });
  });

  it('resolveSkillWorkflowForInit returns scope_incompatible when workflow scope mismatches', async () => {
    const prisma = {
      skill: {
        findUnique: jest.fn().mockResolvedValue({
          workflowId: 1,
          workflowVersion: 1,
          workflowOverrides: null,
        }),
      },
    };
    jest.mocked(loadWorkflowForRunDetailed).mockResolvedValue({
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
    ).resolves.toEqual({ kind: 'scope_incompatible', workflowId: 1 });
  });

  it('resolveSkillWorkflowForInit returns loaded when workflow asset resolves', async () => {
    const workflow = {
      workflowId: 9,
      version: 1,
      compiledFrom: 'workflow_db' as const,
      nodes: [],
      workflowRun: { workflowId: 9 } as never,
    };
    const prisma = {
      skill: {
        findUnique: jest.fn().mockResolvedValue({
          workflowId: 9,
          workflowVersion: 1,
          workflowOverrides: null,
        }),
      },
    };
    jest.mocked(loadWorkflowForRunDetailed).mockResolvedValue({
      status: 'loaded',
      workflowId: 9,
      version: 1,
      compiledFrom: 'workflow_db',
      nodes: [],
      workflowRun: { workflowId: 9 } as never,
    });
    await expect(
      resolveSkillWorkflowForInit(prisma as never, {
        skillId: 2,
        appClientId: 1,
        scope: { allowedToolIds: [1], allowedHostToolIds: [] },
      }),
    ).resolves.toEqual({ kind: 'loaded', workflow });
  });
});
