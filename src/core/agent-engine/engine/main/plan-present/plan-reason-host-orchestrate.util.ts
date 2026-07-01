import type { LlmChatMessage } from '../../../../llm/llm.types';
import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import type { ToolObservation } from '../types/agent-engine.types';
import type { RunAssistantArtifactStore } from '../run/run-assistant-artifact.store';
import { buildPlanContextForSummarize } from '../host-tool/host-tool-fill-alignment.util';
import {
  finalizePlanAfterSummarize,
  getPendingPlanHostToolStep,
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
import { resolveReasonHostFillObservationPayload } from './plan-reason-host-machine-prompt.util';
import {
  buildPlanReasonHostMachineContext,
  runPlanReasonHostMachineLayer,
  type PlanReasonHostMachineLayerDeps,
} from './plan-reason-host-machine-layer.util';
import {
  buildPlanReasonHostUserMarkdown,
  publishPlanReasonHostUserLayer,
  type PlanReasonHostUserLayerPublishDeps,
} from './plan-reason-host-user-message.util';

export type PlanReasonHostFillOrchestrateDeps = PlanReasonHostUserLayerPublishDeps &
  PlanReasonHostMachineLayerDeps & {
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
  turnId?: number;
  scope: { appClientId: number; agentId: number };
  taskPlan: TaskPlanSnapshot;
  scopedHostTools: HostToolDecisionDefinition[];
  pageContext?: AgentChatPageContext | null;
};

export type PlanReasonHostFillResult = {
  serialized: string;
  draftReply: string;
  submitText: string;
  hostFillObservation: ToolObservation;
  draftReplyObservation: ToolObservation;
  hostToolStreamObservation?: ToolObservation;
  hostToolDispatchObservations?: ToolObservation[];
};

/**
 * reason → host_tool：机器层 stream + 用户层确定性展示。
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
    pageContext,
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
    return {
      serialized: published.serialized,
      draftReply: '',
      submitText: '',
      hostFillObservation: buildPlanHostFillObservation({
        planStepId: reasonStepId,
        fills: [],
      }),
      draftReplyObservation: buildPlanDraftReplyObservation({
        draftReply: '',
        submitText: '',
        planStepId: reasonStepId,
      }),
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
  const afterFinalize = finalizePlanAfterSummarize(taskPlan);
  const upcomingHostStep = afterFinalize
    ? getPendingPlanHostToolStep(afterFinalize)
    : null;
  if (!upcomingHostStep) {
    deps.logger.warn(
      `plan reason host fill skipped: host tools resolved but no pending host step runId=${runId}`,
    );
    return emptyResult();
  }
  const turnId =
    input.turnId ??
    deps.assistantArtifact.peekTurnId(sessionId, runId) ??
    runId;

  const machineContext = buildPlanReasonHostMachineContext({
    agentPrompts,
    userMessage: planUserMessage,
    planContext,
    hostTools,
    splitObservationsText: observationPayload.splitObservationsText,
    serializedOutput: observationPayload.serializedOutput,
    allowedToolNames,
    pageContext,
    sessionId,
    runId,
    turnId,
    scope,
    hostStepId: upcomingHostStep.id,
    reasonStepId,
  });

  const machineResult = await runPlanReasonHostMachineLayer(deps, machineContext);
  const { fills } = machineResult;

  const submitText = extractPrimaryFillTextFromHostFills(fills);
  const userMarkdown = buildPlanReasonHostUserMarkdown({
    fills,
    stepObjective: reasonStep?.objective ?? null,
  });
  const published = publishPlanReasonHostUserLayer(deps, {
    sessionId,
    runId,
    turnId,
    userMarkdown,
  });

  return {
    serialized: published.serialized,
    draftReply: published.draftReply,
    submitText,
    hostFillObservation: buildPlanHostFillObservation({
      planStepId: reasonStepId,
      fills,
    }),
    draftReplyObservation: buildPlanDraftReplyObservation({
      draftReply: published.draftReply,
      submitText,
      planStepId: reasonStepId,
    }),
    hostToolStreamObservation: machineResult.hostToolStreamObservation,
    hostToolDispatchObservations: machineResult.hostToolDispatchObservations,
  };
}
