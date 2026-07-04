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
import { WriteGateDecisionRejectedError } from '../agent-engine/engine/write-confirm/write-gate-decision.error';

const WRITE_GATE_JOB_KINDS = new Set<RunJob['kind']>([
  'write_gate_confirm',
  'write_gate_cancel',
  'write_gate_retry',
  'write_confirm',
  'write_cancel',
]);

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
    if (WRITE_GATE_JOB_KINDS.has(job.kind)) {
      try {
        await this.agentEngine.applyWriteGateDecision(
          {
            userId: job.userId,
            sessionId: job.sessionId,
            userMessageId: job.userMessageId,
            pageContext: job.pageContext ?? null,
            decision:
              job.writeGateDecision ?? this.legacyDecisionFromJobKind(job),
          },
          scope,
        );
      } catch (error) {
        if (isAgentRunAbortedError(error)) {
          return;
        }
        if (error instanceof WriteGateDecisionRejectedError) {
          this.logger.warn(
            `write gate decision rejected sessionId=${job.sessionId}: ${error.message}`,
          );
          this.runSse.emitRunError(scope.sessionId, {
            message: error.message,
            code: error.code,
            generation: scope.generation,
          });
          return;
        }
        const userMessage = resolveAgentRunFailureUserMessage(error);
        if (userMessage == null) {
          throw error;
        }
        this.logger.warn(
          `write gate job failed sessionId=${job.sessionId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        this.runSse.emitRunError(scope.sessionId, {
          message: userMessage,
          code: resolveAgentRunFailureCode(error) ?? 'WRITE_GATE_FAILED',
          generation: scope.generation,
        });
      }
      return;
    }

    const content = job.input.trim();
    if (job.kind === 'chat_turn' && !content) {
      return;
    }

    try {
      const run = await this.agentEngine.run(
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
        this.runSse.emitRunError(scope.sessionId, {
          message:
            '当前会话未绑定可用 Agent，无法执行智能回复。请联系管理员配置可用 Agent。',
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

  private legacyDecisionFromJobKind(
    job: RunJob,
  ): import('../draft-review').DraftReviewDecision {
    if (job.kind === 'write_cancel' || job.kind === 'write_gate_cancel') {
      return { action: 'cancel' };
    }
    if (job.kind === 'write_gate_retry') {
      return {
        action: 'retry',
        retryInstruction: job.writeGateDecision?.retryInstruction ?? '',
      };
    }
    return { action: 'confirm' };
  }
}
