import type { Response } from 'express';
import type { PrismaService } from '../../prisma/prisma.service';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { LlmChatMessage } from '../llm/llm.types';
import type { LlmService } from '../llm/llm.service';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import type { ResolvedPageActionHostTool } from './page-action-host-tool.util';
import {
  PageActionRunStepRecorder,
  type PageActionRunStep,
} from './page-action-run-steps.util';
import type { PageWorkflowExecutorRuntime } from '../workflow/page/page-workflow-runtime.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';

export type PageWorkflowRunnerInput = {
  workflowId: number;
  version: number;
  nodes: WorkflowNodeDef[];
  systemPrompt: string;
  objectivePrefix?: string | null;
  messages: LlmChatMessage[];
  pageContext: AgentChatPageContext | null;
  hostTool: ResolvedPageActionHostTool | null;
  llmService: LlmService;
  prisma: PrismaService;
  toolEngine: ToolEngineService;
  userId: number;
  appClientId: number;
  actionRunId: number;
  actionKey: string;
  generation: number;
  clientActionId?: string | null;
  res: Response;
  stepRecorder?: PageActionRunStepRecorder;
};

export function createPageWorkflowExecutorRuntime(
  input: PageWorkflowRunnerInput,
  recorder: PageActionRunStepRecorder,
): PageWorkflowExecutorRuntime {
  return {
    pageContext: input.pageContext,
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
    res: input.res,
    hostTool: input.hostTool,
    stepRecorder: recorder,
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
  errorCode?: string;
  errorMessage?: string;
};

export function buildPageWorkflowRunnerResult(input: {
  workflowRun: WorkflowRunState;
  runtime: PageWorkflowExecutorRuntime;
  recorder: PageActionRunStepRecorder;
  errorCode?: string;
  errorMessage?: string;
}): PageWorkflowRunnerResult {
  return {
    workflowRun: input.workflowRun,
    steps: input.recorder.toJson(),
    fillText: input.runtime.fillText,
    dslOutcome: input.runtime.dslOutcome,
    model: input.runtime.metrics.model,
    promptTokens: input.runtime.metrics.promptTokens,
    completionTokens: input.runtime.metrics.completionTokens,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
  };
}
