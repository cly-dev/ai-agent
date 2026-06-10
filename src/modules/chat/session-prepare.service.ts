import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PromptComposerService } from '../../core/prompt/prompt-composer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentService } from '../agent/agent.service';
import type { SessionPrepareResult } from './session-prepare.types';
import { areToolIdSetsEqual } from './session-prepare.util';
import { SessionPrepareStore } from './session-prepare.store';

@Injectable()
export class SessionPrepareService {
  private readonly logger = new Logger(SessionPrepareService.name);
  private static readonly SESSION_ID_HEX = /^[a-f0-9]{32}$/;

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentService: AgentService,
    private readonly promptComposer: PromptComposerService,
    private readonly sessionPrepareStore: SessionPrepareStore,
  ) {}

  warmInBackground(
    sessionId: string,
    userId: number,
    appClientId: number,
  ): void {
    void this.warm(sessionId, userId, appClientId).catch((error: unknown) => {
      this.logger.warn(
        `session prepare background warm failed sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });
  }

  async warm(
    sessionId: string,
    userId: number,
    appClientId: number,
  ): Promise<SessionPrepareResult> {
    const normalizedSessionId = this.normalizeSessionId(sessionId);
    const session = await this.prisma.session.findFirst({
      where: {
        id: normalizedSessionId,
        userId,
        appClientId,
      },
      select: { id: true, agentId: true },
    });
    if (!session) {
      throw new NotFoundException('chat not found');
    }

    if (session.agentId) {
      const cachedTools = await this.sessionPrepareStore.get(
        session.id,
        userId,
        appClientId,
        session.agentId,
      );
      if (cachedTools) {
        const freshTools = await this.agentService.getAllowedTools(
          session.agentId,
          userId,
          appClientId,
        );
        if (areToolIdSetsEqual(cachedTools, freshTools)) {
          return {
            sessionId: session.id,
            prepared: true,
            agentReady: true,
            toolsCount: cachedTools.length,
            sessionContextWarmed: await this.promptComposer.warmSessionContext(
              session.id,
            ),
            warmedAt: new Date().toISOString(),
            fromCache: true,
          };
        }
        await this.sessionPrepareStore.delete(session.id);
      }
    }

    const warmedAt = new Date().toISOString();
    if (!session.agentId) {
      const sessionContextWarmed =
        await this.promptComposer.warmSessionContext(session.id);
      return {
        sessionId: session.id,
        prepared: sessionContextWarmed,
        agentReady: false,
        toolsCount: 0,
        sessionContextWarmed,
        warmedAt,
        fromCache: false,
      };
    }

    const [agent, tools, sessionContextWarmed] = await Promise.all([
      this.agentService.getRuntimeAgent(appClientId, session.agentId),
      this.agentService.getAllowedTools(
        session.agentId,
        userId,
        appClientId,
      ),
      this.promptComposer.warmSessionContext(session.id),
    ]);

    await this.sessionPrepareStore.trySet(
      session.id,
      userId,
      appClientId,
      session.agentId,
      tools,
    );

    return {
      sessionId: session.id,
      prepared: true,
      agentReady: agent != null,
      toolsCount: tools.length,
      sessionContextWarmed,
      warmedAt,
      fromCache: false,
    };
  }

  private normalizeSessionId(sessionId: string): string {
    const value = sessionId.trim().toLowerCase();
    if (!SessionPrepareService.SESSION_ID_HEX.test(value)) {
      throw new BadRequestException(
        'sessionId must be a 32-character lowercase hex string',
      );
    }
    return value;
  }
}
