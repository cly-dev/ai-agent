import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { AgentChatPageContext } from '../../core/host-bridge';
import { resolveHostToolPageScope } from '../../core/host-bridge/page-context-anchor.util';
import { PromptComposerService } from '../../core/prompt/prompt-composer.service';
import { parsePageContextFromMessageFields } from '../../core/host-bridge/parse-page-context.util';
import { AgentHostToolCatalogService } from '../../core/runtime-cache/agent-host-tool-catalog.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentService } from '../agent/agent.service';
import type { SessionPrepareResult } from './session-prepare.types';
import { SessionPrepareStore } from './session-prepare.store';
import { SessionRuntimeResolverService } from './session-runtime-resolver.service';
import type { PrepareChatDto } from './dto/prepare-chat.dto';

@Injectable()
export class SessionPrepareService {
  private readonly logger = new Logger(SessionPrepareService.name);
  private static readonly SESSION_ID_HEX = /^[a-f0-9]{32}$/;

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentService: AgentService,
    private readonly promptComposer: PromptComposerService,
    private readonly sessionPrepareStore: SessionPrepareStore,
    private readonly sessionRuntimeResolver: SessionRuntimeResolverService,
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

    const pageScope = resolveHostToolPageScope(pageContext);

    if (session.agentId) {
      const bundle = await this.sessionRuntimeResolver.resolveAllowedToolsBundle({
        sessionId: session.id,
        agentId: session.agentId,
        userId,
        appClientId,
      });

      const cachedSnapshot = await this.sessionPrepareStore.get(
        session.id,
        userId,
        appClientId,
        session.agentId,
        bundle.revision,
      );

      if (bundle.fromCache && cachedSnapshot) {
        const hostToolsCount =
          pageScope && cachedSnapshot.hostToolsByPage?.[pageScope]
            ? cachedSnapshot.hostToolsByPage[pageScope].llmTools.length
            : 0;
        const needsHostPageWarm =
          pageScope != null && !cachedSnapshot.hostToolsByPage?.[pageScope];

        if (!needsHostPageWarm) {
          return {
            sessionId: session.id,
            prepared: true,
            agentReady: true,
            toolsCount: bundle.tools.length,
            skillsCount: bundle.skillRows.length,
            hostToolsCount,
            pageScope,
            sessionContextWarmed: await this.promptComposer.warmSessionContext(
              session.id,
            ),
            warmedAt: cachedSnapshot.snapshot.warmedAt,
            fromCache: true,
            revision: bundle.revision,
          };
        }
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

      if (hostToolsByPage) {
        await this.sessionPrepareStore.trySet({
          sessionId: session.id,
          userId,
          appClientId,
          agentId: session.agentId,
          revision: bundle.revision,
          tools: bundle.tools,
          skills: bundle.skillRows,
          hostToolsByPage,
          lastPreparedPage: pageScope ?? undefined,
        });
      }

      return {
        sessionId: session.id,
        prepared: true,
        agentReady: agent != null,
        toolsCount: bundle.tools.length,
        skillsCount: bundle.skillRows.length,
        hostToolsCount: llmHostTools.length,
        pageScope,
        sessionContextWarmed,
        warmedAt: new Date().toISOString(),
        fromCache: bundle.fromCache && !hostToolsByPage,
        revision: bundle.revision,
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
