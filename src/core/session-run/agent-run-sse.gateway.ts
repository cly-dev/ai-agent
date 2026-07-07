import { Inject, Injectable, forwardRef } from '@nestjs/common';
import type { HostActionSsePayload } from '../host-bridge/host-action.types';
import type {
  WriteDraftEditPolicy,
  WriteDraftPublic,
} from '../draft-review/write-draft.types';
import { RunEventPublisher } from './run-event.publisher';
import type { SessionRunCoordinator } from './session-run-coordinator.service';

/**
 * Agent Run SSE 统一出口：generation / canPublishRun 门禁 + RunEventPublisher 推送。
 * core 内所有 agent-run 可见事件应经此网关，而非直连 ChatEventsService。
 */
@Injectable()
export class AgentRunSseGateway {
  constructor(
    @Inject(
      forwardRef(
        () =>
          require('./session-run-coordinator.service').SessionRunCoordinator,
      ),
    )
    private readonly coordinator: SessionRunCoordinator,
    private readonly runEvents: RunEventPublisher,
  ) {}

  getBoundRunGeneration(sessionId: string, runId: number): number | null {
    return this.coordinator.getBoundRunGeneration(sessionId, runId);
  }

  getRunAbortSignal(
    sessionId: string,
    runId: number,
  ): AbortSignal | undefined {
    return this.coordinator.getRunAbortSignal(sessionId, runId);
  }

  throwIfAborted(
    sessionId: string,
    runId: number,
    generation: number,
  ): void {
    this.coordinator.throwIfAborted(sessionId, runId, generation);
  }

  canPublishRun(sessionId: string, runId: number): boolean {
    return this.coordinator.canPublishRun(sessionId, runId);
  }

  purgeWriteConfirmationGate(sessionId: string, runId: number): void {
    this.runEvents.purgeWriteConfirmationGate(sessionId, runId);
  }

  private canEmit(sessionId: string, runId?: number): boolean {
    if (runId == null) {
      return true;
    }
    return this.coordinator.canPublishRun(sessionId, runId);
  }

  private boundGeneration(
    sessionId: string,
    runId?: number,
  ): number | undefined {
    if (runId == null) {
      return undefined;
    }
    return this.coordinator.getBoundRunGeneration(sessionId, runId) ?? undefined;
  }

  emitThink(
    sessionId: string,
    runId: number | undefined,
    input: { content: string; mode?: 'delta' | 'replace' },
  ): boolean {
    if (!input.content || !this.canEmit(sessionId, runId)) {
      return false;
    }
    this.runEvents.emitThink(sessionId, {
      ...input,
      runId,
      generation: this.boundGeneration(sessionId, runId),
    });
    return true;
  }

  emitAgentRunMessage(
    sessionId: string,
    runId: number | undefined,
    payload: Record<string, unknown> & { source: 'agent-run'; runId?: number },
  ): boolean {
    if (runId != null && !this.canEmit(sessionId, runId)) {
      return false;
    }
    this.runEvents.emitAgentRunMessage(sessionId, {
      ...payload,
      runId: runId ?? payload.runId,
      generation:
        (payload.generation as number | undefined) ??
        this.boundGeneration(sessionId, runId ?? payload.runId),
    });
    return true;
  }

  emitHostAction(
    sessionId: string,
    runId: number | undefined,
    payload: HostActionSsePayload,
  ): boolean {
    if (runId != null && !this.canEmit(sessionId, runId)) {
      return false;
    }
    const generation = this.boundGeneration(sessionId, runId);
    this.runEvents.emitHostAction(sessionId, {
      ...payload,
      ...(generation != null ? { generation } : {}),
    });
    return true;
  }

  /** 运行中事件：须 run 仍 publishable。 */
  emitConfirmationRequired(
    sessionId: string,
    input: {
      runId: number;
      turnId?: number;
      message: string;
      draftRetryCount?: number;
      draftRetryMax?: number;
      canRetry?: boolean;
      writeDraft?: WriteDraftPublic;
      writeDrafts?: WriteDraftPublic[];
      editPolicy?: WriteDraftEditPolicy | null;
      editPolicies?: WriteDraftEditPolicy[];
    },
  ): boolean {
    if (!this.coordinator.canPublishRun(sessionId, input.runId)) {
      return false;
    }
    this.runEvents.emitConfirmationRequired(sessionId, {
      ...input,
      generation: this.boundGeneration(sessionId, input.runId),
    });
    return true;
  }

  emitRunComplete(
    sessionId: string,
    input: {
      runId: number;
      turnId?: number;
      status: string;
      reason?: string;
    },
  ): boolean {
    if (!this.coordinator.canPublishRun(sessionId, input.runId)) {
      return false;
    }
    this.runEvents.emitAgentRunComplete(sessionId, {
      ...input,
      generation: this.boundGeneration(sessionId, input.runId),
    });
    return true;
  }

  /**
   * 用户主动取消写确认：始终推送（QUEUE 任务响应），附带 generation 供前端过滤。
   */
  emitWriteConfirmationCancelled(
    sessionId: string,
    input: {
      runId: number;
      turnId?: number;
      message: string;
    },
  ): void {
    const generation = this.boundGeneration(sessionId, input.runId);
    this.runEvents.emitWriteConfirmationCancelled(sessionId, {
      ...input,
      generation,
    });
    this.runEvents.emitAgentRunComplete(sessionId, {
      runId: input.runId,
      turnId: input.turnId,
      status: 'success',
      generation,
    });
  }

  emitRunError(
    sessionId: string,
    input: {
      message: string;
      code?: string;
      generation: number;
    },
  ): boolean {
    if (!this.coordinator.isGenerationPublishable(sessionId, input.generation)) {
      return false;
    }
    this.runEvents.emitAgentRunError(sessionId, input);
    return true;
  }

  /** 续跑/确认失败等业务错误：按当前 session generation 推送。 */
  emitWriteConfirmationExpired(sessionId: string): void {
    this.runEvents.emitAgentRunError(sessionId, {
      message: '写操作确认已过期或不存在，请重新发起请求。',
      code: 'WRITE_CONFIRMATION_EXPIRED',
      generation: this.coordinator.getGeneration(sessionId),
    });
  }
}
