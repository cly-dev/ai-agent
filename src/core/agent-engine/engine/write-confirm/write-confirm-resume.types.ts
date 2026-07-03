import type { DraftReviewDecision } from '../../../draft-review';
import type { AgentRunResult, ResumeAfterWriteConfirmInput } from '../main/types/agent-engine.types';
import type { PendingWriteConfirmationSnapshot } from '../../../../modules/chat/pending-write-confirmation.types';
import type { ChatWriteConfirmResumeAudit } from '../../../approval/write-confirm-run-audit.util';
import type { RunExecutionScope } from '../../../session-run/run-execution.scope';
import type { AgentGraphState } from '../main/types/agent-engine.types';
import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';

export type WriteConfirmSessionContext = {
  id: string;
  agentId: number;
  appClientId: number;
};

export type WriteConfirmPrimaryRun = {
  id: number;
  turnId: number;
};

/** Redis gate 解析后的续跑输入。 */
export type WriteConfirmResumePrepared = {
  session: WriteConfirmSessionContext;
  consumed: PendingWriteConfirmationSnapshot;
  primaryRun: WriteConfirmPrimaryRun;
  /** 挂起时的 primary runId（审计日志用）。 */
  suspendedPrimaryRunId: number;
};

export type WriteConfirmResumeHost = {
  emitWriteConfirmationExpired(sessionId: string): void;
  emitAgentRunComplete(sessionId: string, result: AgentRunResult): void;
  emitRunCompletion(
    sessionId: string,
    result: AgentRunResult,
    graphState: AgentGraphState,
    pageContext: AgentChatPageContext | null,
    runtime: { appClientId: number; agentId: number },
  ): Promise<void>;
  handleRunAborted(input: {
    error: import('../../../session-run/run-aborted.error').AgentRunAbortedError;
    sessionId: string;
    turnId: number;
    runId: number;
    runMetrics: import('../run-metrics.util').RunMetricsAccumulator;
    scopedToolCount: number;
    steps: AgentGraphState['steps'];
  }): Promise<void>;
  handleRunFailure(input: {
    error: unknown;
    userId: number;
    sessionId: string;
    turnId: number;
    runId: number;
    runMetrics: import('../run-metrics.util').RunMetricsAccumulator;
    scopedToolCount: number;
    scheduleMemory: import('../../../memory/goa/session-goa.types').SessionMemoryUpdateContext;
  }): Promise<AgentRunResult | null>;
};

export type WriteConfirmResumeDeps = {
  host: WriteConfirmResumeHost;
  prisma: import('../../../../prisma/prisma.service').PrismaService;
  agentService: import('../../../../modules/agent/agent.service').AgentService;
  llmService: import('../../../llm/llm.service').LlmService;
  goaService: import('../../../memory/goa/session-goa.service').SessionGoaService;
  toolEngine: import('../../../tool-engine/tool-engine.service').ToolEngineService;
  langGraphRunner: import('../main/runner/agent-lang-graph.runner').AgentLangGraphRunner;
  lifecycle: import('../main/run/agent-run-lifecycle.service').AgentRunLifecycleService;
  sse: import('../main/run/agent-run-sse.emitter').AgentRunSseEmitter;
  assistantArtifact: import('../main/run/run-assistant-artifact.store').RunAssistantArtifactStore;
  promptComposer: import('../../../prompt/prompt-composer.service').PromptComposerService;
  logger: import('@nestjs/common').Logger;
};

export type RunWriteConfirmResumeInput = {
  resumeInput: ResumeAfterWriteConfirmInput;
  prepared: WriteConfirmResumePrepared;
  scope: RunExecutionScope;
  deps: WriteConfirmResumeDeps;
  approvalAudit?: ChatWriteConfirmResumeAudit | null;
  decision?: DraftReviewDecision | null;
};
