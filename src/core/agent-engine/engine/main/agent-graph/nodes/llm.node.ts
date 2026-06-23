import type {
  AgentGraphNodeBundle,
  AgentGraphNodeFn,
} from '../types/graph.types';
import { AIMessage } from '@langchain/core/messages';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import type { LlmChatMessage } from '../../../../../llm/llm.types';
import {
  buildLlmFailureUserMessage,
  resolveLlmFailureCode,
} from '../../../agent-run-user-messages.util';
import {
  allToolObservations,
  splitToolObservationsFromState,
} from '../../../graph-tool-observations.util';
import { extractLlmUserFacingText } from '../../../llm-output-sanitize.util';
import {
  emitLlmPromptDebug,
  isLlmPromptDebugEnabled,
} from '../../../llm-prompt-debug.util';
import {
  recordLlmUsage,
  recordMachineCodeUsage,
} from '../../../run-metrics.util';
import {
  hasPendingRespond,
  pendingRespondFromObservation,
} from '../../../turn/turn-respond.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import {
  filterHostToolsForPlanStep,
  partitionDecisionToolCalls,
} from '../../host-tool/host-tool-plan.util';
import {
  applyPlanDraftToWriteToolCalls,
  resolvePlanSubmitTextForWrite,
} from '../../plan-present/plan-draft-reply.util';
import { resolveReasonDraftForHostToolStep } from '../../host-tool/host-tool-fill-alignment.util';
import { resolveTurnExecutionContract } from '../../../turn/turn-execution-contract.util';
import {
  formatComposedWriteGateDiagnosticForLog,
  resolvePendingWriteForPlanWriteStepResult,
  summarizeWriteArgsForGateLog,
} from '../../plan-present/plan-draft-summarize.util';
import {
  buildPlanComposeWriteObservation,
  pickComposeWriteToolCall,
  prepareComposeWriteToolCall,
} from '../../plan-present/plan-compose-write.util';
import {
  planObservationBucketsFromState,
  selectObservationsForPlanToolSatisfaction,
} from '../../plan/plan-observation-scope.util';
import {
  advancePlanAfterStepComplete,
  buildPlanSummarizeObservation,
  filterScopedToolsForPlanStep,
  getPendingPlanHostToolStep,
  getPendingPlanToolStep,
  isPendingPlanAnswerStep,
  isPlanComposeWriteStep,
  isPlanToolStepSatisfiedByObservations,
  isPlanWriteFallbackStep,
} from '../../plan/task-plan.util';
import type { AgentGraphState } from '../../types/agent-engine.types';

export function createLlmNode(bundle: AgentGraphNodeBundle): AgentGraphNodeFn {
  const {
    deps,
    ctx,
    runHelpers,
    skillFrame,
    hostToolHandle,
    decision,
    summarize,
  } = bundle;
  return async (state) => {
    const prepared = await skillFrame.prepareReActPlanState(state);
    const graphState = skillFrame.withPlanSyncStep(
      prepared.state,
      prepared.planAdvance,
      prepared.fromStepId,
      'llm',
    );
    if (hasPendingRespond(graphState.pendingRespond)) {
      return graphState;
    }
    if (
      !graphState.skillApplied &&
      graphState.toolObservations.length === 0 &&
      graphState.pendingToolCalls.length === 0 &&
      !runHelpers.isIntentMatched(graphState)
    ) {
      return runHelpers.buildTurnRespondState(graphState, graphState.steps, {
        kind: 'unsupported_scope',
        userMessage: ctx.input.latestUserMessage,
      });
    }
    const graphStateForLlm = graphState;
    const observationSplit = splitToolObservationsFromState(graphStateForLlm);
    const observationsForLlm = allToolObservations(graphStateForLlm);
    const observationBuckets =
      planObservationBucketsFromState(graphStateForLlm);
    const observationsForPlanSatisfaction =
      selectObservationsForPlanToolSatisfaction(observationBuckets);
    if (isPendingPlanAnswerStep(graphStateForLlm.taskPlan)) {
      deps.sse.emitThink(
        ctx.input.sessionId,
        ctx.input.runId,
        '正在按任务计划生成结果…\n',
        'delta',
      );
      return {
        ...graphStateForLlm,
        pendingRespond: pendingRespondFromObservation(
          buildPlanSummarizeObservation({
            userMessage: ctx.input.latestUserMessage,
            summarizeObservation: summarize.buildSummarizeObservationFromState(
              graphStateForLlm,
              {
                taskPlan: graphStateForLlm.taskPlan,
                scopedTools: graphStateForLlm.scopedTools,
              },
            ),
          }),
        ),
      };
    }
    const llmStepNumber = nextRunStepNumber(graphStateForLlm.steps);
    const nextIteration = graphStateForLlm.iteration + 1;
    const pendingToolStepEarly = getPendingPlanToolStep(
      graphStateForLlm.taskPlan,
    );
    if (isPlanWriteFallbackStep(pendingToolStepEarly)) {
      const reuse = resolvePendingWriteForPlanWriteStepResult({
        observations: allToolObservations(graphStateForLlm),
        taskPlan: graphStateForLlm.taskPlan,
        scopedTools: graphStateForLlm.scopedTools,
        pageContext: graphStateForLlm.pageContext ?? null,
      });
      if (reuse.call) {
        deps.logger.log(
          `write fallback: reuse plan_compose_write pending call runId=${
            ctx.input.runId
          } tool=${reuse.call.name} source=${reuse.source ?? 'unknown'}`,
        );
        return {
          ...graphStateForLlm,
          iteration: nextIteration,
          pendingToolCalls: [reuse.call],
          pendingRespond: null,
        };
      }
      const diagnosticDetail = reuse.gateDiagnostic
        ? formatComposedWriteGateDiagnosticForLog({
            call: reuse.call,
            failureReason: reuse.failureReason,
            diagnostic: reuse.gateDiagnostic,
          })
        : `failureReason=${reuse.failureReason ?? 'none'}`;
      deps.logger.warn(
        `write fallback: compose reuse failed runId=${ctx.input.runId} step=${
          pendingToolStepEarly?.id ?? 'unknown'
        } source=${reuse.source ?? 'none'} ${diagnosticDetail}`,
      );
    }
    try {
      const planAnswerStep = isPendingPlanAnswerStep(graphStateForLlm.taskPlan);
      const pendingHostStep = getPendingPlanHostToolStep(
        graphStateForLlm.taskPlan,
      );
      const decisionEnableToolCall =
        ctx.input.enableToolCall && !planAnswerStep;
      const toolsForPrompt = filterScopedToolsForPlanStep(
        graphStateForLlm.scopedTools,
        graphStateForLlm.taskPlan,
      );
      const hostToolsForPrompt = filterHostToolsForPlanStep(
        graphStateForLlm.scopedHostTools ?? [],
        graphStateForLlm.taskPlan,
      );
      const allowedDecisionToolNames = new Set(
        toolsForPrompt.map((tool) => tool.name),
      );
      const allowedHostToolNames = new Set(
        hostToolsForPrompt.map((tool) => tool.name),
      );
      if (pendingHostStep) {
        const preSkipState = hostToolHandle.handleHostToolPreLlmSkip({
          graphState: graphStateForLlm,
          pendingHostStep,
          hostToolsForPrompt,
          llmStepNumber,
          nextIteration,
        });
        if (preSkipState) {
          return preSkipState;
        }
      }
      if (
        pendingHostStep &&
        hostToolsForPrompt.length > 0 &&
        graphStateForLlm.taskPlan
      ) {
        const artifactBlocks =
          deps.assistantArtifact.peekBlocks(
            ctx.input.sessionId,
            ctx.input.runId,
          ) ?? null;
        const contract = resolveTurnExecutionContract(
          graphStateForLlm,
          undefined,
          deps.logger,
        );
        const planDraftText =
          contract.plan.allowHostToolAutoDispatch && graphStateForLlm.taskPlan
            ? resolveReasonDraftForHostToolStep({
                taskPlan: graphStateForLlm.taskPlan,
                observations: observationsForLlm,
                artifactBlocks,
              })
            : null;
        if (planDraftText) {
          const dispatched = hostToolHandle.tryDispatchHostToolFromPlanDraft({
            graphState: graphStateForLlm,
            pendingHostStep,
            hostToolsForPrompt,
            observationsForLlm,
            llmStepNumber,
            nextIteration,
            steps: graphStateForLlm.steps,
          });
          if (dispatched) {
            return dispatched;
          }
        }
      }
      let langChainToolsForDecision: DynamicStructuredTool[] = [];
      if (!planAnswerStep) {
        if (pendingHostStep) {
          langChainToolsForDecision = (
            graphStateForLlm.scopedHostLangChainTools ?? []
          ).filter((tool) => allowedHostToolNames.has(tool.name));
        } else {
          langChainToolsForDecision =
            graphStateForLlm.scopedLangChainTools.filter((tool) =>
              allowedDecisionToolNames.has(tool.name),
            );
          if (langChainToolsForDecision.length === 0) {
            langChainToolsForDecision = graphStateForLlm.scopedLangChainTools;
          }
        }
      }
      const decisionResult = await decision.buildDecisionPrompt(
        ctx.input.promptMessages,
        toolsForPrompt,
        observationSplit,
        decisionEnableToolCall,
        ctx.promptScope,
        graphStateForLlm.activeSkillPrompt,
        graphStateForLlm.taskPlan,
        hostToolsForPrompt,
      );
      const { messages: invokeMessages, trimMeta } =
        decision.buildLlmInvokeMessages(
          ctx.input.promptMessages,
          observationSplit,
          ctx.input.latestUserMessage,
          decisionResult.toolSchemaJson,
          decisionResult.hostToolSchemaJson,
          decisionResult.toolDecisionPrompt,
          ctx.input.messageTokenBudget,
          graphStateForLlm.taskPlan,
        );
      const promptDebugFile = emitLlmPromptDebug(
        (message) => deps.logger.log(message),
        {
          runId: ctx.input.runId,
          sessionId: ctx.input.sessionId,
          phase: 'decision',
          step: llmStepNumber,
          iteration: graphStateForLlm.iteration,
          messageTokenBudget: ctx.input.messageTokenBudget,
          meta: {
            enableToolCall: decisionEnableToolCall,
            scopedToolCount: graphStateForLlm.scopedTools.length,
            decisionToolCount: toolsForPrompt.length,
            planAnswerStep: planAnswerStep,
            planToolRoleFilter:
              getPendingPlanToolStep(graphStateForLlm.taskPlan)?.toolRole ??
              null,
            observationCount: observationsForLlm.length,
            estimatedTokens: trimMeta.estimatedTokensAfter,
            taskPlanStep: graphStateForLlm.taskPlan?.currentStepId ?? null,
            taskPlanPhase: graphStateForLlm.taskPlan?.taskPhase ?? null,
            currentObjective:
              graphStateForLlm.taskPlan?.currentObjective ?? null,
          },
          messages: invokeMessages,
        },
      );
      if (promptDebugFile) {
        deps.logger.log(
          `LLM decision prompt file runId=${ctx.input.runId} step=${llmStepNumber} path=${promptDebugFile}`,
        );
      } else if (isLlmPromptDebugEnabled()) {
        deps.logger.warn(
          `LLM decision prompt debug file write failed runId=${ctx.input.runId} step=${llmStepNumber}`,
        );
      }
      const llmStartedAt = Date.now();
      const langChainInvokeMessages = invokeMessages.map((message) =>
        decision.toLangChainInvokeMessage(message),
      );
      const { model } =
        await deps.llmService.createLangChainChatModelForMessages(
          invokeMessages.map((message) => ({
            role: message.role as LlmChatMessage['role'],
            content: message.content,
            toolCallId: message.toolCallId,
          })),
        );
      const runnable = decisionEnableToolCall
        ? model.bindTools(langChainToolsForDecision as unknown[])
        : model.bindTools([]);
      const aiMessage = await deps.sse.streamRunnableMessages(
        runnable as {
          stream: (messages: unknown[]) => Promise<AsyncIterable<unknown>>;
          invoke: (messages: unknown[]) => Promise<AIMessage>;
        },
        langChainInvokeMessages,
        ctx.input.sessionId,
        ctx.input.runId,
      );
      const responseMeta = aiMessage.response_metadata as
        | Record<string, unknown>
        | undefined;
      const toolCalls = decisionEnableToolCall
        ? decision.extractToolCalls(aiMessage)
        : [];
      const llmText = extractLlmUserFacingText(
        decision.extractAiMessageText(aiMessage),
      );
      recordLlmUsage(ctx.input.runMetrics, {
        messages: invokeMessages.map((message) => ({
          role: message.role as LlmChatMessage['role'],
          content: message.content,
        })),
        outputText: llmText,
        durationMs: Date.now() - llmStartedAt,
        model:
          typeof responseMeta?.model_name === 'string'
            ? responseMeta.model_name
            : undefined,
        responseMeta,
      });
      const steps = [
        ...graphStateForLlm.steps,
        {
          step: llmStepNumber,
          type: 'llm' as const,
          output: runHelpers.normalizeJsonLike({
            content: llmText,
            toolCalls,
            taskPlanTrace: decision.buildTaskPlanTraceForLlmStep(
              graphStateForLlm.taskPlan,
            ),
          }),
          meta: {
            model:
              typeof responseMeta?.model_name === 'string'
                ? responseMeta.model_name
                : undefined,
            prompt: decisionResult.toolDecisionPrompt,
            toolSchema: decisionResult.toolSchemaJson,
            observations: decisionResult.observationsJson,
            agentPrompt: decisionResult.agentPrompt ?? undefined,
            userRequest:
              graphStateForLlm.taskPlan?.currentObjective ??
              ctx.input.latestUserMessage,
          },
        },
      ];
      await runHelpers.updateRun(
        ctx.input.runId,
        steps,
        AgentRunStatus.running,
      );
      const { httpCalls, hostCalls } = partitionDecisionToolCalls(
        toolCalls,
        pendingHostStep,
        allowedHostToolNames,
      );
      const hostToolOutcome = hostToolHandle.processHostToolAfterLlmDecision({
        graphState: graphStateForLlm,
        pendingHostStep,
        hostToolsForPrompt,
        observationsForLlm,
        llmStepNumber,
        nextIteration,
        steps,
        httpCalls,
        hostCalls,
        toolCallsFromLlm: toolCalls,
      });
      if (hostToolOutcome.kind === 'state') {
        return hostToolOutcome.state;
      }
      const httpToolCalls = httpCalls;
      const pendingToolStep = getPendingPlanToolStep(graphStateForLlm.taskPlan);
      if (httpToolCalls.length === 0 && hostCalls.length === 0) {
        const planRequiresToolCall =
          pendingToolStep?.kind === 'tool' &&
          !isPlanToolStepSatisfiedByObservations({
            step: pendingToolStep,
            observations: observationsForPlanSatisfaction,
            scopedTools: graphStateForLlm.scopedTools,
            taskPlan: graphStateForLlm.taskPlan,
            skillConfig: graphStateForLlm.activeSkillConfig,
            purpose: 'pre_tools_advance',
          });
        if (planRequiresToolCall) {
          if (!llmText) {
            deps.logger.warn(
              `llm plan tool step skipped without toolCalls runId=${ctx.input.runId} step=${llmStepNumber} planStep=${pendingToolStep.id}`,
            );
          }
          return {
            ...graphStateForLlm,
            iteration: nextIteration,
            steps,
            pendingToolCalls: [],
            pendingRespond: null,
          };
        }
        if (
          graphStateForLlm.taskPlan &&
          pendingToolStep?.kind === 'tool' &&
          isPlanToolStepSatisfiedByObservations({
            step: pendingToolStep,
            observations: observationsForPlanSatisfaction,
            scopedTools: graphStateForLlm.scopedTools,
            taskPlan: graphStateForLlm.taskPlan,
            skillConfig: graphStateForLlm.activeSkillConfig,
            purpose: 'pre_tools_advance',
          })
        ) {
          return {
            ...graphStateForLlm,
            iteration: nextIteration,
            steps,
            pendingToolCalls: [],
            pendingRespond: null,
          };
        }
        const emptyReply =
          '我这次没有拿到有效结果，请你换个问法，或补充更具体的条件后我再试一次。';
        if (!llmText) {
          deps.logger.warn(
            `llm returned empty content and no toolCalls runId=${
              ctx.input.runId
            } step=${llmStepNumber} model=${
              typeof responseMeta?.model_name === 'string'
                ? responseMeta.model_name
                : 'unknown'
            }`,
          );
        }
        const completion = summarize.resolveLlmCompletionAfterTools(
          ctx.input.latestUserMessage,
          llmText || emptyReply,
          graphStateForLlm,
          {
            taskPlan: graphStateForLlm.taskPlan,
            scopedTools: graphStateForLlm.scopedTools,
          },
        );
        return {
          ...graphStateForLlm,
          iteration: nextIteration,
          steps,
          pendingToolCalls: [],
          pendingRespond: pendingRespondFromObservation(
            completion?.observation ??
              summarize.buildDirectReplyObservation(
                ctx.input.latestUserMessage,
                emptyReply,
              ),
          ),
        };
      }
      if (
        isPlanComposeWriteStep(pendingToolStep) &&
        graphStateForLlm.taskPlan
      ) {
        const composeCall = pickComposeWriteToolCall(
          httpToolCalls,
          graphStateForLlm.scopedTools,
          graphStateForLlm.taskPlan,
        );
        if (composeCall) {
          const writeToolDef = graphStateForLlm.scopedTools.find(
            (tool) => tool.name === composeCall.name,
          );
          const preparedCall =
            writeToolDef != null
              ? prepareComposeWriteToolCall({
                  toolCall: composeCall,
                  writeTool: writeToolDef,
                  observations: allToolObservations(graphStateForLlm),
                  scopedTools: graphStateForLlm.scopedTools,
                  pageContext: graphStateForLlm.pageContext ?? null,
                })
              : composeCall;
          const composeObs = buildPlanComposeWriteObservation({
            toolCall: preparedCall,
            planStepId: pendingToolStep.id,
          });
          const pageContextEntityId =
            typeof graphStateForLlm.pageContext?.entity?.id === 'string'
              ? graphStateForLlm.pageContext.entity.id.trim() || null
              : null;
          const pageContextEntityType =
            typeof graphStateForLlm.pageContext?.entity?.type === 'string'
              ? graphStateForLlm.pageContext.entity.type.trim() || null
              : null;
          deps.logger.log(
            `compose_write observation stored runId=${ctx.input.runId} tool=${
              preparedCall.name
            } planStep=${pendingToolStep.id} pageContextEntityType=${
              pageContextEntityType ?? 'null'
            } pageContextEntityId=${
              pageContextEntityId ?? 'null'
            } llmArgs=${summarizeWriteArgsForGateLog(
              composeCall.arguments,
            )} preparedArgs=${summarizeWriteArgsForGateLog(
              preparedCall.arguments,
            )}`,
          );
          const planAdvance = advancePlanAfterStepComplete(
            graphStateForLlm.taskPlan,
            pendingToolStep.id,
          );
          const toolObservations = [
            ...graphStateForLlm.toolObservations,
            composeObs,
          ];
          deps.sse.emitThink(
            ctx.input.sessionId,
            ctx.input.runId,
            '参数已生成，正在整理写操作草稿…\n',
            'delta',
          );
          let stateAfterCompose: AgentGraphState = {
            ...graphStateForLlm,
            iteration: nextIteration,
            steps,
            toolObservations,
            taskPlan: planAdvance.updatedPlan,
            pendingToolCalls: [],
            pendingRespond: pendingRespondFromObservation(
              buildPlanSummarizeObservation({
                userMessage: ctx.input.latestUserMessage,
                summarizeObservation:
                  summarize.buildSummarizeObservationFromState(
                    {
                      preloadedToolObservations:
                        graphStateForLlm.preloadedToolObservations,
                      toolObservations,
                    },
                    {
                      taskPlan: planAdvance.updatedPlan,
                      scopedTools: graphStateForLlm.scopedTools,
                    },
                  ),
              }),
            ),
          };
          stateAfterCompose = skillFrame.withPlanSyncStep(
            stateAfterCompose,
            planAdvance,
            pendingToolStep.id,
            'llm',
          );
          return stateAfterCompose;
        }
        deps.logger.warn(
          `compose_write step: no allowed write tool in tool_calls runId=${ctx.input.runId} count=${httpToolCalls.length}`,
        );
        return {
          ...graphStateForLlm,
          iteration: nextIteration,
          steps,
          pendingToolCalls: [],
          pendingRespond: null,
        };
      }
      return {
        ...graphStateForLlm,
        iteration: nextIteration,
        steps,
        // 交给 tools 节点执行（本轮可能包含多个调用）。
        pendingToolCalls: applyPlanDraftToWriteToolCalls(
          httpToolCalls,
          graphStateForLlm.taskPlan,
          graphStateForLlm.scopedTools,
          resolvePlanSubmitTextForWrite({
            observations: allToolObservations(graphStateForLlm),
            artifactBlocks:
              deps.assistantArtifact.peekBlocks(
                ctx.input.sessionId,
                ctx.input.runId,
              ) ?? null,
            scopedTools: graphStateForLlm.scopedTools,
          }),
        ),
      };
    } catch (error) {
      const userMessage = buildLlmFailureUserMessage(error);
      const code = resolveLlmFailureCode(error);
      const failedLlmStepNumber = nextRunStepNumber(graphState.steps);
      deps.logger.warn(
        `llm node failed runId=${
          ctx.input.runId
        } step=${failedLlmStepNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const steps = [
        ...graphState.steps,
        {
          step: failedLlmStepNumber,
          type: 'llm' as const,
          output: runHelpers.normalizeJsonLike({
            error: true,
            content: userMessage,
          }),
          meta: { code },
        },
      ];
      await runHelpers.updateRun(
        ctx.input.runId,
        steps,
        AgentRunStatus.success,
      );
      recordMachineCodeUsage(ctx.input.runMetrics, code);
      return {
        ...graphState,
        iteration: graphState.iteration + 1,
        steps,
        pendingToolCalls: [],
        pendingRespond: pendingRespondFromObservation(
          summarize.buildDirectReplyObservation(
            ctx.input.latestUserMessage,
            userMessage,
          ),
        ),
      };
    }
  };
}
