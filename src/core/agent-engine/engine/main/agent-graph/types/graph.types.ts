import type { Logger } from '@nestjs/common';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { LlmService } from '../../../../../llm/llm.service';
import { PromptRegistryService } from '../../../../../prompt/prompt-registry.service';
import {
  ToolEngineService,
} from '../../../../../tool-engine/tool-engine.service';
import { PrismaService } from '../../../../../../prisma/prisma.service';
import { PendingWriteConfirmationStore } from '../../../../../../modules/chat/pending-write-confirmation.store';
import { SessionGoaService } from '../../../../../memory/goa/session-goa.service';
import { SessionResumeGateService } from '../../../../../memory/resume/session-resume-gate.service';
import { CategoryIntentRecallService } from '../../../../../intent/category-intent-recall.service';
import { SessionRunCoordinator } from '../../../../../session-run/session-run-coordinator.service';
import { AgentRunSseGateway } from '../../../../../session-run/agent-run-sse.gateway';
import { AgentRunSseEmitter } from '../../run/agent-run-sse.emitter';
import { RunAssistantArtifactStore } from '../../run/run-assistant-artifact.store';
import { AgentSessionScopeService } from '../../session/agent-session-scope.service';
import { SkillService } from '../../../../../skill/skill.service';
import { RequestedSkillRunService } from '../../skill/requested-skill-run.service';
import type { RequestedSkillRunContext } from '../../skill/requested-skill-run.service';
import { HostToolService } from '../../../../../../modules/host-tool/host-tool.service';
import { RunScopeCacheService } from '../../../../../runtime-cache/run-scope-cache.service';
import { ApprovalGateService } from '../../../../../approval/approval-gate.service';
import { ApprovalRequestService } from '../../../../../approval/approval-request.service';
import { ApprovalTriggerPermissionService } from '../../../../../approval/approval-trigger-permission.service';
import type { SessionGoaPayload } from '../../../../../memory/goa/session-goa.types';
import type {
  AgentGraphState,
  AgentLangGraphRunInput,
  ToolObservation,
} from '../../types/agent-engine.types';
import type { AgentGraphSummarizeHelpers } from '../summarize/summarize.helpers';
import type { AgentGraphSkillFrameHelpers } from '../runtime/skill-frame.util';
import type { AgentGraphRunHelpers } from '../runtime/run.helpers';
import type { AgentGraphHostToolHandleHelpers } from '../runtime/host-tool.handle';
import type { AgentGraphDecisionHelpers } from '../runtime/decision.util';

export interface AgentGraphDeps {
  prisma: PrismaService;
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  toolEngine: ToolEngineService;
  sse: AgentRunSseEmitter;
  sessionRunCoordinator: SessionRunCoordinator;
  runSseGateway: AgentRunSseGateway;
  assistantArtifact: RunAssistantArtifactStore;
  goaService: SessionGoaService;
  resumeGate: SessionResumeGateService;
  categoryIntentRecall: CategoryIntentRecallService;
  pendingWriteConfirmationStore: PendingWriteConfirmationStore;
  sessionScope: AgentSessionScopeService;
  skillService: SkillService;
  requestedSkillRun: RequestedSkillRunService;
  hostToolService: HostToolService;
  runScopeCache: RunScopeCacheService;
  approvalGate: ApprovalGateService;
  approvalRequests: ApprovalRequestService;
  approvalTriggerPermission: ApprovalTriggerPermissionService;
  logger: Logger;
}

export interface AgentGraphRunContext {
  input: AgentLangGraphRunInput;
  requestedSkillCtx: RequestedSkillRunContext | null;
  getSessionGoa: () => SessionGoaPayload | null;
  setSessionGoa: (goa: SessionGoaPayload | null) => void;
  promptScope: { appClientId: number; agentId: number };
}

export interface AgentGraphNodeBundle {
  deps: AgentGraphDeps;
  ctx: AgentGraphRunContext;
  runHelpers: AgentGraphRunHelpers;
  skillFrame: AgentGraphSkillFrameHelpers;
  hostToolHandle: AgentGraphHostToolHandleHelpers;
  decision: AgentGraphDecisionHelpers;
  summarize: AgentGraphSummarizeHelpers;
}

export type AgentGraphNodeFn = (
  state: AgentGraphState,
) => Promise<AgentGraphState>;

export type { ToolObservation };
