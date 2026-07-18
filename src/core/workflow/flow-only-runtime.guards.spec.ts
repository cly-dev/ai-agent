import { assertNoNewLegacyWorkflowBinding } from './assert-no-new-legacy-workflow-binding.util';
import { skillIsWorkflowBound } from '../skill/skill-runnable.util';
import { loadSkillExecutionChannels } from './load-skill-execution-channels.util';
import { resolveWorkflowIntentForPersist } from './resolve-workflow-intent-persist.util';

describe('flow-only binding guards', () => {
  it('assertNoNewLegacyWorkflowBinding allows null clear and rejects positive ids', () => {
    expect(() =>
      assertNoNewLegacyWorkflowBinding(null, 'skill'),
    ).not.toThrow();
    expect(() =>
      assertNoNewLegacyWorkflowBinding(undefined, 'page_action'),
    ).not.toThrow();
    expect(() => assertNoNewLegacyWorkflowBinding(0, 'skill')).not.toThrow();
    expect(() => assertNoNewLegacyWorkflowBinding(12, 'skill')).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({
          code: 'LEGACY_WORKFLOW_BINDING_REMOVED',
        }),
      }),
    );
  });

  it('skillIsWorkflowBound only recognizes flowId', () => {
    expect(skillIsWorkflowBound({ workflowId: 9 })).toBe(false);
    expect(skillIsWorkflowBound({ flowId: 3 })).toBe(true);
    expect(skillIsWorkflowBound({ flowId: 3, workflowId: 9 })).toBe(true);
  });

  it('loadSkillExecutionChannels returns empty when pinned revision missing', async () => {
    const resolved = resolveWorkflowIntentForPersist({
      profile: 'page_action',
      preset: 'page_auto_fill',
      presetConfig: { hostToolId: 22 },
    });
    const prisma = {
      flow: {
        findFirst: jest.fn().mockResolvedValue({
          ir: resolved.ir,
          deliverable: 'answer',
          version: 2,
        }),
      },
      flowRevision: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const channels = await loadSkillExecutionChannels(prisma as never, {
      flowId: 8,
      flowVersion: 1,
      skillToolIds: [],
      hostToolIds: [],
    });

    expect(channels.hostPush).toBe(false);
    expect(channels.httpRead).toBe(false);
    expect(prisma.flowRevision.findUnique).toHaveBeenCalled();
  });

  it('loadSkillExecutionChannels ignores legacy workflowId when flowId absent', async () => {
    const prisma = {
      flow: { findFirst: jest.fn() },
      workflow: { findUnique: jest.fn() },
    };
    const channels = await loadSkillExecutionChannels(prisma as never, {
      workflowId: 99,
      workflowVersion: 1,
      skillToolIds: [],
      hostToolIds: [],
    });
    expect(channels.httpRead).toBe(false);
    expect(channels.hostPush).toBe(false);
    expect(prisma.flow.findFirst).not.toHaveBeenCalled();
    expect(prisma.workflow.findUnique).not.toHaveBeenCalled();
  });
});
