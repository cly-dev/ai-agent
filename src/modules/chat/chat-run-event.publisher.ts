import type { HostActionSsePayload } from '../../core/host-bridge/host-action.types';
import { Injectable } from '@nestjs/common';
import { RunEventPublisher } from '../../core/session-run/run-event.publisher';
import { ChatEventsService } from './chat-events.service';

@Injectable()
export class ChatRunEventPublisher extends RunEventPublisher {
  constructor(private readonly chatEvents: ChatEventsService) {
    super();
  }

  purgeReplayForSession(sessionId: string): void {
    this.chatEvents.purgeReplayForSession(sessionId);
  }

  purgeWriteConfirmationGate(sessionId: string, runId: number): void {
    this.chatEvents.purgeWriteConfirmationGate(sessionId, runId);
  }

  emitRunAborted(
    sessionId: string,
    input: {
      runId: number;
      turnId?: number;
      generation: number;
      reason: 'cancelled' | 'superseded';
    },
  ): void {
    this.chatEvents.emitRunAborted(sessionId, input);
  }

  emitAgentRunError(
    sessionId: string,
    input: {
      message: string;
      code?: string;
      generation: number;
    },
  ): void {
    this.chatEvents.emit(sessionId, {
      event: 'error',
      payload: input,
    });
  }

  emitAgentRunComplete(
    sessionId: string,
    input: {
      runId: number;
      turnId?: number;
      status: string;
      generation?: number;
      reason?: string;
    },
  ): void {
    this.chatEvents.emit(sessionId, {
      event: 'complete',
      payload: {
        source: 'agent-run',
        ...input,
      },
    });
  }

  emitConfirmationRequired(
    sessionId: string,
    input: {
      runId: number;
      turnId?: number;
      message: string;
      generation?: number;
    },
  ): void {
    this.chatEvents.emit(sessionId, {
      event: 'message',
      payload: {
        source: 'agent-run',
        action: 'confirmation_required',
        runId: input.runId,
        turnId: input.turnId,
        message: input.message,
        generation: input.generation,
      },
    });
  }

  emitWriteConfirmationCancelled(
    sessionId: string,
    input: {
      runId: number;
      turnId?: number;
      message: string;
      generation?: number;
    },
  ): void {
    this.chatEvents.emit(sessionId, {
      event: 'message',
      payload: {
        source: 'agent-run',
        action: 'write_confirmation_cancelled',
        runId: input.runId,
        turnId: input.turnId,
        message: input.message,
        generation: input.generation,
      },
    });
  }

  emitThink(
    sessionId: string,
    payload: {
      content: string;
      mode?: 'delta' | 'replace';
      runId?: number;
      generation?: number;
    },
  ): void {
    this.chatEvents.emit(sessionId, {
      event: 'think',
      payload,
    });
  }

  emitAgentRunMessage(
    sessionId: string,
    payload: Record<string, unknown> & {
      source: 'agent-run';
      runId?: number;
      generation?: number;
    },
  ): void {
    this.chatEvents.emit(sessionId, {
      event: 'message',
      payload,
    });
  }

  emitHostAction(sessionId: string, payload: HostActionSsePayload): void {
    this.chatEvents.emit(sessionId, {
      event: 'host_action',
      payload,
    });
  }
}
