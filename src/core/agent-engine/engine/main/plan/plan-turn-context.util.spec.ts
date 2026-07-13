import {
  resolvePlanTurnAxes,
  shouldAbandonActiveTaskForFreshPlan,
} from './plan-turn-context.util';
import type { PlanSessionWorkingMemory } from './task-plan.types';

const baseMemory = (): PlanSessionWorkingMemory => ({
  coverage: 'full_session_goa',
  storageLimits: {
    maxEpisodes: 10,
    maxArtifacts: 10,
    maxObservationLedgerEntries: 50,
  },
  episodes: [],
  artifacts: [],
  observationInventory: [],
  satisfiedToolRoles: [],
  activeTask: {
    status: 'in_progress',
    goal: 'Analyze product feedback trends',
    deliverable: 'analysis',
    originalUserRequest: 'Help me analyze recent product reviews',
    pendingStepIds: ['analyze'],
    completedStepIds: ['fetch'],
    currentStepId: 'analyze',
    stepProgress: [],
  },
});

describe('plan-turn-context.util', () => {
  it('inherits goal only when Resume Gate requests inherit_active_task', () => {
    const axes = resolvePlanTurnAxes({
      turnMessage: 'continue with the analysis',
      goalStrategy: 'inherit_active_task',
      sessionWorkingMemory: baseMemory(),
      contract: {
        taskKind: 'orchestrated_read',
        plan: { allowSessionResume: true },
      } as Pick<
        import('../../turn/turn-execution-contract.types').TurnExecutionContract,
        'taskKind' | 'plan'
      >,
    });
    expect(axes.inheritedFromActiveTask).toBe(true);
    expect(axes.goal).toBe('Analyze product feedback trends');
    expect(axes.goalStrategy).toBe('inherit_active_task');
  });

  it('does not inherit goal when gate strategy is use_turn_message', () => {
    const axes = resolvePlanTurnAxes({
      turnMessage: 'fetch inventory list',
      goalStrategy: 'use_turn_message',
      sessionWorkingMemory: baseMemory(),
      contract: {
        taskKind: 'orchestrated_read',
        plan: { allowSessionResume: true },
      } as Pick<
        import('../../turn/turn-execution-contract.types').TurnExecutionContract,
        'taskKind' | 'plan'
      >,
    });
    expect(axes.inheritedFromActiveTask).toBe(false);
    expect(axes.goal).toBe('fetch inventory list');
    expect(axes.goalStrategy).toBe('use_turn_message');
  });

  it('does not abandon active task for fresh_same_goal', () => {
    expect(
      shouldAbandonActiveTaskForFreshPlan({
        contract: {
          plan: { abandonActiveTaskOnFreshPlan: true },
        } as Pick<
          import('../../turn/turn-execution-contract.types').TurnExecutionContract,
          'plan'
        >,
        resumeDecision: {
          action: 'fresh_same_goal',
          followUpReason: 'replan',
          goalStrategy: 'inherit_active_task',
        },
      }),
    ).toBe(false);
  });

  it('abandons active task on fresh when policy allows', () => {
    expect(
      shouldAbandonActiveTaskForFreshPlan({
        contract: {
          plan: { abandonActiveTaskOnFreshPlan: true },
        } as Pick<
          import('../../turn/turn-execution-contract.types').TurnExecutionContract,
          'plan'
        >,
        resumeDecision: {
          action: 'fresh',
          goalStrategy: 'use_turn_message',
        },
      }),
    ).toBe(true);
  });
});
