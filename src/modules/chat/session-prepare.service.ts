import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PromptComposerService } from '../../core/prompt/prompt-composer.service';
import { SkillService } from '../../core/skill/skill.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentService } from '../agent/agent.service';
import type { SessionPrepareResult } from './session-prepare.types';
import {
  areSkillIdSetsEqual,
  areToolIdSetsEqual,
} from './session-prepare.util';
import { SessionPrepareStore } from './session-prepare.store';

@Injectable()
export class SessionPrepareService {
  private readonly logger = new Logger(SessionPrepareService.name);
  private static readonly SESSION_ID_HEX = /^[a-f0-9]{32}$/;

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentService: AgentService,
    private readonly skillService: SkillService,
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
      const cached = await this.sessionPrepareStore.get(
        session.id,
        userId,
        appClientId,
        session.agentId,
      );
      if (cached) {
        const [freshTools, freshSkills] = await Promise.all([
          this.agentService.getAllowedTools(
            session.agentId,
            userId,
            appClientId,
          ),
          this.skillService.listAgentSkillsForUser({
            agentId: session.agentId,
            userId,
            appClientId,
          }),
        ]);
        const freshSkillRows = freshSkills.map((skill) => ({
          id: skill.id,
          name: skill.name,
        }));
        if (
          areToolIdSetsEqual(cached.tools, freshTools) &&
          areSkillIdSetsEqual(cached.skills, freshSkillRows)
        ) {
          return {
            sessionId: session.id,
            prepared: true,
            agentReady: true,
            toolsCount: cached.tools.length,
            skillsCount: cached.skills.length,
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
        skillsCount: 0,
        sessionContextWarmed,
        warmedAt,
        fromCache: false,
      };
    }

    const [agent, tools, skills, sessionContextWarmed] = await Promise.all([
      this.agentService.getRuntimeAgent(appClientId, session.agentId),
      this.agentService.getAllowedTools(
        session.agentId,
        userId,
        appClientId,
      ),
      this.skillService.listAgentSkillsForUser({
        agentId: session.agentId,
        userId,
        appClientId,
      }),
      this.promptComposer.warmSessionContext(session.id),
    ]);

    const skillRows = skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
    }));

    await this.sessionPrepareStore.trySet(
      session.id,
      userId,
      appClientId,
      session.agentId,
      tools,
      skillRows,
    );

    return {
      sessionId: session.id,
      prepared: true,
      agentReady: agent != null,
      toolsCount: tools.length,
      skillsCount: skillRows.length,
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
