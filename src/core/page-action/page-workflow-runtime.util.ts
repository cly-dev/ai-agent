import type { PrismaService } from '../../prisma/prisma.service';
import type { PageActionSseSink } from './stream/page-action-sse-sink.types';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { LlmChatMessage } from '../llm/llm.types';
import type { LlmService } from '../llm/llm.service';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import type { ResolvedPageActionHostTool } from './page-action-host-tool.util';
import {
  PageActionRunStepRecorder,
  type PageActionRunStep,
} from './page-action-run-steps.util';
import type { PageWorkflowToolBundle } from './page-workflow-tool-bundle.util';
import type { PageWorkflowExecutorRuntime } from '../workflow/page/page-workflow-runtime.types';
import type { WorkflowEdge, WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';
import {
  resolvePageWorkflowCompletion,
  type PageActionRunCompletion,
} from './page-action-run-completion.util';

export type PageWorkflowRunnerInput = {
  /** 运行态资产 id：Flow 跑时等于 Flow.id（与 ApprovalRequest.flowId 对齐） */
  workflowId: number;
  version: number;
  /** 有值时审批/审计走 Flow FK，不写 Workflow FK */
  flowId?: number | null;
  flowVersion?: number | null;
  nodes: WorkflowNodeDef[];
  /** 可选；缺省由 init 按 nodes 顺序合成 always 边 */
  edges?: WorkflowEdge[];
  entryNodeId?: string | null;
  /**
   * Plan A：Flow.ir 快照。`executionMode=ir_native_direct` 时为图真源。
   */
  ir?: import('../workflow/workflow-ir.types').WorkflowIrDocument | null;
  executionMode?: import('../workflow/workflow-ir-native-direct.util').WorkflowExecutionMode;
  systemPrompt: string;
  objectivePrefix?: string | null;
  messages: LlmChatMessage[];
  pageContext: AgentChatPageContext | null;
  /** PageAction invoke.context；供 HostTool x-contextIdCatalog */
  actionContext?: Record<string, unknown> | null;
  hostTool: ResolvedPageActionHostTool | null;
  llmService: LlmService;
  prisma: PrismaService;
  toolEngine: ToolEngineService;
  userId: number;
  appClientId: number;
  actionRunId: number;
  actionKey: string;
  generation: number;
  pageActionKey?: string | null;
  clientActionId?: string | null;
  sseSink: PageActionSseSink;
  stepRecorder?: PageActionRunStepRecorder;
  toolBundle?: PageWorkflowToolBundle | null;
};

export function createPageWorkflowExecutorRuntime(
  input: PageWorkflowRunnerInput,
  recorder: PageActionRunStepRecorder,
): PageWorkflowExecutorRuntime {
  return {
    pageContext: input.pageContext,
    actionContext: input.actionContext ?? null,
    messages: input.messages,
    nodeOutputs: {},
    systemPrompt: input.systemPrompt,
    objectivePrefix: input.objectivePrefix,
    llmService: input.llmService,
    prisma: input.prisma,
    toolEngine: input.toolEngine,
    userId: input.userId,
    appClientId: input.appClientId,
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    generation: input.generation,
    clientActionId: input.clientActionId ?? null,
    sseSink: input.sseSink,
    hostTool: input.hostTool,
    stepRecorder: recorder,
    toolBundle: input.toolBundle ?? null,
    materializedEntities: [],
    fillText: '',
    dslOutcome: null,
    metrics: {
      model: null,
      promptTokens: null,
      completionTokens: null,
    },
  };
}

export type PageWorkflowRunnerResult = {
  workflowRun: WorkflowRunState;
  steps: PageActionRunStep[];
  fillText: string;
  dslOutcome: string | null;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  completion: PageActionRunCompletion;
  errorCode?: string;
  errorMessage?: string;
};

export function buildPageWorkflowRunnerResult(input: {
  workflowNodes: WorkflowNodeDef[];
  workflowRun: WorkflowRunState;
  runtime: PageWorkflowExecutorRuntime;
  recorder: PageActionRunStepRecorder;
  errorCode?: string;
  errorMessage?: string;
  suspended?: boolean;
  approvalRequestId?: number | null;
}): PageWorkflowRunnerResult {
  const completion = resolvePageWorkflowCompletion({
    workflowNodes: input.workflowNodes,
    workflowRun: input.workflowRun,
    runtime: input.runtime,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    suspended: input.suspended,
    approvalRequestId: input.approvalRequestId,
  });

  return {
    workflowRun: input.workflowRun,
    steps: input.recorder.toJson(),
    fillText: input.runtime.fillText,
    dslOutcome: input.runtime.dslOutcome,
    model: input.runtime.metrics.model,
    promptTokens: input.runtime.metrics.promptTokens,
    completionTokens: input.runtime.metrics.completionTokens,
    completion,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
  };
}
