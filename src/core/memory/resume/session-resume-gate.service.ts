import { Injectable } from '@nestjs/common';
import type { TurnExecutionContract } from '../../agent-engine/engine/turn/turn-execution-contract.types';
import { storedPlanCompatibleWithContract } from '../../agent-engine/engine/turn/turn-execution-contract.util';
import { detectIntentKind as classifyIntentKind } from '../../agent-engine/intent-kind.util';
import { loadSmallTalkHints } from '../../intent/smalltalk-hints.util';
import { SessionGoaService } from '../goa/session-goa.service';
import { SessionTaskResumeFollowUpService } from './session-task-resume-followup.service';
import {
  isActiveTaskAwaitingWriteConfirmation,
  type SessionGoaPayload,
} from '../goa/session-goa.types';
import {
  defaultFreshResumeDecision,
  type SessionResumeDecision,
} from './session-resume-decision.types';

export type {
  PlanGoalStrategy,
  SessionResumeDecision,
  TaskResumeFollowUpKind,
} from './session-resume-decision.types';
export {
  defaultFreshResumeDecision,
  goalStrategyFromResumeDecision,
  resumeDecisionKeepsActiveTask,
} from './session-resume-decision.types';

@Injectable()
export class SessionResumeGateService {
  constructor(
    private readonly goaService: SessionGoaService,
    private readonly taskResumeFollowUp: SessionTaskResumeFollowUpService,
  ) {}

  async evaluate(input: {
    sessionId: string;
    appClientId: number;
    agentId: number;
    latestUserMessage: string;
    goa: SessionGoaPayload;
    contract: TurnExecutionContract;
  }): Promise<SessionResumeDecision> {
    const activeTask = input.goa.activeTask;
    if (isActiveTaskAwaitingWriteConfirmation(activeTask)) {
      await this.goaService.abandonActiveTask(input.sessionId);
      return { action: 'abandon_and_fresh' };
    }

    if (
      activeTask?.status === 'in_progress' &&
      !storedPlanCompatibleWithContract(input.contract, activeTask.plan)
    ) {
      await this.goaService.abandonActiveTask(input.sessionId);
      return { action: 'abandon_and_fresh' };
    }

    if (!activeTask) {
      return defaultFreshResumeDecision();
    }

    const resumeIntentKind = classifyIntentKind(
      input.latestUserMessage,
      loadSmallTalkHints(),
    );
    if (!this.goaService.shouldResumeTaskPlan(input.goa, resumeIntentKind)) {
      return {
        action: 'fresh',
        goalStrategy: 'use_turn_message',
        followUpReason: `intent_${resumeIntentKind}`,
      };
    }

    const followUp = await this.taskResumeFollowUp.classify({
      sessionId: input.sessionId,
      appClientId: input.appClientId,
      agentId: input.agentId,
      latestUserMessage: input.latestUserMessage,
      goa: input.goa,
    });

    if (!followUp) {
      return {
        action: 'fresh',
        goalStrategy: 'use_turn_message',
        followUpReason: 'follow_up_unavailable',
      };
    }

    const reason =
      typeof followUp.reason === 'string' ? followUp.reason : null;

    switch (followUp.decision) {
      case 'new_topic':
        await this.goaService.abandonActiveTask(input.sessionId);
        return { action: 'abandon_and_fresh' };
      case 'replan_same_goal':
        return {
          action: 'fresh_same_goal',
          followUpReason: reason,
          goalStrategy: 'inherit_active_task',
        };
      case 'resume':
      default:
        return {
          action: 'resume',
          plan: activeTask.plan,
          followUpReason: reason,
          resumedFromRunId: activeTask.lastRunId,
          workflowRun: activeTask.workflowRun ?? null,
          goalStrategy: 'inherit_active_task',
        };
    }
  }
}
