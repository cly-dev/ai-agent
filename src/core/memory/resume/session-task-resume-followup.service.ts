import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { LlmService } from '../../llm/llm.service';
import type { LlmChatMessage } from '../../llm/llm.types';
import { PROMPT_KEYS } from '../../prompt/prompt-template.keys';
import { PromptRegistryService } from '../../prompt/prompt-registry.service';
import { formatGoaContextHint } from '../goa/session-goa-projection.util';
import { formatWorkflowRunPendingSummary } from '../../workflow/workflow-goa-projection.util';
import {
  isActiveTaskChatResumable,
  type SessionGoaPayload,
} from '../goa/session-goa.types';

export const taskResumeFollowUpSchema = z.object({
  continueActiveTask: z.boolean(),
  reason: z.string().optional().nullable(),
});

export type TaskResumeFollowUpDecision = z.infer<typeof taskResumeFollowUpSchema>;

@Injectable()
export class SessionTaskResumeFollowUpService {
  private readonly logger = new Logger(SessionTaskResumeFollowUpService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly promptRegistry: PromptRegistryService,
  ) {}

  async classify(input: {
    sessionId: string;
    appClientId: number;
    agentId: number;
    latestUserMessage: string;
    goa: SessionGoaPayload;
  }): Promise<TaskResumeFollowUpDecision | null> {
    const activeTask = input.goa.activeTask;
    if (!isActiveTaskChatResumable(activeTask)) {
      return null;
    }
    const task = activeTask!;

    const scope = {
      appClientId: input.appClientId,
      agentId: input.agentId,
    };
    const systemPrompt = await this.promptRegistry.render(
      PROMPT_KEYS.AGENT_TASK_RESUME_FOLLOWUP,
      scope,
    );
    const pendingSteps = task.stepProgress
      .filter((step) => step.status === 'pending' || step.status === 'running')
      .map((step) => `${step.stepId}(${step.phase}/${step.kind})`)
      .join(', ');
    const episodeHint = formatGoaContextHint(
      input.goa.recentEpisodes,
      task,
    );
    const workflowHint =
      task.workflowRun != null
        ? formatWorkflowRunPendingSummary(task.workflowRun)
        : '';
    const userContent = [
      `Active task goal: ${task.plan.goal}`,
      `Original request: ${task.plan.originalUserRequest}`,
      `Deliverable: ${task.plan.deliverable}`,
      `Pending/running steps: ${pendingSteps || 'none'}`,
      ...(workflowHint ? [`Workflow state: ${workflowHint}`] : []),
      episodeHint ? `Session memory: ${episodeHint}` : '',
      `Latest user message: ${input.latestUserMessage.trim()}`,
    ]
      .filter((line) => line.length > 0)
      .join('\n');

    const messages: LlmChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    try {
      const { model, messages: fittedMessages } =
        await this.llmService.createLangChainChatModelForMessages(messages, {
          budgetHints: { callKind: 'routing' },
        });
      const structured = await model
        .withStructuredOutput(taskResumeFollowUpSchema)
        .invoke(fittedMessages);
      return taskResumeFollowUpSchema.parse(structured);
    } catch (error) {
      this.logger.warn(
        `task resume follow-up classify failed sessionId=${input.sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      if (
        task.stepProgress.some(
          (step) => step.status === 'pending' || step.status === 'running',
        )
      ) {
        return {
          continueActiveTask: true,
          reason: 'llm_failed_fallback',
        };
      }
      return null;
    }
  }
}
