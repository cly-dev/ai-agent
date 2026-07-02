import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { AgentEngineService } from '../agent-engine/engine/agent-engine.service';
import {
  resolveAgentRunFailureCode,
  resolveAgentRunFailureUserMessage,
} from '../agent-engine/engine/agent-run-user-messages.util';
import { isAgentRunAbortedError } from './run-aborted.error';
import type { AgentRunSseGateway } from './agent-run-sse.gateway';
import { RunExecutionScope } from './run-execution.scope';
import type { RunJob } from './session-run.types';

@Injectable()
export class AgentRunLauncher {
  private readonly logger = new Logger(AgentRunLauncher.name);

  constructor(
    @Inject(forwardRef(() => AgentEngineService))
    private readonly agentEngine: AgentEngineService,
    @Inject(
      forwardRef(() => require('./agent-run-sse.gateway').AgentRunSseGateway),
    )
    private readonly runSse: AgentRunSseGateway,
  ) {}

  async execute(job: RunJob, scope: RunExecutionScope): Promise<void> {
    if (job.kind === 'write_cancel') {
      await this.agentEngine.cancelPendingWriteConfirmation(
        job.userId,
        job.sessionId,
      );
      return;
    }

    const content = job.input.trim();
    if (job.kind === 'chat_turn' && !content) {
      return;
    }

    try {
      const run =
        job.kind === 'write_confirm'
          ? await this.agentEngine.resumeAfterWriteConfirm(
              {
                userId: job.userId,
                sessionId: job.sessionId,
                userMessageId: job.userMessageId,
                pageContext: job.pageContext ?? null,
              },
              scope,
            )
          : await this.agentEngine.run(
              {
                userId: job.userId,
                sessionId: job.sessionId,
                input: content,
                userMessageId: job.userMessageId!,
                requestedSkillId: job.requestedSkillId,
                pageContext: job.pageContext ?? null,
              },
              scope,
            );

      if (!run) {
        if (job.kind === 'write_confirm') {
          return;
        }
        this.runSse.emitRunError(scope.sessionId, {
          message:
            '当前会话未绑定 Agent，无法执行智能回复。请确认 agentId=1 存在且属于当前 AppClient。',
          code: 'NO_AGENT',
          generation: scope.generation,
        });
      }
    } catch (error) {
      if (isAgentRunAbortedError(error)) {
        return;
      }
      const userMessage = resolveAgentRunFailureUserMessage(error);
      if (userMessage == null) {
        throw error;
      }
      this.logger.warn(
        `agent run failed for sessionId=${job.sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      this.runSse.emitRunError(scope.sessionId, {
        message: userMessage,
        code: resolveAgentRunFailureCode(error) ?? 'LLM_TIMEOUT',
        generation: scope.generation,
      });
    }
  }
}
