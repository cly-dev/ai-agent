import { Injectable } from '@nestjs/common';
import { detectIntentKind as classifyIntentKind } from '../../agent-engine/intent-kind.util';
import { loadSmallTalkHints } from '../../intent/smalltalk-hints.util';
import { SessionGoaService } from '../goa/session-goa.service';
import { SessionTaskResumeFollowUpService } from './session-task-resume-followup.service';
import type { SessionGoaPayload, StoredTaskPlan } from '../goa/session-goa.types';

export type SessionResumeDecision =
  | {
      action: 'resume';
      plan: StoredTaskPlan;
      followUpReason: string | null;
      resumedFromRunId: number | null;
    }
  | { action: 'fresh' }
  | { action: 'abandon_and_fresh' };

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
  }): Promise<SessionResumeDecision> {
    const resumeIntentKind = classifyIntentKind(
      input.latestUserMessage,
      loadSmallTalkHints(),
    );
    if (!this.goaService.shouldResumeTaskPlan(input.goa, resumeIntentKind)) {
      return { action: 'fresh' };
    }

    const activeTask = input.goa.activeTask!;
    const followUp = await this.taskResumeFollowUp.classify({
      sessionId: input.sessionId,
      appClientId: input.appClientId,
      agentId: input.agentId,
      latestUserMessage: input.latestUserMessage,
      goa: input.goa,
    });

    if (followUp && !followUp.continueActiveTask) {
      await this.goaService.abandonActiveTask(input.sessionId);
      return { action: 'abandon_and_fresh' };
    }
    if (!followUp) {
      return { action: 'fresh' };
    }

    return {
      action: 'resume',
      plan: activeTask.plan,
      followUpReason:
        typeof followUp.reason === 'string' ? followUp.reason : null,
      resumedFromRunId: activeTask.lastRunId,
    };
  }
}
