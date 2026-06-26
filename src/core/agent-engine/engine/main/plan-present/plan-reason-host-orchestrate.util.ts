import type { LlmChatMessage } from '../../../../llm/llm.types';
import type { LlmService } from '../../../../llm/llm.service';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import { PROMPT_KEYS } from '../../../../prompt/prompt-template.keys';
import { emitLlmPromptDebug } from '../../llm-prompt-debug.util';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import type { ToolObservation } from '../types/agent-engine.types';
import type { RunAssistantArtifactStore } from '../run/run-assistant-artifact.store';
import { buildPlanContextForSummarize } from '../host-tool/host-tool-fill-alignment.util';
import {
  getPendingPlanStep,
  resolveSummarizeUserMessageForPlan,
} from '../plan/task-plan.util';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import { buildPlanDraftReplyObservation } from './plan-draft-reply.util';
import {
  buildPlanHostFillObservation,
  extractPrimaryFillTextFromHostFills,
  resolveHostToolsForUpcomingHostStep,
} from './plan-host-fill.util';
import {
  buildPlanReasonHostFillUserContent,
  invokePlanReasonHostFillMachineLayer,
  resolveReasonHostFillObservationPayload,
} from './plan-reason-host-fill-llm.util';
import {
  buildPlanReasonHostUserMarkdown,
  publishPlanReasonHostUserLayer,
  type PlanReasonHostUserLayerPublishDeps,
} from './plan-reason-host-user-message.util';

export type PlanReasonHostFillOrchestrateDeps = PlanReasonHostUserLayerPublishDeps & {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  logger: { warn: (message: string) => void; log: (message: string) => void };
  assistantArtifact: Pick<
    RunAssistantArtifactStore,
    'peekBlocks' | 'peekTurnId'
  >;
};

export type RunPlanReasonHostFillInput = {
  userMessage: string;
  mergedObservation: ToolObservation;
  toolObservations: ToolObservation[];
  promptMessages: LlmChatMessage[];
  sessionId: string;
  runId: number;
  scope: { appClientId: number; agentId: number };
  taskPlan: TaskPlanSnapshot;
  scopedHostTools: HostToolDecisionDefinition[];
};

export type PlanReasonHostFillResult = {
  serialized: string;
  draftReply: string;
  submitText: string;
  hostFillObservation: ToolObservation;
  draftReplyObservation: ToolObservation;
};

/**
 * reason → host_tool：机器层 plan_host_fill + 用户层确定性展示 + plan_draft_reply。
 */
export async function runPlanReasonHostFill(
  deps: PlanReasonHostFillOrchestrateDeps,
  input: RunPlanReasonHostFillInput,
): Promise<PlanReasonHostFillResult> {
  const {
    userMessage,
    mergedObservation,
    toolObservations,
    promptMessages,
    sessionId,
    runId,
    scope,
    taskPlan,
    scopedHostTools,
  } = input;

  const reasonStep = getPendingPlanStep(taskPlan);
  const reasonStepId = reasonStep?.id ?? null;
  const planContext = buildPlanContextForSummarize(taskPlan, toolObservations);
  const hostTools = resolveHostToolsForUpcomingHostStep(taskPlan, scopedHostTools);
  const planUserMessage = resolveSummarizeUserMessageForPlan(userMessage, taskPlan);
  const observationPayload = resolveReasonHostFillObservationPayload({
    mergedObservation,
    toolObservations,
  });

  const emptyResult = (): PlanReasonHostFillResult => {
    const published = publishPlanReasonHostUserLayer(deps, {
      sessionId,
      runId,
      userMarkdown: '',
    });
    const hostFillObservation = buildPlanHostFillObservation({
      planStepId: reasonStepId,
      fills: [],
    });
    const draftReplyObservation = buildPlanDraftReplyObservation({
      draftReply: '',
      submitText: '',
      planStepId: reasonStepId,
    });
    return {
      serialized: published.serialized,
      draftReply: '',
      submitText: '',
      hostFillObservation,
      draftReplyObservation,
    };
  };

  if (hostTools.length === 0) {
    deps.logger.warn(
      `plan reason host fill skipped: no host tools for upcoming step runId=${runId}`,
    );
    return emptyResult();
  }

  const agentPrompts = promptMessages.filter(
    (message) =>
      message.role === 'system' && message.content.includes('<agent_prompt>'),
  );
  const allowedToolNames = new Set(hostTools.map((tool) => tool.name));
  const userContext = buildPlanReasonHostFillUserContent({
    userMessage: planUserMessage,
    planContext,
    hostTools,
    splitObservationsText: observationPayload.splitObservationsText,
    serializedOutput: observationPayload.serializedOutput,
  });

  emitLlmPromptDebug((message) => deps.logger.log(message), {
    runId,
    sessionId,
    phase: 'summarize',
    messages: [
      ...agentPrompts,
      {
        role: 'system',
        content: await deps.promptRegistry.render(
          PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_REASON_HOST_FILL,
          scope,
        ),
      },
      { role: 'user', content: userContext },
    ],
    meta: { planReasonHostFill: true },
  });

  const fills = await invokePlanReasonHostFillMachineLayer({
    llmService: deps.llmService,
    agentPrompts,
    promptRegistry: deps.promptRegistry,
    scope,
    userContext,
    allowedToolNames,
    logWarn: (message) => deps.logger.warn(`${message} runId=${runId}`),
  });

  const submitText = extractPrimaryFillTextFromHostFills(fills);
  const userMarkdown = buildPlanReasonHostUserMarkdown({
    fills,
    stepObjective: reasonStep?.objective ?? null,
  });
  const published = publishPlanReasonHostUserLayer(deps, {
    sessionId,
    runId,
    userMarkdown,
  });

  const hostFillObservation = buildPlanHostFillObservation({
    planStepId: reasonStepId,
    fills,
  });
  const draftReplyObservation = buildPlanDraftReplyObservation({
    draftReply: published.draftReply,
    submitText,
    planStepId: reasonStepId,
  });

  return {
    serialized: published.serialized,
    draftReply: published.draftReply,
    submitText,
    hostFillObservation,
    draftReplyObservation,
  };
}
