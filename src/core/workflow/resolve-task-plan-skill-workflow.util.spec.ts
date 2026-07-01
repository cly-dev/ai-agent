import { resolveTaskPlan } from '../agent-engine/engine/main/plan/task-plan-llm.util';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';

describe('resolveTaskPlan skillBoundWorkflowPlan', () => {
  it('prefers skillBoundWorkflowPlan over legacy skill.config.workflow', async () => {
    const skillBoundWorkflowPlan: TaskPlanSnapshot = {
      source: 'workflow',
      originalUserRequest: 'do it',
      goal: 'do it',
      deliverable: 'answer',
      constraints: [],
      steps: [
        {
          id: 'db_fetch',
          kind: 'tool',
          objective: 'from db',
          phase: 'gather',
          toolRole: 'read-detail',
        },
      ],
      pendingStepIds: ['db_fetch'],
      completedStepIds: [],
      taskPhase: 'gather',
      currentObjective: 'from db',
      currentStepId: 'db_fetch',
      frames: [],
      activeFrameIndex: 0,
    };

    const result = await resolveTaskPlan({
      llmService: { createLangChainChatModelForMessages: jest.fn() } as never,
      promptRegistry: { render: jest.fn() } as never,
      scope: { appClientId: 1, agentId: 2 },
      planInput: {
        userMessage: 'do it',
        scopedToolSummaries: [],
        skillConfig: {
          workflow: {
            steps: [
              {
                id: 'legacy',
                kind: 'summarize',
                objective: 'legacy',
                phase: 'answer',
              },
            ],
          },
        },
        skillBoundWorkflowPlan,
      },
    });

    expect(result.method).toBe('workflow');
    expect(result.plan).toBe(skillBoundWorkflowPlan);
  });
});
