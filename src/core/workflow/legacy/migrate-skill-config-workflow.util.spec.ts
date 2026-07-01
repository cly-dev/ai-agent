import { WorkflowDeliverable } from '../../../../generated/prisma/client';
import {
  buildMigratedWorkflowKey,
  buildSkillWorkflowMigrationPlan,
  enrichMigratedWorkflowNodes,
  hasLegacySkillConfigWorkflow,
  mapLegacyDeliverableToWorkflowDeliverable,
  resolveMigratedWorkflowKeyConflict,
  stripLegacySkillConfigWorkflow,
} from './migrate-skill-config-workflow.util';

const LEGACY_CONFIG = {
  deliverable: 'answer',
  workflow: {
    deliverable: 'answer',
    steps: [
      {
        id: 'fetch',
        phase: 'gather',
        kind: 'tool',
        objective: 'Fetch data',
        toolRole: 'read-detail',
      },
      {
        id: 'answer',
        phase: 'answer',
        kind: 'summarize',
        objective: 'Summarize',
      },
    ],
  },
};

describe('migrate-skill-config-workflow.util', () => {
  it('detects legacy workflow steps', () => {
    expect(hasLegacySkillConfigWorkflow(LEGACY_CONFIG)).toBe(true);
    expect(hasLegacySkillConfigWorkflow({ deliverable: 'answer' })).toBe(false);
  });

  it('builds workflow key from capabilityKey', () => {
    expect(
      buildMigratedWorkflowKey({
        skillId: 9,
        capabilityKey: 'order.inquiry',
        skillName: '订单查询',
      }),
    ).toBe('skill.order.inquiry');
  });

  it('maps legacy deliverable to WorkflowDeliverable', () => {
    expect(mapLegacyDeliverableToWorkflowDeliverable('mutation')).toBe(
      WorkflowDeliverable.mutation,
    );
    expect(mapLegacyDeliverableToWorkflowDeliverable('list')).toBe(
      WorkflowDeliverable.analysis,
    );
    expect(mapLegacyDeliverableToWorkflowDeliverable('detail')).toBe(
      WorkflowDeliverable.answer,
    );
  });

  it('enriches fetch_data nodes with bound toolId', () => {
    const nodes = enrichMigratedWorkflowNodes(
      [
        {
          id: 'fetch',
          action: 'fetch_data',
          name: 'fetch',
          objective: 'Fetch',
          input: {},
        },
      ],
      { toolIds: [42], hostToolIds: [] },
    );
    expect(nodes[0]?.input).toEqual({ toolId: 42 });
  });

  it('builds migration plan and passes validation when tools are bound', () => {
    const plan = buildSkillWorkflowMigrationPlan({
      skillId: 1,
      skillName: '订单查询',
      capabilityKey: 'order.inquiry',
      config: LEGACY_CONFIG,
      toolBindings: [{ toolId: 42, isRequired: true }],
      hostToolBindings: [],
    });
    expect(plan).not.toBeNull();
    expect(plan?.workflowKey).toBe('skill.order.inquiry');
    expect(plan?.nodes[0]?.input).toEqual({ toolId: 42 });
    expect(plan?.validationIssues).toEqual([]);
  });

  it('strips workflow block from config', () => {
    expect(stripLegacySkillConfigWorkflow(LEGACY_CONFIG)).toEqual({
      deliverable: 'answer',
    });
  });

  it('resolves workflow key conflicts with skill suffix', () => {
    expect(resolveMigratedWorkflowKeyConflict('skill.order.inquiry', 12)).toBe(
      'skill.order.inquiry.skill12',
    );
  });
});
