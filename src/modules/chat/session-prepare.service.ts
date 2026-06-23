import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { AgentChatPageContext } from '../../core/host-bridge';
import { PromptComposerService } from '../../core/prompt/prompt-composer.service';
import { parsePageContextFromMessageFields } from '../../core/host-bridge/parse-page-context.util';
import { AgentHostToolCatalogService } from '../../core/runtime-cache/agent-host-tool-catalog.service';
import { SkillService } from '../../core/skill/skill.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentService } from '../agent/agent.service';
import type { SessionPrepareResult } from './session-prepare.types';
import {
  areSessionRuntimeRevisionsEqual,
  buildSessionRuntimeRevision,
} from './session-prepare.util';
import { SessionPrepareStore } from './session-prepare.store';
import type { PrepareChatDto } from './dto/prepare-chat.dto';

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
    private readonly hostToolCatalogService: AgentHostToolCatalogService,
  ) {}

  warmInBackground(
    sessionId: string,
    userId: number,
    appClientId: number,
    pageContext?: AgentChatPageContext | null,
  ): void {
    void this.warm(sessionId, userId, appClientId, pageContext).catch(
      (error: unknown) => {
        this.logger.warn(
          `session prepare background warm failed sessionId=${sessionId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      },
    );
  }

  resolvePageContextFromPrepareDto(
    dto?: PrepareChatDto | null,
  ): AgentChatPageContext | null {
    if (!dto) {
      return null;
    }
    return parsePageContextFromMessageFields(dto);
  }

  async warm(
    sessionId: string,
    userId: number,
    appClientId: number,
    pageContext?: AgentChatPageContext | null,
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

    const pageScope = pageContext?.page?.trim() || null;

    if (session.agentId) {
      const freshTools = await this.agentService.getAllowedTools(
        session.agentId,
        userId,
        appClientId,
      );
      const freshSkills =
        await this.skillService.listRunnableAgentSkillsForUser(
          {
            agentId: session.agentId,
            userId,
            appClientId,
          },
          new Set(freshTools.map((tool) => tool.id)),
        );
      const freshSkillRows = await this.loadSkillRevisionRows(
        freshSkills.map((skill) => skill.id),
      );
      const hostToolsRevision =
        await this.hostToolCatalogService.fetchRevisionFromDb(
          appClientId,
          session.agentId,
        );
      const freshRevision = buildSessionRuntimeRevision({
        tools: freshTools,
        skills: freshSkillRows,
        hostToolsRevision,
      });

      const cached = await this.sessionPrepareStore.get(
        session.id,
        userId,
        appClientId,
        session.agentId,
        freshRevision,
      );
      if (cached && areSessionRuntimeRevisionsEqual(cached.revision, freshRevision)) {
        const hostToolsCount =
          pageScope && cached.hostToolsByPage?.[pageScope]
            ? cached.hostToolsByPage[pageScope].llmTools.length
            : 0;
        const needsHostPageWarm =
          pageScope != null && !cached.hostToolsByPage?.[pageScope];

        if (!needsHostPageWarm) {
          return {
            sessionId: session.id,
            prepared: true,
            agentReady: true,
            toolsCount: cached.tools.length,
            skillsCount: cached.skills.length,
            hostToolsCount,
            pageScope,
            sessionContextWarmed: await this.promptComposer.warmSessionContext(
              session.id,
            ),
            warmedAt: cached.snapshot.warmedAt,
            fromCache: true,
            revision: cached.revision,
          };
        }
      } else if (cached) {
        await this.sessionPrepareStore.delete(session.id);
      }

      const [agent, sessionContextWarmed, llmHostTools] = await Promise.all([
        this.agentService.getRuntimeAgent(appClientId, session.agentId),
        this.promptComposer.warmSessionContext(session.id),
        pageScope
          ? this.hostToolCatalogService.warmPageLlmTools({
              appClientId,
              agentId: session.agentId,
              pageScope,
            })
          : Promise.resolve([]),
      ]);

      const hostToolsByPage =
        pageScope != null
          ? {
              [pageScope]: {
                pageScope,
                routePath: pageContext?.routePath,
                routeParams: pageContext?.routeParams,
                llmTools: llmHostTools,
                warmedAt: new Date().toISOString(),
              },
            }
          : undefined;

      await this.sessionPrepareStore.trySet({
        sessionId: session.id,
        userId,
        appClientId,
        agentId: session.agentId,
        revision: freshRevision,
        tools: freshTools,
        skills: freshSkillRows,
        hostToolsByPage,
        lastPreparedPage: pageScope ?? undefined,
      });

      return {
        sessionId: session.id,
        prepared: true,
        agentReady: agent != null,
        toolsCount: freshTools.length,
        skillsCount: freshSkillRows.length,
        hostToolsCount: llmHostTools.length,
        pageScope,
        sessionContextWarmed,
        warmedAt: new Date().toISOString(),
        fromCache: false,
        revision: freshRevision,
      };
    }

    const warmedAt = new Date().toISOString();
    const sessionContextWarmed =
      await this.promptComposer.warmSessionContext(session.id);
    return {
      sessionId: session.id,
      prepared: sessionContextWarmed,
      agentReady: false,
      toolsCount: 0,
      skillsCount: 0,
      hostToolsCount: 0,
      pageScope: null,
      sessionContextWarmed,
      warmedAt,
      fromCache: false,
    };
  }

  private async loadSkillRevisionRows(skillIds: number[]) {
    if (skillIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.skill.findMany({
      where: { id: { in: skillIds } },
      select: { id: true, name: true, updatedAt: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      updatedAt: row.updatedAt.toISOString(),
    }));
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
