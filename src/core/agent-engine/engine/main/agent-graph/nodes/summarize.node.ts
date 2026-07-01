import type { AgentGraphNodeBundle, AgentGraphNodeFn } from '../types/graph.types';
import { applyWorkflowAfterSummarize } from '../../../../../workflow/workflow-summarize-sync.util';
import { getWorkflowNodeDef } from '../../../../../workflow/workflow-graph-routing.util';
import { shouldDeferPlanPresentWriteGate } from '../../../../../workflow/workflow-mutation-write-gate.util';
import { latestWorkflowInitSkipReason } from '../../../../../workflow/workflow-init-skip.util';
import type { AgentGraphState } from '../../types/agent-engine.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import {
  extractToolErrorUserHint,
  isAgentToolErrorObservation,
} from '../../../agent-run-user-messages.util';
import { allToolObservations } from '../../../graph-tool-observations.util';
import {
  formatSplitToolObservationsForSummarize,
  isSplitToolObservationsOutput,
  resolvePrimaryObservationForSummarize,
  SPLIT_TOOL_OBSERVATIONS_NAME,
} from '../../../observation-format.util';
import {
  buildRuleBasedMessageBlocks,
  ensureAtLeastOneTextBlock,
  messageBlocksToPlainText,
  serializeMessageBlocksForStorage,
  textBlock,
  tryParseStoredMessageBlocks,
} from '../../../message/message-blocks.util';
import { isMutationTool } from '../../../tool/tool-execution-status.util';
import { isTerminalPlanToolError } from '../../../tool/tool-plan-error.util';
import {
  CLARIFICATION_REQUEST_OBSERVATION_NAME,
  isTerminalTurnRespondPending,
  resolveObservationForSummarize,
} from '../../../turn/turn-respond.util';
import {
  isWriteConfirmResumeSummaryObservation,
  type WriteConfirmResumeSummaryPayload,
} from '../../../write-confirm-resume-summary.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import { buildPlanDraftReplyObservation } from '../../plan-present/plan-draft-reply.util';
import {
  syncPlanPresentSubmitTextForGate,
  isPlanDraftSummarizeBeforeWrite,
  formatComposedWriteGateDiagnosticForLog,
  resolveComposedWriteGateCallResult,
  resolvePlanDraftReplyContentForGateObservation,
  type PlanPresentSummarizeResult,
} from '../../plan-present/plan-draft-summarize.util';
import { isPlanReasonBeforeHostTool } from '../../plan-present/plan-host-fill.util';
import type { PlanReasonHostFillResult } from '../../plan-present/plan-reason-host-orchestrate.util';
import { filterHostToolsForPlanStep } from '../../host-tool/host-tool-plan.util';
import { patchLatestPlanComposeWriteObservation } from '../../plan-present/plan-compose-write.util';
import {
  buildPlanSummarizeObservation,
  finalizePlanAfterSummarize,
  getPendingPlanHostToolStep,
  isPendingPlanAnswerStep,
  planExecutionContextFromState,
  resolveEffectivePlanStepId,
  resolvePlanSummarizePublishMode,
  resolveSummarizeUserMessageForPlan,
  shouldContinuePlanAfterSummarize,
} from '../../plan/task-plan.util';
import type { AgentRunStep } from '../../types/agent-engine.types';

export function createSummarizeNode(bundle: AgentGraphNodeBundle): AgentGraphNodeFn {
  const { deps, ctx, runHelpers, decision, summarize, hostToolHandle } = bundle;

  function mergeWorkflowSummarizeCompletion(
    base: AgentGraphState,
    input: {
      continuePlan: boolean;
      finished: boolean;
      summarizedPlanStepId?: string | null;
    },
  ): AgentGraphState {
    return { ...base, ...applyWorkflowAfterSummarize(base, input) };
  }

  return async (state) => {

          const pendingObservation = resolveObservationForSummarize(
            state.pendingRespond,
          );
          if (!pendingObservation) {
            return state;
          }
          if (isWriteConfirmResumeSummaryObservation(pendingObservation)) {
            const payload = pendingObservation.output as WriteConfirmResumeSummaryPayload;
            const summarizeObservation = summarize.buildSummarizeObservationFromState(
              state,
              {
                taskPlan: state.taskPlan,
                scopedTools: state.scopedTools,
              },
            );
            const toolResultsText =
              summarizeObservation != null &&
              isSplitToolObservationsOutput(summarizeObservation.output)
                ? formatSplitToolObservationsForSummarize(summarizeObservation.output)
                : summarizeObservation != null
                  ? decision.stringifyForPrompt(summarizeObservation.output)
                  : undefined;
            const summarized = await summarize.summarizeWriteConfirmResume({
              payload,
              mergedToolOutput: summarizeObservation?.output,
              toolResultsText,
              confirmedPreviewSerialized: state.confirmedPreviewSerialized ?? null,
              promptMessages: ctx.input.promptMessages,
              sessionId: ctx.input.sessionId,
              runId: ctx.input.runId,
              turnId: ctx.input.turnId,
              scope: ctx.promptScope,
              taskPlan: state.taskPlan,
            });
            const resolved = runHelpers.resolveAssistantOutputFromArtifact(
              ctx.input.sessionId,
              ctx.input.runId,
              summarized,
            );
            const summaryStep: AgentRunStep = {
              step: nextRunStepNumber(state.steps),
              type: 'summarize',
              name: 'write_confirm_resume',
              output: resolved.stepPlain,
            };
            const nextSteps = [...state.steps, summaryStep];
            const taskPlanAfterSummarize = finalizePlanAfterSummarize(state.taskPlan);
            await runHelpers.updateRun(
              ctx.input.runId,
              nextSteps,
              AgentRunStatus.success,
            );
            return mergeWorkflowSummarizeCompletion(
              {
                ...state,
                steps: nextSteps,
                pendingRespond: null,
                taskPlan: taskPlanAfterSummarize,
                finalOutput: resolved.serialized,
                status: AgentRunStatus.success,
                finished: true,
              },
              { continuePlan: false, finished: true },
            );
          }
          const primaryObservation = resolvePrimaryObservationForSummarize(
            pendingObservation.output,
          );
          const effectiveToolName =
            pendingObservation.name === SPLIT_TOOL_OBSERVATIONS_NAME &&
            primaryObservation
              ? primaryObservation.name
              : pendingObservation.name;
          const toolDef = state.scopedTools.find(
            (tool) => tool.name === effectiveToolName,
          );
          const toolErrorObs = isAgentToolErrorObservation(pendingObservation.output)
            ? pendingObservation.output
            : null;
          const shouldSummarizeToolErrorWithLlm =
            toolErrorObs != null &&
            (isMutationTool(toolDef?.agentMetadata) ||
              state.taskPlan?.taskPhase === 'mutate');
          const toolErrorHint = extractToolErrorUserHint(pendingObservation.output);
          if (toolErrorHint && !shouldSummarizeToolErrorWithLlm) {
            const errorBlocks = buildRuleBasedMessageBlocks({
              output: pendingObservation.output,
              userMessage: ctx.input.latestUserMessage,
              fieldLabels: {},
              toolErrorHint,
              downstreamResponseSource: toolErrorObs?.responseSource,
            });
            const stored = serializeMessageBlocksForStorage(errorBlocks);
            deps.sse.publishAssistantBlocks(
              ctx.input.sessionId,
              ctx.input.runId,
              errorBlocks,
            );
            const summaryStep: AgentRunStep = {
              step: nextRunStepNumber(state.steps),
              type: 'summarize',
              name: pendingObservation.name,
              output: toolErrorHint,
            };
            const nextSteps = [...state.steps, summaryStep];
            await runHelpers.updateRun(
              ctx.input.runId,
              nextSteps,
              AgentRunStatus.success,
            );
            return mergeWorkflowSummarizeCompletion(
              {
                ...state,
                steps: nextSteps,
                pendingRespond: null,
                taskPlan: state.planAborted
                  ? null
                  : finalizePlanAfterSummarize(state.taskPlan),
                finalOutput:
                  deps.assistantArtifact.peekSerialized(
                    ctx.input.sessionId,
                    ctx.input.runId,
                  ) ?? stored,
                status: AgentRunStatus.success,
                finished: true,
                planAborted: state.planAborted,
              },
              { continuePlan: false, finished: true },
            );
          }
          const workflowInitSkipReason = latestWorkflowInitSkipReason(state.steps);
          const reasonBeforeHostTool =
            !workflowInitSkipReason &&
            isPlanReasonBeforeHostTool(state.taskPlan);
          const taskPlanForSummarize = workflowInitSkipReason ? null : state.taskPlan;
          const presentingPlanStepId = taskPlanForSummarize
            ? resolveEffectivePlanStepId({
                taskPlan: taskPlanForSummarize,
                workflowRun: state.workflowRun,
              })
            : null;
          const planSummarizeUserMessage = workflowInitSkipReason
            ? ctx.input.latestUserMessage
            : resolveSummarizeUserMessageForPlan(
                ctx.input.latestUserMessage,
                state.taskPlan,
              );
          const mergedPlanObservation =
            !workflowInitSkipReason &&
            isPendingPlanAnswerStep(
              state.taskPlan,
              state.workflowRun,
              state.workflowNodeDefs,
            )
              ? summarize.buildSummarizeObservationFromState(state, {
                  taskPlan: state.taskPlan,
                  scopedTools: state.scopedTools,
                })
              : null;
          const draftBeforeWrite =
            !workflowInitSkipReason &&
            mergedPlanObservation != null &&
            isPlanDraftSummarizeBeforeWrite(
              planExecutionContextFromState(state),
            );
          const planSummarizePublishMode = draftBeforeWrite
            ? { artifactPhase: 'draft' as const, emitAuthoritativeFull: true }
            : resolvePlanSummarizePublishMode(state.taskPlan);
          let draftPendingWrite: PlanPresentSummarizeResult | null = null;
          let reasonHostFillResult: PlanReasonHostFillResult | null = null;
          let summarized: string;
          if (reasonBeforeHostTool) {
            const observationForReasonHostFill =
              mergedPlanObservation ??
              buildPlanSummarizeObservation({
                userMessage: planSummarizeUserMessage,
              });
            reasonHostFillResult = await summarize.runPlanReasonHostFill(
              planSummarizeUserMessage,
              observationForReasonHostFill,
              allToolObservations(state),
              ctx.input.promptMessages,
              ctx.input.sessionId,
              ctx.input.runId,
              ctx.promptScope,
              state.taskPlan!,
              state.scopedHostTools ?? [],
              state.pageContext ?? null,
              ctx.input.turnId,
            );
            summarized = reasonHostFillResult.serialized;
          } else if (draftBeforeWrite) {
            draftPendingWrite = await summarize.summarizePlanPresentWithPendingWrite(
              effectiveToolName,
              toolDef?.description,
              planSummarizeUserMessage,
              mergedPlanObservation!,
              allToolObservations(state),
              ctx.input.promptMessages,
              ctx.input.sessionId,
              ctx.input.runId,
              ctx.promptScope,
              state.taskPlan,
              state.scopedTools,
              state.workflowRun,
              state.workflowNodeDefs,
            );
            summarized = draftPendingWrite.serialized;
          } else if (pendingObservation.name === CLARIFICATION_REQUEST_OBSERVATION_NAME) {
            summarized = await summarize.summarizeClarificationRequest(
              planSummarizeUserMessage,
              pendingObservation.output,
              ctx.input.promptMessages,
              ctx.input.sessionId,
              ctx.input.runId,
              ctx.promptScope,
              state.taskPlan,
              planSummarizePublishMode,
            );
          } else if (pendingObservation.name === 'skill_intent_mismatch') {
            summarized = await summarize.summarizeSkillIntentMismatch(
              planSummarizeUserMessage,
              pendingObservation.output,
              ctx.input.promptMessages,
              ctx.input.sessionId,
              ctx.input.runId,
              ctx.promptScope,
              planSummarizePublishMode,
            );
          } else if (
            pendingObservation.name === 'direct_user' ||
            pendingObservation.name === 'smalltalk' ||
            pendingObservation.name === 'off_domain'
          ) {
            summarized = mergedPlanObservation
              ? await summarize.summarizeToolOutputForUser(
                  mergedPlanObservation.name,
                  state.scopedTools.find(
                    (tool) => tool.name === mergedPlanObservation.name,
                  )?.description,
                  planSummarizeUserMessage,
                  mergedPlanObservation.output,
                  mergedPlanObservation.fieldLabels ?? {},
                  mergedPlanObservation.fieldDescriptions ?? {},
                  mergedPlanObservation.enumLabelsByPath ?? {},
                  ctx.input.promptMessages,
                  ctx.input.sessionId,
                  ctx.input.runId,
                  ctx.promptScope,
                  state.taskPlan,
                  undefined,
                  undefined,
                  planSummarizePublishMode,
                  undefined,
                  state.workflowRun,
                  state.workflowNodeDefs,
                )
              : await summarize.summarizeDirectUserMessage(
                  planSummarizeUserMessage,
                  pendingObservation.output,
                  ctx.input.promptMessages,
                  ctx.input.sessionId,
                  ctx.input.runId,
                  ctx.promptScope,
                  taskPlanForSummarize,
                  planSummarizePublishMode,
                  state.workflowRun,
                  state.workflowNodeDefs,
                );
          } else if (pendingObservation.name === 'direct_reply') {
            summarized = await summarize.summarizeDirectLlmReply(
              ctx.input.latestUserMessage,
              pendingObservation.output,
              ctx.input.promptMessages,
              ctx.input.sessionId,
              ctx.input.runId,
              ctx.promptScope,
            );
          } else {
            summarized = await summarize.summarizeToolOutputForUser(
              effectiveToolName,
              toolDef?.description,
              planSummarizeUserMessage,
              pendingObservation.output,
              pendingObservation.fieldLabels ?? {},
              pendingObservation.fieldDescriptions ?? {},
              pendingObservation.enumLabelsByPath ?? {},
              ctx.input.promptMessages,
              ctx.input.sessionId,
              ctx.input.runId,
              ctx.promptScope,
              state.taskPlan,
              toolDef?.agentMetadata,
              pendingObservation.llmPayload?.args,
              planSummarizePublishMode,
              allToolObservations(state),
              state.workflowRun,
              state.workflowNodeDefs,
            );
          }
          if (!summarized || summarized.trim().length === 0) {
            const fallback = messageBlocksToPlainText(
              ensureAtLeastOneTextBlock([], '抱歉，我暂时无法整理出有效回复。'),
            );
            deps.logger.warn(
              `summarize returned empty runId=${ctx.input.runId} observation=${pendingObservation.name}`,
            );
            const summaryStep: AgentRunStep = {
              step: nextRunStepNumber(state.steps),
              type: 'summarize',
              name: pendingObservation.name,
              output: fallback,
            };
            const nextSteps = [...state.steps, summaryStep];
            const stored = serializeMessageBlocksForStorage([
              textBlock(fallback),
            ]);
            await runHelpers.updateRun(
              ctx.input.runId,
              nextSteps,
              AgentRunStatus.success,
            );
            deps.sse.publishAssistantBlocks(ctx.input.sessionId, ctx.input.runId, [
              textBlock(fallback),
            ]);
            return mergeWorkflowSummarizeCompletion(
              {
                ...state,
                steps: nextSteps,
                pendingRespond: null,
                taskPlan: finalizePlanAfterSummarize(state.taskPlan),
                finalOutput:
                  deps.assistantArtifact.peekSerialized(
                    ctx.input.sessionId,
                    ctx.input.runId,
                  ) ?? stored,
                status: AgentRunStatus.success,
                finished: true,
              },
              { continuePlan: false, finished: true },
            );
          }
          const storedSummarized = runHelpers.sanitizeFinalOutput(summarized);
          const storedBlocks = tryParseStoredMessageBlocks(storedSummarized);
          const artifactPlain = deps.assistantArtifact.peek(
            ctx.input.sessionId,
            ctx.input.runId,
          )
            ? deps.assistantArtifact.formatOutput(
                ctx.input.sessionId,
                ctx.input.runId,
                storedSummarized,
              ).stepPlain
            : null;
          const draftStepPlain =
            reasonHostFillResult?.draftReply.trim()
              ? reasonHostFillResult.draftReply.trim()
              : draftPendingWrite?.draftReply.trim()
                ? draftPendingWrite.draftReply.trim()
                : null;
          const stepPlain =
            draftStepPlain ??
            artifactPlain ??
            (storedBlocks && storedBlocks.length > 0
              ? messageBlocksToPlainText(storedBlocks)
              : storedSummarized);
          const summaryStep: AgentRunStep = {
            step: nextRunStepNumber(state.steps),
            type: 'summarize',
            name: workflowInitSkipReason
              ? `workflow_init_skipped:${workflowInitSkipReason}`
              : summarize.resolveSummarizeStepName(
                  state.taskPlan,
                  pendingObservation.name,
                ),
            output: stepPlain,
            meta: summarize.resolveSummarizeStepMeta(pendingObservation),
          };
          const nextSteps = [...state.steps, summaryStep];
          const terminalTurnRespond = isTerminalTurnRespondPending(
            state.pendingRespond,
          );
          const taskPlanAfterSummarize =
            state.planAborted || terminalTurnRespond
              ? state.planAborted
                ? null
                : state.taskPlan
              : finalizePlanAfterSummarize(state.taskPlan);
          // present_mutation 预览节点必然后接 await_user_confirm：其 continue 判定不能用
          // 尚未 advance 的 state.workflowRun（仍指向 present_mutation，route=summarize 会误判为终止）。
          const presentMutationContinues =
            getWorkflowNodeDef(
              state.workflowNodeDefs,
              state.workflowRun?.currentNodeId,
            )?.action === 'present_mutation';
          const continuePlan =
            !terminalTurnRespond &&
            !state.planAborted &&
            !(toolErrorObs != null && isTerminalPlanToolError(toolErrorObs)) &&
            (presentMutationContinues ||
              shouldContinuePlanAfterSummarize(
                taskPlanAfterSummarize,
                state.workflowRun,
                state.workflowNodeDefs,
              ));
          if (continuePlan && planSummarizePublishMode.artifactPhase === 'draft') {
            deps.assistantArtifact.rephase(ctx.input.sessionId, ctx.input.runId, 'draft');
          }
          await runHelpers.updateRun(
            ctx.input.runId,
            nextSteps,
            continuePlan ? AgentRunStatus.running : AgentRunStatus.success,
          );
          let observationsWithMachineLayer = state.toolObservations;
          if (draftBeforeWrite && draftPendingWrite?.machineLayerDirty) {
            const patchResult = patchLatestPlanComposeWriteObservation(
              state.toolObservations,
              draftPendingWrite.machineLayer!,
            );
            observationsWithMachineLayer = patchResult.observations;
            if (!patchResult.patched) {
              deps.logger.warn(
                `plan_compose_write patch missed: observation not found runId=${ctx.input.runId} tool=${draftPendingWrite.machineLayer?.tool ?? 'unknown'}`,
              );
            }
          }
          const gateResult =
            draftBeforeWrite && taskPlanAfterSummarize
              ? resolveComposedWriteGateCallResult({
                  observations: observationsWithMachineLayer,
                  taskPlan: taskPlanAfterSummarize,
                  scopedTools: state.scopedTools,
                  pageContext: state.pageContext ?? null,
                })
              : null;
          const pendingWriteForGate = gateResult?.call ?? null;
          if (draftBeforeWrite && taskPlanAfterSummarize && gateResult) {
            if (pendingWriteForGate) {
              deps.logger.log(
                `compose gate ready after present runId=${ctx.input.runId} stage=${gateResult.stage} ${formatComposedWriteGateDiagnosticForLog(gateResult)}`,
              );
            } else {
              deps.logger.warn(
                `compose gate unresolved after present runId=${ctx.input.runId} stage=${gateResult.stage} ${formatComposedWriteGateDiagnosticForLog(gateResult)}`,
              );
            }
          }
          if (
            draftBeforeWrite &&
            pendingWriteForGate &&
            draftPendingWrite &&
            taskPlanAfterSummarize
          ) {
            draftPendingWrite = {
              ...draftPendingWrite,
              submitText:
                syncPlanPresentSubmitTextForGate({
                  submitText: draftPendingWrite.submitText,
                  gateCall: pendingWriteForGate,
                  observations: observationsWithMachineLayer,
                  taskPlan: taskPlanAfterSummarize,
                  scopedTools: state.scopedTools,
                }) || draftPendingWrite.submitText,
            };
          }
          const draftWriteTool = pendingWriteForGate
            ? state.scopedTools.find((tool) => tool.name === pendingWriteForGate.name)
            : undefined;
          const draftReplyContent =
            continuePlan && draftPendingWrite && pendingWriteForGate
              ? resolvePlanDraftReplyContentForGateObservation({
                  draftReply: draftPendingWrite.draftReply,
                  submitText: draftPendingWrite.submitText,
                  gateCall: pendingWriteForGate,
                  writeTool: draftWriteTool,
                })
              : null;
          const draftObservation =
            draftReplyContent != null
              ? buildPlanDraftReplyObservation({
                  draftReply: draftReplyContent.draftReply,
                  submitText: draftReplyContent.submitText,
                  planStepId:
                    resolveEffectivePlanStepId({
                      taskPlan: state.taskPlan,
                      workflowRun: state.workflowRun,
                    }) ?? null,
                  pendingWriteToolCall: pendingWriteForGate,
                })
              : null;
          let observationsAfterDraft = draftObservation
            ? [...observationsWithMachineLayer, draftObservation]
            : [...observationsWithMachineLayer];
          if (continuePlan && reasonHostFillResult) {
            observationsAfterDraft = [
              ...observationsAfterDraft,
              reasonHostFillResult.hostFillObservation,
              reasonHostFillResult.draftReplyObservation,
            ];
            if (reasonHostFillResult.hostToolStreamObservation) {
              observationsAfterDraft = [
                ...observationsAfterDraft,
                reasonHostFillResult.hostToolStreamObservation,
              ];
            }
            if (reasonHostFillResult.hostToolDispatchObservations?.length) {
              observationsAfterDraft = [
                ...observationsAfterDraft,
                ...reasonHostFillResult.hostToolDispatchObservations,
              ];
            }
          }
          let pendingToolCallsFromDraft =
            pendingWriteForGate != null ? [pendingWriteForGate] : [];
          if (
            pendingToolCallsFromDraft.length > 0 &&
            shouldDeferPlanPresentWriteGate({
              workflowRun: state.workflowRun,
              workflowNodeDefs: state.workflowNodeDefs,
            })
          ) {
            pendingToolCallsFromDraft = [];
          }
          if (pendingToolCallsFromDraft.length > 0) {
            deps.sse.emitThink(
              ctx.input.sessionId,
              ctx.input.runId,
              '正在准备写操作确认…\n',
              'delta',
            );
          }

          let resultState: typeof state = {
            ...state,
            steps: nextSteps,
            toolObservations: observationsAfterDraft,
            pendingRespond: null,
            pendingToolCalls: pendingToolCallsFromDraft,
            taskPlan: taskPlanAfterSummarize,
            finalOutput: runHelpers.graphFinalOutputFromArtifact(
              ctx.input.sessionId,
              ctx.input.runId,
              continuePlan,
              state.finalOutput,
            ),
            status: continuePlan ? AgentRunStatus.running : AgentRunStatus.success,
            finished: !continuePlan,
            planAborted: state.planAborted,
          };

          const reasonHostFillDispatched =
            continuePlan &&
            reasonHostFillResult?.submitText.trim() &&
            taskPlanAfterSummarize != null;
          if (reasonHostFillDispatched) {
            const pendingHostStep = getPendingPlanHostToolStep(
              taskPlanAfterSummarize,
              state.workflowRun,
            );
            const hostToolsForPrompt = filterHostToolsForPlanStep(
              state.scopedHostTools ?? [],
              taskPlanAfterSummarize,
            );
            if (pendingHostStep && hostToolsForPrompt.length > 0) {
              const dispatched = hostToolHandle.tryDispatchHostToolFromPlanDraft({
                graphState: resultState,
                pendingHostStep,
                hostToolsForPrompt,
                observationsForLlm: observationsAfterDraft,
                llmStepNumber: nextRunStepNumber(nextSteps),
                nextIteration: state.iteration + 1,
                steps: nextSteps,
              });
              if (dispatched) {
                resultState = {
                  ...dispatched,
                  finished: resultState.finished,
                  status: resultState.status,
                  finalOutput: resultState.finalOutput,
                };
                await runHelpers.updateRun(
                  ctx.input.runId,
                  resultState.steps,
                  resultState.status,
                );
                return mergeWorkflowSummarizeCompletion(resultState, {
                  continuePlan,
                  finished: resultState.finished,
                  summarizedPlanStepId: presentingPlanStepId,
                });
              }
            }
          } else if (continuePlan && !reasonHostFillResult) {
            deps.sse.emitThink(
              ctx.input.sessionId,
              ctx.input.runId,
              '中间结果已生成，继续执行后续任务步骤…\n',
              'delta',
            );
          }

          return mergeWorkflowSummarizeCompletion(resultState, {
            continuePlan,
            finished: resultState.finished,
            summarizedPlanStepId: presentingPlanStepId,
          });
    
  };
}