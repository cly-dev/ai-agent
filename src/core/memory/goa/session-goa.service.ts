import { Injectable, Logger } from '@nestjs/common';
import type { LlmChatMessage } from '../../llm/llm.types';
import {
  appendSessionObservationLedger,
  buildObservationLedgerEntriesFromContext,
  mergePriorToolObservationsFromGoa,
} from './session-goa-ledger.util';
import {
  appendArtifactsFifo,
  appendEpisodeFifo,
  buildActiveTaskFromAgentRun,
  buildArtifactsFromAgentRun,
  buildTurnEpisodeFromAgentRun,
  mergeSessionEntities,
  resolvePersistedActiveTask,
} from './session-goa-projection.util';
import { buildFullSessionGoaPromptMessages } from './session-goa-full-projection.util';
import { SessionGoaStore } from './session-goa.store';
import {
  isActiveTaskChatResumable,
  type SessionGoaPayload,
  type SessionMemoryUpdateContext,
  type StoredTaskPlan,
  type TurnEpisode,
} from './session-goa.types';

@Injectable()
export class SessionGoaService {
  private readonly logger = new Logger(SessionGoaService.name);

  constructor(private readonly goaStore: SessionGoaStore) {}

  /** 只读 DB + 缓存校验（不 migrate / replay）。 */
  async getPayload(sessionId: string): Promise<SessionGoaPayload> {
    return this.goaStore.get(sessionId);
  }

  /** 会话入口：冷启动 migrate / replay 后返回 GOA。 */
  async ensurePayload(sessionId: string): Promise<SessionGoaPayload> {
    return this.goaStore.warm(sessionId);
  }

  async refreshFromAgentRun(
    sessionId: string,
    ctx: SessionMemoryUpdateContext,
  ): Promise<void> {
    const written = await this.appendFromAgentRun(sessionId, ctx);
    if (!written) {
      this.logger.warn(`session GOA write failed sessionId=${sessionId}`);
    }
  }

  async appendFromAgentRun(
    sessionId: string,
    ctx: SessionMemoryUpdateContext,
  ): Promise<{ episode: TurnEpisode } | null> {
    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const base = await this.goaStore.get(sessionId);
        const merged = this.buildMergedPayload(base, ctx);
        const saved = await this.goaStore.saveIfUnchanged(
          sessionId,
          merged.payload,
          base.updatedAt,
        );
        if (saved) {
          return merged.episode ? { episode: merged.episode } : null;
        }
        this.logger.warn(
          `session GOA save conflict retry sessionId=${sessionId} attempt=${attempt + 1}`,
        );
      }
      return null;
    } catch (error) {
      this.logger.warn(
        `session GOA skipped sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private buildMergedPayload(
    base: SessionGoaPayload,
    ctx: SessionMemoryUpdateContext,
  ): { payload: SessionGoaPayload; episode: TurnEpisode | null } {
    const artifacts = buildArtifactsFromAgentRun(ctx);
    const builtTask = buildActiveTaskFromAgentRun({
      ctx,
      artifacts,
      prev: base.activeTask,
    });
    const activeTask = resolvePersistedActiveTask({
      base,
      built: builtTask,
      ctx,
    });
    const entities = mergeSessionEntities(base.entities, ctx.userInput);
    const sessionArtifacts = appendArtifactsFifo(
      base.sessionArtifacts,
      artifacts,
    );
    const ledgerIncoming = buildObservationLedgerEntriesFromContext({
      turnId: ctx.turnId,
      runId: ctx.runId,
      newToolObservations: ctx.newToolObservations,
    });
    const sessionObservationLedger = appendSessionObservationLedger(
      base.sessionObservationLedger ?? [],
      ledgerIncoming,
    );

    if (ctx.phase === 'task_only') {
      return {
        payload: {
          ...base,
          sessionArtifacts,
          sessionObservationLedger,
          activeTask,
          entities,
        },
        episode: null,
      };
    }

    const episode = buildTurnEpisodeFromAgentRun(ctx, artifacts);
    const recentEpisodes = appendEpisodeFifo(base.recentEpisodes, episode);
    return {
      payload: {
        ...base,
        recentEpisodes,
        sessionArtifacts,
        sessionObservationLedger,
        activeTask,
        entities,
      },
      episode,
    };
  }

  buildPromptMessages(payload: SessionGoaPayload): LlmChatMessage[] {
    return buildFullSessionGoaPromptMessages(payload);
  }

  async buildPromptMessagesForSession(sessionId: string): Promise<LlmChatMessage[]> {
    const payload = await this.getPayload(sessionId);
    return this.buildPromptMessages(payload);
  }

  shouldResumeTaskPlan(
    payload: SessionGoaPayload,
    intentKind: 'task' | 'smalltalk' | 'unclear',
  ): payload is SessionGoaPayload & { activeTask: NonNullable<SessionGoaPayload['activeTask']> } {
    if (intentKind !== 'task') {
      return false;
    }
    if (!isActiveTaskChatResumable(payload.activeTask)) {
      return false;
    }
    return payload.activeTask != null;
  }

  buildPriorToolObservationsForGraph(
    payload: SessionGoaPayload | null,
  ): Array<{ name: string; output: unknown }> {
    return mergePriorToolObservationsFromGoa(payload);
  }

  async abandonActiveTask(sessionId: string): Promise<void> {
    try {
      const base = await this.goaStore.get(sessionId);
      await this.goaStore.save(sessionId, {
        ...base,
        activeTask: null,
      });
    } catch (error) {
      this.logger.warn(
        `abandon active task skipped sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  getStoredPlan(
    payload: SessionGoaPayload,
  ): StoredTaskPlan | null {
    return payload.activeTask?.plan ?? null;
  }
}
