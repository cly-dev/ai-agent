import { Injectable, Logger } from '@nestjs/common';
import { AgentRunRole, AgentRunStatus } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { appendSessionObservationLedger } from './session-goa-ledger.util';
import { appendEpisodeFifo } from './session-goa-projection.util';
import {
  extractObservationLogFromRunSteps,
  replayActiveTaskFromRuns,
  type ReplayRunRow,
} from './session-goa-replay.util';
import {
  createEmptySessionGoaPayload,
  type SessionGoaPayload,
  type TurnEpisode,
  type TurnEpisodeStatus,
} from './session-goa.types';

const EPISODE_GOAL_MAX = 200;
const EPISODE_OUTCOME_MAX = 400;

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max)}…`;
}

function extractToolsFromSteps(steps: unknown): string[] {
  if (!Array.isArray(steps)) {
    return [];
  }
  const names = new Set<string>();
  for (const row of steps) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      continue;
    }
    const step = row as Record<string, unknown>;
    if (step.type !== 'tool') {
      continue;
    }
    if (typeof step.name === 'string' && step.name.trim()) {
      names.add(step.name.trim());
    }
  }
  return [...names];
}

function resolveReplayEpisodeStatus(input: {
  turnStatus: string;
  toolsUsed: string[];
  hasPlanStep: boolean;
}): TurnEpisodeStatus {
  if (input.turnStatus === AgentRunStatus.failed) {
    return 'failed';
  }
  if (input.hasPlanStep || input.toolsUsed.length > 0) {
    return 'task';
  }
  return 'smalltalk';
}

function hasPlanStep(steps: unknown): boolean {
  if (!Array.isArray(steps)) {
    return false;
  }
  return steps.some(
    (row) =>
      row &&
      typeof row === 'object' &&
      !Array.isArray(row) &&
      (row as Record<string, unknown>).type === 'plan',
  );
}

@Injectable()
export class SessionGoaReplayService {
  private readonly logger = new Logger(SessionGoaReplayService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * DB / legacy Redis 均无 GOA 时，从 MessageTurn + AgentRun 尽力重建 episodes 与可续跑 activeTask。
   */
  async replay(sessionId: string): Promise<SessionGoaPayload | null> {
    const turns = await this.prisma.messageTurn.findMany({
      where: { sessionId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        userInput: true,
        finalOutput: true,
        status: true,
      },
    });
    if (turns.length === 0) {
      return null;
    }

    const runs = await this.prisma.agentRun.findMany({
      where: { sessionId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        turnId: true,
        steps: true,
        status: true,
        role: true,
        goaSnapshot: true,
      },
    });
    if (runs.length === 0) {
      return null;
    }

    const primaryRunByTurn = new Map<number, ReplayRunRow>();
    for (const run of runs) {
      if (run.role === AgentRunRole.primary) {
        primaryRunByTurn.set(run.turnId, run);
      }
    }

    let payload = createEmptySessionGoaPayload(sessionId);
    let wroteEpisodes = false;

    for (const turn of turns) {
      const run = primaryRunByTurn.get(turn.id);
      if (!run) {
        continue;
      }
      const turnRuns = runs.filter((row) => row.turnId === turn.id);
      const toolsUsed = [
        ...new Set(
          turnRuns.flatMap((row) => extractToolsFromSteps(row.steps)),
        ),
      ];
      const planPresent = turnRuns.some((row) => hasPlanStep(row.steps));
      const outcome =
        typeof turn.finalOutput === 'string' ? turn.finalOutput : '';
      if (
        turn.status !== AgentRunStatus.success &&
        turn.status !== AgentRunStatus.failed
      ) {
        continue;
      }
      if (!outcome.trim() && toolsUsed.length === 0 && !planPresent) {
        continue;
      }
      const episode: TurnEpisode = {
        turnId: turn.id,
        runId: run.id,
        goal: truncate(turn.userInput, EPISODE_GOAL_MAX),
        outcome: truncate(outcome, EPISODE_OUTCOME_MAX),
        status: resolveReplayEpisodeStatus({
          turnStatus: turn.status,
          toolsUsed,
          hasPlanStep: planPresent,
        }),
        toolsUsed,
        artifactRefs: [],
        createdAt: new Date().toISOString(),
      };
      payload = {
        ...payload,
        recentEpisodes: appendEpisodeFifo(payload.recentEpisodes, episode),
      };
      wroteEpisodes = true;
    }

    const turnUserInputById = new Map(
      turns.map((turn) => [turn.id, turn.userInput]),
    );
    const activeTask = replayActiveTaskFromRuns({
      runs: runs as ReplayRunRow[],
      turnUserInputById,
    });

    if (!wroteEpisodes && !activeTask) {
      return null;
    }

    let sessionObservationLedger = payload.sessionObservationLedger ?? [];
    for (const run of runs) {
      sessionObservationLedger = appendSessionObservationLedger(
        sessionObservationLedger,
        extractObservationLogFromRunSteps({
          turnId: run.turnId,
          runId: run.id,
          steps: run.steps,
        }),
      );
    }

    payload = {
      ...payload,
      activeTask,
      sessionObservationLedger,
    };
    this.logger.log(
      `replayed GOA from agent runs sessionId=${sessionId} episodes=${payload.recentEpisodes.length} activeTask=${activeTask != null}`,
    );
    return payload;
  }
}
