import type { AgentGraphNodeBundle, AgentGraphNodeFn } from '../types/graph.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import { normalizeWriteToolArguments } from '../../../../../tool-engine/write-tool-draft-injection.util';
import { resolveMaxListHttpPerTurn } from '../../../../../mcp-utils/pagination';
import type { PendingWriteResumeContext } from '../../../../../../modules/chat/pending-write-confirmation.types';
import { serializeObservationsForPending } from '../../../agent-write-confirmation.util';
import { resolvePagedGatherSummarizeObjective } from '../../../gather/plan-paged-gather.util';
import {
  expandPagedListGather,
  resumeIncompletePagedGather,
  shouldResumePagedGather,
  type PagedGatherHttpBudget,
  type PagedGatherLlmContext,
} from '../../../gather/paged-list-gather.util';
import {
  allToolObservations,
  mergeRunRoundObservations,
} from '../../../graph-tool-observations.util';
import {
  ensureAtLeastOneTextBlock,
  textBlock,
} from '../../../message/message-blocks.util';
import { emitAgentMessageSseDebug } from '../../../message/message-blocks-debug.util';
import {
  buildMutationArgsInvalidUserMessage,
  buildMutationPreviewMarkdownFromWriteCalls,
  buildMutationPreviewUnavailableUserMessage,
  hasUserVisibleMutationPreview,
} from '../../../mutation-preview-before-gate.util';
import { isMutationTool } from '../../../tool/tool-execution-status.util';
import {
  buildWriteConfirmationUserMessage,
  filterSchemaValidWriteConfirmationCalls,
  partitionToolCallsByWriteConfirmation,
} from '../../../write-confirmation-gate.util';
import { executeToolCallsRound } from '../../runtime/agent-tool-runtime.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import {
  applyPlanDraftToWriteToolCalls,
  resolvePlanSubmitTextForWrite,
} from '../../plan-present/plan-draft-reply.util';
import {
  buildReadToolObservationMatcher,
  tryInterceptComposeMutationToolCalls,
} from '../../plan-present/plan-compose-write.util';
import {
  isComposeMutationParameterStep,
  resolvePlanExecutionStep,
  resolveTaskPlanAdvance,
} from '../../plan/task-plan.util';
import { applyComposeMutationProgress, applyPlanAdvanceAsWorkflowProgress } from '../../../../../workflow/workflow-plan-transition.util';
import { resolveWriteConfirmationPolicy } from '../../../../../workflow/workflow-mutation-write-gate.util';
import { toolRequiresWriteConfirmation } from '../../../../../risk/risk-level.util';
import { logWorkflowDebug } from '../../../../../workflow/trace/workflow-debug.util';
import {
  buildWriteDraftListFromChatGate,
  resolveDraftRetryBudget,
  resolveDraftRetryCountAfterRegeneration,
  resolveWriteDraftFromChatGate,
  syncChatGateToolCallsFromWriteDraft,
  toWriteDraftPublic,
  buildEditPolicyGateFields,
  resolveWriteDraftEditPoliciesForPublicDrafts,
} from '../../../../../draft-review';
import type { AgentRunStep, GraphToolCall, ToolObservation } from '../../types/agent-engine.types';

export function createToolsNode(bundle: AgentGraphNodeBundle): AgentGraphNodeFn {
  const { deps, ctx, runHelpers, summarize } = bundle;
  return async (state) => {

          const pagedGatherHttpBudget: PagedGatherHttpBudget = {
            used: state.pagedListHttpUsed ?? 0,
            max: resolveMaxListHttpPerTurn(),
          };
          const gatherLlm: PagedGatherLlmContext = {
            llmService: deps.llmService,
            promptRegistry: deps.promptRegistry,
            scope: {
              appClientId: ctx.input.appClientId,
              agentId: ctx.input.agentId,
            },
            currentObjective:
              resolvePagedGatherSummarizeObjective(state.taskPlan) ??
              state.taskPlan?.currentObjective ??
              undefined,
            runMetrics: ctx.input.runMetrics,
            runId: ctx.input.runId,
            sessionId: ctx.input.sessionId,
            iteration: state.iteration,
            onDebugLog: (message) => deps.logger.warn(message),
          };
          const langChainBundleForResume =
            state.scopedToolBundle ??
            deps.toolEngine.buildLangChainTools(state.scopedTools, {
              userId: ctx.input.userId,
              allowedToolIds: state.scopedAllowedToolIds,
            });
          const runRoundForGather = async (
            toolCalls: GraphToolCall[],
            observations: ToolObservation[],
            steps: AgentRunStep[],
          ) =>
            executeToolCallsRound({
              latestUserMessage: ctx.input.latestUserMessage,
              toolCalls,
              scopedTools: state.scopedTools,
              toolProfilesByName: state.toolProfilesByName,
              langChainBundle: langChainBundleForResume,
              toolEngine: deps.toolEngine,
              observations,
              steps,
              iteration: state.iteration,
              assessObservationQuality: (output, agentMetadata) =>
                summarize.assessObservationQuality(output, agentMetadata),
              resolveToolStepCode: (quality, output, agentMetadata) =>
                summarize.resolveToolStepCode(quality, output, agentMetadata),
              runMetrics: ctx.input.runMetrics,
              runId: ctx.input.runId,
              sessionId: ctx.input.sessionId,
              onThink: (message) =>
                deps.sse.emitThink(
                  ctx.input.sessionId,
                  ctx.input.runId,
                  message,
                  'delta',
                ),
              onToolDebugLog: (message) => deps.logger.log(message),
            });

          if (
            state.pendingToolCalls.length === 0 &&
            shouldResumePagedGather({
              taskPlan: state.taskPlan,
              scopedTools: state.scopedTools,
              observations: allToolObservations(state),
            })
          ) {
            const resumed = await resumeIncompletePagedGather({
              taskPlan: state.taskPlan,
              scopedTools: state.scopedTools,
              observations: allToolObservations(state),
              steps: state.steps,
              runRound: runRoundForGather,
              gatherLlm,
              httpBudget: pagedGatherHttpBudget,
              onProgress: (message) =>
                deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, message, 'delta'),
            });
            if (resumed) {
              const nextSteps = resumed.steps.map((row) => ({
                ...row,
                output: runHelpers.normalizeJsonLike(row.output),
              }));
              await runHelpers.updateRun(
              ctx.input.runId,
              nextSteps,
              AgentRunStatus.running,
              );
              return {
                ...state,
                steps: nextSteps,
                toolObservations: mergeRunRoundObservations(
                  state,
                  resumed.toolObservations,
                ),
                pendingToolCalls: [],
                pagedListHttpUsed: pagedGatherHttpBudget.used,
                lastToolRoundMeta: resumed.lastToolRoundMeta,
              };
            }
          }

          if (state.pendingToolCalls.length === 0) {
            return {
              ...state,
              lastToolRoundMeta: null,
              pagedListHttpUsed: pagedGatherHttpBudget.used,
            };
          }

          const pendingToolCalls = applyPlanDraftToWriteToolCalls(
            state.pendingToolCalls,
            state.taskPlan,
            state.scopedTools,
            resolvePlanSubmitTextForWrite({
              observations: allToolObservations(state),
              artifactBlocks:
                deps.assistantArtifact.peekBlocks(ctx.input.sessionId, ctx.input.runId) ??
                null,
              scopedTools: state.scopedTools,
            }),
          ).map((call) => {
            const def = state.scopedTools.find((tool) => tool.name === call.name);
            if (!def || !isMutationTool(def.agentMetadata)) {
              return call;
            }
            const isReadToolObservation = buildReadToolObservationMatcher(
              state.scopedTools,
            );
            return {
              ...call,
              arguments: normalizeWriteToolArguments(
                call.arguments,
                def,
                allToolObservations(state),
                {
                  isReadToolObservation,
                  pageContext: state.pageContext ?? null,
                },
              ),
            };
          });

          const langChainBundle =
            state.scopedToolBundle ??
            deps.toolEngine.buildLangChainTools(state.scopedTools, {
              userId: ctx.input.userId,
              allowedToolIds: state.scopedAllowedToolIds,
            });

          const runRound = async (
            toolCalls: GraphToolCall[],
            observations: ToolObservation[],
            steps: AgentRunStep[],
          ) =>
            executeToolCallsRound({
              latestUserMessage: ctx.input.latestUserMessage,
              toolCalls,
              scopedTools: state.scopedTools,
              toolProfilesByName: state.toolProfilesByName,
              langChainBundle,
              toolEngine: deps.toolEngine,
              observations,
              steps,
              iteration: state.iteration,
              assessObservationQuality: (output, agentMetadata) =>
                summarize.assessObservationQuality(output, agentMetadata),
              resolveToolStepCode: (quality, output, agentMetadata) =>
                summarize.resolveToolStepCode(quality, output, agentMetadata),
              runMetrics: ctx.input.runMetrics,
              runId: ctx.input.runId,
              sessionId: ctx.input.sessionId,
              onThink: (message) =>
                deps.sse.emitThink(
                  ctx.input.sessionId,
                  ctx.input.runId,
                  message,
                  'delta',
                ),
              onToolDebugLog: (message) => deps.logger.log(message),
            });

          const writePolicy = resolveWriteConfirmationPolicy({
            workflowRun: state.workflowRun,
            workflowNodeDefs: state.workflowNodeDefs,
            taskPlan: state.taskPlan,
            approvedWriteToolNames: ctx.input.approvedWriteToolNames,
          });
          const bypassApprovedNames =
            writePolicy.kind === 'bypass_after_workflow_await'
              ? state.scopedTools
                  .filter((tool) =>
                    toolRequiresWriteConfirmation({
                      riskLevel: tool.riskLevel,
                      agentMetadata: tool.agentMetadata,
                    }),
                  )
                  .map((tool) => tool.name)
              : ctx.input.approvedWriteToolNames;

          const { safeCalls, writeCallsNeedingConfirm } =
            partitionToolCallsByWriteConfirmation(
              pendingToolCalls,
              state.scopedTools,
              bypassApprovedNames,
            );
          const writeCallsForGate = filterSchemaValidWriteConfirmationCalls(
            writeCallsNeedingConfirm,
            state.scopedTools,
          );
          if (
            writeCallsNeedingConfirm.length > 0 &&
            writeCallsForGate.length === 0
          ) {
            deps.logger.warn(
              `write confirmation blocked: pending tool_calls fail schema validation runId=${ctx.input.runId} tools=${writeCallsNeedingConfirm.map((call) => call.name).join(',')}`,
            );
            runHelpers.publishMutationGateBlockedDraft(
              ctx.input.sessionId,
              ctx.input.runId,
              ctx.input.turnId,
              buildMutationArgsInvalidUserMessage(),
            );
            return {
              ...state,
              pendingToolCalls: [],
              lastToolRoundMeta: null,
              pagedListHttpUsed: pagedGatherHttpBudget.used,
            };
          }

          if (
            writePolicy.kind === 'defer_to_workflow_await' &&
            writeCallsNeedingConfirm.length > 0
          ) {
            const { step: executionStep, workflowNodeAction } =
              resolvePlanExecutionStep({
                taskPlan: state.taskPlan,
                workflowRun: state.workflowRun,
                workflowNodeDefs: state.workflowNodeDefs,
              });
            if (
              state.taskPlan &&
              executionStep &&
              isComposeMutationParameterStep(executionStep, workflowNodeAction)
            ) {
              const intercept = tryInterceptComposeMutationToolCalls({
                toolCalls: pendingToolCalls,
                taskPlan: state.taskPlan,
                scopedTools: state.scopedTools,
                observations: allToolObservations(state),
                pageContext: state.pageContext ?? null,
                planStepId: executionStep.id,
                workflowRun: state.workflowRun,
                workflowNodeDefs: state.workflowNodeDefs,
              });
              if (intercept.kind === 'applied') {
                const progressed = applyComposeMutationProgress({
                  taskPlan: state.taskPlan,
                  workflowRun: state.workflowRun,
                  workflowNodeDefs: state.workflowNodeDefs,
                  workflowAwaitingReact: state.workflowAwaitingReact,
                  planStepId: executionStep.id,
                  composeObservation: intercept.composeObservation,
                });
                deps.logger.log(
                  `compose_mutation intercept in tools.node runId=${ctx.input.runId} tool=${intercept.preparedCall.name}`,
                );
                return {
                  ...state,
                  workflowRun: progressed.workflowRun ?? state.workflowRun,
                  workflowAwaitingReact:
                    progressed.workflowAwaitingReact ??
                    state.workflowAwaitingReact,
                  toolObservations: mergeRunRoundObservations(state, [
                    intercept.composeObservation,
                  ]),
                  taskPlan: progressed.taskPlan,
                  pendingToolCalls: [],
                  lastToolRoundMeta: null,
                  pagedListHttpUsed: pagedGatherHttpBudget.used,
                };
              }
            }
            deps.logger.warn(
              `write gate deferred: premature write before await_user_confirm runId=${ctx.input.runId} tools=${writeCallsNeedingConfirm.map((call) => call.name).join(',')}`,
            );
            return {
              ...state,
              pendingToolCalls: [],
              lastToolRoundMeta: null,
              pagedListHttpUsed: pagedGatherHttpBudget.used,
            };
          }

          if (writeCallsForGate.length > 0) {
            let nextSteps = [...state.steps];
            let observations = [...allToolObservations(state)];
            let taskPlan = state.taskPlan ?? null;
            let workflowRunForContext = state.workflowRun;
            let workflowAwaitingReactForContext = state.workflowAwaitingReact;

            if (safeCalls.length > 0) {
              const safeRound = await expandPagedListGather({
                round: await runRound(safeCalls, observations, nextSteps),
                taskPlan: state.taskPlan,
                scopedTools: state.scopedTools,
                runRound,
                gatherLlm,
                httpBudget: pagedGatherHttpBudget,
                onProgress: (message) =>
                  deps.sse.emitThink(
                    ctx.input.sessionId,
                    ctx.input.runId,
                    message,
                    'delta',
                  ),
              });
              nextSteps = safeRound.steps.map((row) => ({
                ...row,
                output: runHelpers.normalizeJsonLike(row.output),
              }));
              observations = safeRound.toolObservations;

              if (taskPlan && safeRound.lastToolRoundMeta.toolCalls.length > 0) {
                const advance = resolveTaskPlanAdvance({
                  phase: 'post_tools',
                  plan: taskPlan,
                  observations,
                  executionStatuses:
                    safeRound.lastToolRoundMeta.executionStatuses,
                  roundObservationIndices:
                    safeRound.lastToolRoundMeta.roundObservationIndices,
                  scopedTools: state.scopedTools,
                  toolCalls: safeCalls,
                  skillConfig: state.activeSkillConfig,
                });
                if (advance && taskPlan) {
                  const planBefore = taskPlan;
                  const progressed = applyPlanAdvanceAsWorkflowProgress({
                    taskPlan,
                    workflowRun: workflowRunForContext,
                    workflowNodeDefs: state.workflowNodeDefs,
                    workflowAwaitingReact: workflowAwaitingReactForContext,
                    planBefore,
                    planAdvance: advance,
                  });
                  taskPlan = (progressed.taskPlan as typeof taskPlan) ?? taskPlan;
                  if (progressed.workflowRun) {
                    workflowRunForContext = progressed.workflowRun;
                  }
                  if (progressed.workflowAwaitingReact !== undefined) {
                    workflowAwaitingReactForContext = progressed.workflowAwaitingReact;
                  }
                }
              }

              await runHelpers.updateRun(
              ctx.input.runId,
              nextSteps,
              AgentRunStatus.running,
              );
            }

            let previewReady = hasUserVisibleMutationPreview({
              artifact: deps.assistantArtifact.peek(ctx.input.sessionId, ctx.input.runId),
              observations,
            });
            if (!previewReady) {
              const previewMarkdown = buildMutationPreviewMarkdownFromWriteCalls(
                writeCallsForGate,
                state.scopedTools,
              );
              if (previewMarkdown.trim()) {
                const turnId =
                  deps.assistantArtifact.peekTurnId(ctx.input.sessionId, ctx.input.runId) ??
                  ctx.input.turnId;
                const blocks = deps.sse.publishAssistantBlocks(
                  ctx.input.sessionId,
                  ctx.input.runId,
                  ensureAtLeastOneTextBlock(
                    [textBlock(previewMarkdown.trim(), 'markdown')],
                    previewMarkdown.trim(),
                  ),
                  { turnId, phase: 'draft' },
                );
                previewReady = blocks.length > 0;
              }
            }
            if (!previewReady) {
              deps.logger.warn(
                `write gate blocked: no user-visible mutation preview runId=${ctx.input.runId}`,
              );
              runHelpers.publishMutationGateBlockedDraft(
                ctx.input.sessionId,
                ctx.input.runId,
                ctx.input.turnId,
                buildMutationPreviewUnavailableUserMessage(),
              );
              return {
                ...state,
                pendingToolCalls: [],
                lastToolRoundMeta: null,
                pagedListHttpUsed: pagedGatherHttpBudget.used,
              };
            }

            const message = buildWriteConfirmationUserMessage();
            const confirmedPreviewSerialized =
              deps.assistantArtifact.peekSerialized(ctx.input.sessionId, ctx.input.runId);
            const draftRetryCount = resolveDraftRetryCountAfterRegeneration({
              previousCount: state.draftRetryCount,
              regeneratedFromRetry: ctx.input.resumeFromWriteGateRetry === true,
            });
            const draftRetryBudget = resolveDraftRetryBudget(draftRetryCount);
            const existingPending =
              await deps.pendingWriteConfirmationStore.get(
                ctx.input.sessionId,
                ctx.input.userId,
              );
            if (
              existingPending &&
              existingPending.runId !== ctx.input.runId
            ) {
              deps.runSseGateway.purgeWriteConfirmationGate(
                ctx.input.sessionId,
                existingPending.runId,
              );
            }
            const serializedObservations =
              serializeObservationsForPending(observations);
            const writeDraft = resolveWriteDraftFromChatGate({
              toolCalls: writeCallsForGate,
              observations: serializedObservations,
              confirmedPreviewSerialized,
              draftRetryCount,
            });
            const toolCallsForGate = syncChatGateToolCallsFromWriteDraft({
              toolCalls: writeCallsForGate,
              writeDraft,
            });
            const previewBlocksForGate =
              deps.assistantArtifact.peekBlocks(
                ctx.input.sessionId,
                ctx.input.runId,
              ) ?? undefined;
            const writeDraftList = buildWriteDraftListFromChatGate({
              toolCalls: writeCallsForGate,
              writeDraft,
              observations: serializedObservations,
              confirmedPreviewSerialized,
              draftRetryCount,
              previewBlocks: previewBlocksForGate,
            });
            const primaryWriteDraft = writeDraftList[0] ?? writeDraft;
            const publicDraftList = writeDraftList.map((draft) =>
              toWriteDraftPublic(draft),
            );
            const editPolicyFields = buildEditPolicyGateFields(
              resolveWriteDraftEditPoliciesForPublicDrafts(publicDraftList, {
                scopedTools: state.scopedTools,
              }),
            );
            await deps.pendingWriteConfirmationStore.set({
              runId: ctx.input.runId,
              turnId: ctx.input.turnId,
              sessionId: ctx.input.sessionId,
              userId: ctx.input.userId,
              appClientId: ctx.input.appClientId,
              agentId: ctx.input.agentId,
              latestUserMessage: ctx.input.latestUserMessage,
              toolCalls: toolCallsForGate,
              writeDraft: primaryWriteDraft,
              writeDrafts:
                writeDraftList.length > 1 ? writeDraftList : undefined,
              resumeContext: {
                steps: nextSteps as PendingWriteResumeContext['steps'],
                iteration: state.iteration,
                toolObservations: serializedObservations,
                scopedToolIds: state.scopedTools.map((tool) => tool.id),
                intentKind: state.intentKind,
                hasExpandedOnce: state.hasExpandedOnce,
                skillApplied: state.skillApplied === true,
                activeSkillId: state.activeSkillId ?? null,
                activeSkillPrompt: state.activeSkillPrompt ?? null,
                activeSkillName: state.activeSkillName ?? null,
                activeSkillDescription: state.activeSkillDescription ?? null,
                activeSkillConfig: state.activeSkillConfig ?? null,
                activeSkillRiskLevel: state.activeSkillRiskLevel ?? null,
                taskPlan,
                pagedListHttpUsed: pagedGatherHttpBudget.used,
                confirmedPreviewSerialized,
                pageContext: state.pageContext ?? null,
                workflowRun: workflowRunForContext ?? null,
                workflowNodeDefs: state.workflowNodeDefs,
                workflowNodeOutputs: state.workflowNodeOutputs,
                workflowAwaitingReact: workflowAwaitingReactForContext === true,
                draftRetryCount,
              },
              createdAt: new Date().toISOString(),
            });
            logWorkflowDebug('write_confirm_gate', {
              runId: ctx.input.runId,
              sessionId: ctx.input.sessionId,
              turnId: ctx.input.turnId,
              toolNames: toolCallsForGate.map((call) => call.name),
              workflowRun: state.workflowRun ?? null,
              hasWorkflowNodeDefs: (state.workflowNodeDefs?.length ?? 0) > 0,
            });
            const confirmationPayload = {
              source: 'agent-run' as const,
              action: 'confirmation_required' as const,
              runId: ctx.input.runId,
              turnId: ctx.input.turnId,
              message,
            };
            const published = deps.runSseGateway.emitConfirmationRequired(
              ctx.input.sessionId,
              {
                runId: ctx.input.runId,
                turnId: ctx.input.turnId,
                message,
                draftRetryCount: draftRetryBudget.used,
                draftRetryMax: draftRetryBudget.max,
                canRetry: draftRetryBudget.canRetry,
                writeDraft: publicDraftList[0],
                writeDrafts:
                  publicDraftList.length > 1 ? publicDraftList : undefined,
                ...editPolicyFields,
              },
            );
            if (!published) {
              emitAgentMessageSseDebug({
                tag: 'confirmation_required_suppressed',
                sessionId: ctx.input.sessionId,
                runId: ctx.input.runId,
                turnId: ctx.input.turnId,
                ssePayload: confirmationPayload,
                source: { reason: 'run_not_publishable' },
              });
            } else {
              emitAgentMessageSseDebug({
                tag: 'confirmation_required',
                sessionId: ctx.input.sessionId,
                runId: ctx.input.runId,
                turnId: ctx.input.turnId,
                ssePayload: confirmationPayload,
                source: {
                  confirmedPreviewSerialized,
                  artifactBlocks: deps.assistantArtifact.peekBlocks(
                    ctx.input.sessionId,
                    ctx.input.runId,
                  ),
                },
              });
            }
            const gateStep: AgentRunStep = {
              step: nextRunStepNumber(nextSteps),
              type: 'write_confirmation_gate',
              output: runHelpers.normalizeJsonLike({
                status: 'awaiting_user',
                pendingToolCallCount: toolCallsForGate.length,
                toolNames: toolCallsForGate.map((call) => call.name),
              }),
            };
            nextSteps = [...nextSteps, gateStep];
            await runHelpers.updateRun(
              ctx.input.runId,
              nextSteps,
              AgentRunStatus.success,
            );
            return {
              ...state,
              steps: nextSteps,
              toolObservations: mergeRunRoundObservations(state, observations),
              taskPlan,
              workflowRun: workflowRunForContext,
              workflowAwaitingReact: workflowAwaitingReactForContext,
              pendingToolCalls: [],
              draftRetryCount,
              awaitingWriteConfirmation: true,
              finalOutput:
                deps.assistantArtifact.peekSerialized(
                  ctx.input.sessionId,
                  ctx.input.runId,
                ) ?? '',
              status: AgentRunStatus.success,
              finished: true,
              pagedListHttpUsed: pagedGatherHttpBudget.used,
            };
          }

          const round = await expandPagedListGather({
            round: await runRound(
              state.pendingToolCalls,
              [...allToolObservations(state)],
              [...state.steps],
            ),
            taskPlan: state.taskPlan,
            scopedTools: state.scopedTools,
            runRound,
            gatherLlm,
            httpBudget: pagedGatherHttpBudget,
            onProgress: (message) =>
              deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, message, 'delta'),
          });
          const nextSteps = round.steps.map((row) => ({
            ...row,
            output: runHelpers.normalizeJsonLike(row.output),
          }));

          await runHelpers.updateRun(
              ctx.input.runId,
              nextSteps,
              AgentRunStatus.running,
          );

          return {
            ...state,
            steps: nextSteps,
            toolObservations: mergeRunRoundObservations(
              state,
              round.toolObservations,
            ),
            pendingToolCalls: [],
            pendingRespond: null,
            pagedListHttpUsed: pagedGatherHttpBudget.used,
            lastToolRoundMeta: round.lastToolRoundMeta,
          };
    
  };
}