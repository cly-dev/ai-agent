import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../../../llm/llm.service';
import { ToolEngineService } from '../../../../tool-engine/tool-engine.service';
import { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { PendingWriteConfirmationStore } from '../../../../../modules/chat/pending-write-confirmation.store';
import { SessionGoaService } from '../../../../memory/goa/session-goa.service';
import { SessionResumeGateService } from '../../../../memory/resume/session-resume-gate.service';
import { CategoryIntentRecallService } from '../../../../intent/category-intent-recall.service';
import { AgentRunSseEmitter } from '../run/agent-run-sse.emitter';
import { AgentRunSseGateway } from '../../../../session-run/agent-run-sse.gateway';
import { SessionRunCoordinator } from '../../../../session-run/session-run-coordinator.service';
import { RunAssistantArtifactStore } from '../run/run-assistant-artifact.store';
import { AgentSessionScopeService } from '../session/agent-session-scope.service';
import { SkillService } from '../../../../skill/skill.service';
import { RequestedSkillRunService } from '../skill/requested-skill-run.service';
import { HostToolService } from '../../../../../modules/host-tool/host-tool.service';
import { RunScopeCacheService } from '../../../../runtime-cache/run-scope-cache.service';
import type { AgentGraphState, AgentLangGraphRunInput } from '../types/agent-engine.types';
import {
  buildAndRunAgentGraph,
  createAgentGraphSummarizeHelpers,
} from '../agent-graph';
import type { AgentGraphDeps } from '../agent-graph';

@Injectable()
export class AgentLangGraphRunner {
  private readonly logger = new Logger(AgentLangGraphRunner.name);
  private summarizeHelpers: ReturnType<typeof createAgentGraphSummarizeHelpers> | null =
    null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly promptRegistry: PromptRegistryService,
    private readonly toolEngine: ToolEngineService,
    private readonly sse: AgentRunSseEmitter,
    private readonly sessionRunCoordinator: SessionRunCoordinator,
    private readonly runSseGateway: AgentRunSseGateway,
    private readonly assistantArtifact: RunAssistantArtifactStore,
    private readonly goaService: SessionGoaService,
    private readonly resumeGate: SessionResumeGateService,
    private readonly categoryIntentRecall: CategoryIntentRecallService,
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
    private readonly sessionScope: AgentSessionScopeService,
    private readonly skillService: SkillService,
    private readonly requestedSkillRun: RequestedSkillRunService,
    private readonly hostToolService: HostToolService,
    private readonly runScopeCache: RunScopeCacheService,
  ) {}

  private deps(): AgentGraphDeps {
    return {
      prisma: this.prisma,
      llmService: this.llmService,
      promptRegistry: this.promptRegistry,
      toolEngine: this.toolEngine,
      sse: this.sse,
      sessionRunCoordinator: this.sessionRunCoordinator,
      runSseGateway: this.runSseGateway,
      assistantArtifact: this.assistantArtifact,
      goaService: this.goaService,
      resumeGate: this.resumeGate,
      categoryIntentRecall: this.categoryIntentRecall,
      pendingWriteConfirmationStore: this.pendingWriteConfirmationStore,
      sessionScope: this.sessionScope,
      skillService: this.skillService,
      requestedSkillRun: this.requestedSkillRun,
      hostToolService: this.hostToolService,
      runScopeCache: this.runScopeCache,
      logger: this.logger,
    };
  }

  private getSummarizeHelpers() {
    if (!this.summarizeHelpers) {
      this.summarizeHelpers = createAgentGraphSummarizeHelpers(this.deps());
    }
    return this.summarizeHelpers;
  }

  async run(input: AgentLangGraphRunInput): Promise<AgentGraphState> {
    return buildAndRunAgentGraph(this.deps(), input);
  }

  assessObservationQualityForResume(
    output: unknown,
    agentMetadata?: unknown,
  ): 'high' | 'medium' | 'low' {
    return this.getSummarizeHelpers().assessObservationQuality(
      output,
      agentMetadata,
    );
  }

  buildPendingPlanSummaryObservation(
    userMessage: string,
    state: Parameters<
      ReturnType<typeof createAgentGraphSummarizeHelpers>['buildPendingPlanSummaryObservation']
    >[1],
    planContext?: Parameters<
      ReturnType<typeof createAgentGraphSummarizeHelpers>['buildPendingPlanSummaryObservation']
    >[2],
  ) {
    return this.getSummarizeHelpers().buildPendingPlanSummaryObservation(
      userMessage,
      state,
      planContext,
    );
  }
}
