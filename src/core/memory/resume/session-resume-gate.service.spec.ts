import { SessionResumeGateService } from './session-resume-gate.service';
import type { SessionGoaPayload } from '../goa/session-goa.types';
import type { TurnExecutionContract } from '../../agent-engine/engine/turn/turn-execution-contract.types';
import { DEFAULT_TURN_READ_DELIVERABLE } from '../../agent-engine/engine/turn/turn-routing.types';

function orchestratedContract(): TurnExecutionContract {
  return {
    taskKind: 'orchestrated_read',
    routeMeta: {
      method: 'llm',
      reason: 'test',
      suggestedSkillId: null,
      pageContextApplies: false,
      pageContextTaskKind: 'none',
      llmPageContextTaskKind: 'none',
      readDeliverable: DEFAULT_TURN_READ_DELIVERABLE,
    },
    skillChannelAnchored: false,
    terminalRespond: null,
    skillAlignment: {
      status: 'aligned',
      requestedSkillId: null,
      intentFirst: false,
      respond: null,
    },
    plan: {
      enabled: true,
      scopedToolsSource: 'intent',
      skillSelect: 'llm',
      explicitSkillId: null,
      pageHostSkillId: null,
      allowHostToolSteps: false,
      allowHostToolAutoDispatch: false,
      allowHostToolLlmDispatch: false,
      allowSessionResume: true,
      abandonActiveTaskOnFreshPlan: true,
      pageContextPlan: 'none',
      pageContextUsage: {
        applies: false,
        dataSufficiency: 'none',
        page: null,
        entityType: null,
        entityId: null,
        inlineContentKinds: [],
      },
    },
  } as TurnExecutionContract;
}

function goaWithActiveTask(): SessionGoaPayload {
  return {
    version: 1,
    sessionId: 's1',
    recentEpisodes: [],
    artifacts: [],
    observationLedger: [],
    lastPageContext: null,
    activeTask: {
      status: 'in_progress',
      lastRunId: 10,
      plan: {
        source: 'template',
        goal: 'Analyze reviews',
        originalUserRequest: 'Analyze reviews',
        deliverable: 'analysis',
        steps: [],
        frames: [],
        pendingStepIds: ['analyze'],
        completedStepIds: ['fetch'],
        currentStepId: 'analyze',
        currentObjective: 'analyze',
        taskPhase: 'analyze',
        activeFrameIndex: 0,
      },
      stepProgress: [
        {
          stepId: 'analyze',
          phase: 'analyze',
          kind: 'summarize',
          status: 'pending',
        },
      ],
      workflowRun: null,
    },
  } as unknown as SessionGoaPayload;
}

describe('SessionResumeGateService', () => {
  it('returns fresh_same_goal when follow-up chooses replan_same_goal', async () => {
    const goaService = {
      abandonActiveTask: jest.fn(),
      shouldResumeTaskPlan: jest.fn().mockReturnValue(true),
    };
    const taskResumeFollowUp = {
      classify: jest.fn().mockResolvedValue({
        decision: 'replan_same_goal',
        reason: 'new angle',
      }),
    };
    const gate = new SessionResumeGateService(
      goaService as never,
      taskResumeFollowUp as never,
    );

    const decision = await gate.evaluate({
      sessionId: 's1',
      appClientId: 1,
      agentId: 1,
      latestUserMessage: 'analyze from sentiment angle',
      goa: goaWithActiveTask(),
      contract: orchestratedContract(),
    });

    expect(decision).toEqual({
      action: 'fresh_same_goal',
      followUpReason: 'new angle',
      goalStrategy: 'inherit_active_task',
    });
    expect(goaService.abandonActiveTask).not.toHaveBeenCalled();
  });

  it('returns fresh with use_turn_message when intent is not task', async () => {
    const goaService = {
      abandonActiveTask: jest.fn(),
      shouldResumeTaskPlan: jest.fn().mockReturnValue(false),
    };
    const taskResumeFollowUp = { classify: jest.fn() };
    const gate = new SessionResumeGateService(
      goaService as never,
      taskResumeFollowUp as never,
    );

    const decision = await gate.evaluate({
      sessionId: 's1',
      appClientId: 1,
      agentId: 1,
      latestUserMessage: 'thanks',
      goa: goaWithActiveTask(),
      contract: orchestratedContract(),
    });

    expect(decision.action).toBe('fresh');
    if (decision.action === 'fresh') {
      expect(decision.goalStrategy).toBe('use_turn_message');
    }
    expect(taskResumeFollowUp.classify).not.toHaveBeenCalled();
  });
});
