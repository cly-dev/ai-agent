import type { AgentGraphNodeBundle, AgentGraphNodeFn } from '../types/graph.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import {
  allToolObservations,
  runOwnedToolObservations,
} from '../../../graph-tool-observations.util';
import {
  shouldAbortPlanOnRecoverableSameArgs,
  shouldAbortPlanOnTerminalToolError,
} from '../../../tool/tool-plan-error.util';
import {
  buildDuplicateSkipToolSteps,
  inferResultCheckPhase,
  type ResultCheckOutcome,
  resolvePostToolsResultCheck,
  resolvePreToolsResultCheck,
  resolveSummaryObservationForCheck,
} from '../../../tool/tool-result-check.util';
import {
  resolveResultCheckPlanFallback,
  resolveSkillStepPendingToolCalls,
  type ResultCheckRouteAuthority,
} from '../../../tool/result-check-route.util';
import { pendingRespondFromObservation } from '../../../turn/turn-respond.util';
import { pageContextEntityIdFromGraphState } from '../../../turn/turn-execution-contract.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import { summarizeAvailableSkillsForOuterPlan } from '../../plan/outer-plan-skills.util';
import {
  planObservationBucketsFromState,
  planRunContextFromState,
} from '../../plan/plan-observation-scope.util';
import {
  syncTaskPlanBeforeReAct,
  toPlanSyncAgentStep,
  type PlanSyncSite,
} from '../../plan/plan-sync.util';
import { buildPlanSessionWorkingMemory } from '../../session/session-goa-plan-projection.util';
import { resolveOuterPlan } from '../../plan/task-plan-llm.util';
import type {
  TaskPlanAdvanceResult,
  TaskPlanSnapshot,
} from '../../plan/task-plan.types';
import {
  buildPlanSummarizeObservation,
  resolveTaskPlanAdvance,
  summarizeScopedToolsForPlan,
} from '../../plan/task-plan.util';
import type { AgentGraphState, AgentRunStep } from '../../types/agent-engine.types';
import {
  applyPlanAdvanceAsWorkflowProgress,
  isWorkflowBoundRun,
} from '../../../../../workflow/workflow-plan-transition.util';
import { maybeTagWorkflowReactInternalStep } from '../../run/agent-run-audit.util';
import { patchUpstreamEntitiesAfterFetchRound } from '../../../../../entity-materialization/patch-upstream-from-fetch-round.util';

function workflowProgressPatch(
  state: AgentGraphState,
  planBefore: TaskPlanSnapshot | null,
  planAdvance: TaskPlanAdvanceResult | null,
  options?: { clearWorkflowAwaitingReact?: boolean },
): Partial<AgentGraphState> {
  if (!planBefore || !planAdvance) {
    return {};
  }
  return applyPlanAdvanceAsWorkflowProgress({
    taskPlan: state.taskPlan,
    workflowRun: state.workflowRun,
    workflowNodeDefs: state.workflowNodeDefs,
    workflowAwaitingReact: state.workflowAwaitingReact,
    planBefore,
    planAdvance,
    options,
  });
}

export function createResultCheckNode(bundle: AgentGraphNodeBundle): AgentGraphNodeFn {
  const { deps, ctx, runHelpers, skillFrame, summarize } = bundle;
  return async (state) => {
          const planBeforeReact = state.taskPlan ?? null;
          const phase = inferResultCheckPhase(state);
          const savedRoundMeta = state.lastToolRoundMeta;
          if (phase === 'post_tools' && !savedRoundMeta) {
            const fallbackStep: AgentRunStep = {
              step: nextRunStepNumber(state.steps),
              type: 'result_check',
              output: runHelpers.normalizeJsonLike({
                phase: 'post_tools',
                route: 'llm',
                reason: 'missing_tool_round_meta',
              }),
            };
            const steps = [...state.steps, fallbackStep];
            await runHelpers.updateRun(
              ctx.input.runId,
              steps,
              AgentRunStatus.running,
            );
            return {
              ...state,
              steps,
              pendingToolCalls: [],
              pendingRespond: null,
              lastToolRoundMeta: null,
            };
          }
          const observationsForResultCheck = allToolObservations(state);
          let taskPlanForCheck = state.taskPlan;
          let planAdvanceFromSync: TaskPlanAdvanceResult | null = null;
          let planSyncedAt: PlanSyncSite | null = null;
          const planSyncFromStepId = state.taskPlan?.currentStepId ?? null;
          if (phase === 'pre_tools' && state.taskPlan) {
            const synced = syncTaskPlanBeforeReAct({
              taskPlan: state.taskPlan,
              scopedTools: state.scopedTools,
              skillConfig: state.activeSkillConfig,
              observationBuckets: planObservationBucketsFromState(state),
              pageContextEntityId: pageContextEntityIdFromGraphState(state),
              workflowRun: state.workflowRun,
              workflowNodeDefs: state.workflowNodeDefs,
              workflowAwaitingReact: state.workflowAwaitingReact,
            });
            taskPlanForCheck = synced.taskPlan;
            planAdvanceFromSync = synced.planAdvance;
            if (planAdvanceFromSync) {
              planSyncedAt = 'result_check';
            }
          }
          let outcome: ResultCheckOutcome;
          if (phase === 'pre_tools') {
            outcome = resolvePreToolsResultCheck({
              pendingToolCalls: state.pendingToolCalls,
              steps: state.steps,
              taskPlan: taskPlanForCheck,
              scopedTools: state.scopedTools,
              observationBuckets: planObservationBucketsFromState(state),
              skillConfig: state.activeSkillConfig,
              pageContextEntityId: pageContextEntityIdFromGraphState(state),
            });
          } else if (savedRoundMeta) {
            const lastRoundIndex =
              savedRoundMeta.roundObservationIndices.at(-1);
            const lastRoundObservation =
              lastRoundIndex != null
                ? observationsForResultCheck[lastRoundIndex]
                : undefined;
            outcome = resolvePostToolsResultCheck({
              userMessage: ctx.input.latestUserMessage,
              observations: observationsForResultCheck,
              lastToolRoundMeta: savedRoundMeta,
              scopedTools: state.scopedTools,
              taskPlan: state.taskPlan,
              skillConfig: state.activeSkillConfig,
              skillApplied: state.skillApplied,
              hasExpandedOnce: state.hasExpandedOnce,
              iteration: state.iteration,
              totalAllowedToolCount: ctx.input.tools.length,
              writeConfirmResume: ctx.input.resumeFromWriteConfirm === true,
              isLowQualityLastObservation:
                summarize.isLowQualityToolObservation(lastRoundObservation),
            });
          } else {
            throw new Error('resultCheck: post_tools without lastToolRoundMeta');
          }

          const planAdvance =
            phase === 'post_tools' && savedRoundMeta && state.taskPlan
              ? resolveTaskPlanAdvance({
                  phase: 'post_tools',
                  plan: state.taskPlan,
                  observations: allToolObservations(state),
                  executionStatuses: savedRoundMeta.executionStatuses,
                  roundObservationIndices: savedRoundMeta.roundObservationIndices,
                  scopedTools: state.scopedTools,
                  toolCalls: savedRoundMeta.toolCalls,
                  skillConfig: state.activeSkillConfig,
                })
              : phase === 'pre_tools'
                ? planAdvanceFromSync
                : null;
          const planFallback = resolveResultCheckPlanFallback({
            outcome,
            planAdvance,
          });
          const workflowProgressOptions =
            planFallback?.action === 'llm_continue' &&
            planFallback.reason === 'plan_advance_tool_step'
              ? { clearWorkflowAwaitingReact: true as const }
              : undefined;
          const workflowPatch =
            planAdvance != null
              ? workflowProgressPatch(
                  state,
                  planBeforeReact,
                  planAdvance,
                  workflowProgressOptions,
                )
              : {};
          const taskPlanNext =
            planAdvance != null
              ? ((workflowPatch.taskPlan as TaskPlanSnapshot | null | undefined) ??
                planAdvance.updatedPlan)
              : (state.taskPlan ?? null);
          const observationsForCheck = allToolObservations(state);
          const summaryObservationForAbort =
            outcome.route === 'summarize'
              ? resolveSummaryObservationForCheck({
                  reason: outcome.reason,
                  observations: observationsForCheck,
                  savedRoundMeta,
                  mergedObservation:
                    outcome.reason === 'tool_error_summarize' ||
                    outcome.reason === 'tool_error_same_args_repeat'
                      ? null
                      : summarize.buildSummarizeObservationFromState(state, {
                          taskPlan: taskPlanNext,
                          scopedTools: state.scopedTools,
                        }),
                })
              : null;
          const abortPlanOnEmptyResults =
            outcome.reason === 'empty_tool_results' && state.taskPlan != null;
          const abortPlanOnDuplicateSummarize =
            state.taskPlan != null &&
            planAdvance == null &&
            (outcome.reason === 'duplicate_tool_call_round' ||
              outcome.reason === 'all_tool_calls_duplicate');
          const abortPlanOnToolStepExhausted =
            outcome.reason === 'plan_tool_step_exhausted' && state.taskPlan != null;
          const abortPlanOnWriteStepExhausted =
            outcome.reason === 'plan_write_step_exhausted' && state.taskPlan != null;
          const abortPlanOnTerminalToolError = shouldAbortPlanOnTerminalToolError({
            reason: outcome.reason,
            errorOutput: summaryObservationForAbort?.output,
            taskPlan: state.taskPlan,
          });
          const abortPlanOnRecoverableSameArgs = shouldAbortPlanOnRecoverableSameArgs(
            {
              reason: outcome.reason,
              taskPlan: state.taskPlan,
            },
          );
          const planAbortedOnToolError =
            abortPlanOnTerminalToolError || abortPlanOnRecoverableSameArgs;
          const planAbortedAfterCheck =
            state.planAborted === true ||
            abortPlanOnEmptyResults ||
            abortPlanOnDuplicateSummarize ||
            abortPlanOnToolStepExhausted ||
            abortPlanOnWriteStepExhausted ||
            planAbortedOnToolError;
          const taskPlanAfterCheck =
            abortPlanOnEmptyResults ||
            abortPlanOnDuplicateSummarize ||
            abortPlanOnToolStepExhausted ||
            abortPlanOnWriteStepExhausted ||
            planAbortedOnToolError
              ? null
              : taskPlanNext;

          const skipSteps =
            outcome.duplicateSkipCalls.length > 0
              ? buildDuplicateSkipToolSteps(
                  outcome.duplicateSkipCalls,
                  state.steps,
                  outcome.reason,
                )
              : [];
          const planSyncSteps: AgentRunStep[] =
            planAdvanceFromSync != null &&
            !isWorkflowBoundRun(state.workflowRun)
              ? [
                  toPlanSyncAgentStep({
                    step: nextRunStepNumber([...state.steps, ...skipSteps]),
                    planAdvance: planAdvanceFromSync,
                    fromStepId: planSyncFromStepId,
                    site: 'result_check',
                    planRunContext: planRunContextFromState(state),
                    normalizeOutput: (value) => runHelpers.normalizeJsonLike(value),
                  }),
                ]
              : [];
          const isSafetyAbortRoute =
            outcome.route === 'summarize' && planAbortedAfterCheck;
          const planRouteAuthority: ResultCheckRouteAuthority =
            planFallback?.authority ??
            (isSafetyAbortRoute ? 'safety_abort' : 'react');
          const resultCheckStep: AgentRunStep = maybeTagWorkflowReactInternalStep(
            {
              step: nextRunStepNumber([...state.steps, ...skipSteps, ...planSyncSteps]),
              type: 'result_check',
              output: runHelpers.normalizeJsonLike({
              phase: outcome.phase,
              route: outcome.route,
              reason: outcome.reason,
              duplicateSkipCount: outcome.duplicateSkipCalls.length,
              pendingToolCallCount: outcome.pendingToolCalls.length,
              supersededPendingToolCallCount:
                outcome.supersededPendingToolCallCount ?? 0,
              planAdvanceRoute: planAdvance?.route ?? null,
              planAdvanceReason: planAdvance?.reason ?? null,
              planSyncedAt,
              planRouteAuthority,
              planSupersededPendingToolCallCount:
                planFallback?.action === 'summarize'
                  ? planFallback.supersededPendingToolCallCount
                  : 0,
              planAbortedEmpty: abortPlanOnEmptyResults,
              planAbortedDuplicate: abortPlanOnDuplicateSummarize,
              planAbortedToolStepExhausted: abortPlanOnToolStepExhausted,
              planAbortedWriteStepExhausted: abortPlanOnWriteStepExhausted,
              planAbortedTerminalToolError: abortPlanOnTerminalToolError,
              planAbortedSameArgsRepeat: abortPlanOnRecoverableSameArgs,
              taskPlanStep: taskPlanAfterCheck?.currentStepId ?? null,
            }),
          },
          state,
          );
          let steps = [...state.steps, ...skipSteps, ...planSyncSteps, resultCheckStep];

          const upstreamEntityPatch =
            phase === 'post_tools' && savedRoundMeta && taskPlanNext
              ? patchUpstreamEntitiesAfterFetchRound({
                  state: { ...state, ...workflowPatch },
                  steps,
                  planBefore: planBeforeReact,
                  planAfter: taskPlanNext,
                  roundObservationIndices: savedRoundMeta.roundObservationIndices,
                  allObservations: allToolObservations(state),
                })
              : null;
          if (upstreamEntityPatch) {
            steps = upstreamEntityPatch.steps;
          }

          const emitRouteThink = (message: string): void => {
            deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, message, 'delta');
          };

          const effectiveTaskPlanNext = taskPlanNext;

          if (planFallback?.action === 'summarize' && planAdvance) {
            const summarizeObservation = summarize.buildSummarizeObservationFromState(
              state,
              {
                taskPlan: effectiveTaskPlanNext,
                scopedTools: state.scopedTools,
              },
            );
            const summaryObservation =
              resolveSummaryObservationForCheck({
                reason: planAdvance.reason,
                observations: allToolObservations(state),
                savedRoundMeta,
                mergedObservation: summarizeObservation,
              }) ??
              buildPlanSummarizeObservation({
                userMessage: ctx.input.latestUserMessage,
                summarizeObservation,
              });
            if (planAdvance.reason === 'plan_advance_summarize') {
              emitRouteThink('数据已就绪，正在按任务计划生成结果…\n');
            } else if (planAdvance.reason === 'plan_complete') {
              emitRouteThink('任务计划已完成，正在生成最终结果…\n');
            }
            await runHelpers.updateRun(
              ctx.input.runId,
              steps,
              AgentRunStatus.running,
            );
            return {
              ...state,
              ...workflowPatch,
              ...(upstreamEntityPatch ?? {}),
              steps,
              taskPlan: effectiveTaskPlanNext,
              pendingToolCalls: [],
              pendingRespond: pendingRespondFromObservation(summaryObservation),
              lastToolRoundMeta: null,
            };
          }

          if (planFallback?.action === 'skill_step') {
            emitRouteThink('进入下一技能步骤…\n');
            await runHelpers.updateRun(
              ctx.input.runId,
              steps,
              AgentRunStatus.running,
            );
            return skillFrame.applySkillFrameContext({
              ...state,
              ...workflowPatch,
              ...(upstreamEntityPatch ?? {}),
              steps,
              taskPlan: effectiveTaskPlanNext,
              pendingToolCalls: resolveSkillStepPendingToolCalls({
                pendingToolCalls: outcome.pendingToolCalls,
                taskPlan: effectiveTaskPlanNext,
                scopedTools: state.scopedTools,
              }),
              pendingRespond: null,
              lastToolRoundMeta: null,
            });
          }

          if (planFallback?.action === 'llm_continue') {
            if (planFallback.reason === 'plan_advance_tool_step') {
              emitRouteThink('进入下一任务步骤…\n');
            }
            await runHelpers.updateRun(
              ctx.input.runId,
              steps,
              AgentRunStatus.running,
            );
            return {
              ...state,
              ...workflowPatch,
              ...(upstreamEntityPatch ?? {}),
              steps,
              taskPlan: effectiveTaskPlanNext,
              pendingToolCalls: planFallback.clearPendingToolCalls
                ? []
                : outcome.pendingToolCalls,
              pendingRespond: null,
              lastToolRoundMeta: null,
            };
          }

          if (outcome.route === 'expand_tools') {
            const expandScopedTools = ctx.requestedSkillCtx
              ? ctx.requestedSkillCtx.scoped.scopedTools
              : ctx.input.tools;
            const expandedStep: AgentRunStep = {
              step: nextRunStepNumber(steps),
              type: 'intent',
              output: runHelpers.normalizeJsonLike({
                fallback: true,
                fallbackReason: outcome.reason,
                toolsBeforeExpand: state.scopedTools.length,
                toolsAfterExpand: expandScopedTools.length,
                ...(ctx.requestedSkillCtx
                  ? { requestedSkillId: ctx.requestedSkillCtx.skillId, expandSkipped: true }
                  : {}),
              }),
            };
            steps = [...steps, expandedStep];
            await runHelpers.updateRun(
              ctx.input.runId,
              steps,
              AgentRunStatus.running,
            );
            emitRouteThink(
              ctx.requestedSkillCtx
                ? '首轮结果信息不足，正在按所选技能重新规划…\n'
                : '首轮结果信息不足，正在放宽工具范围再尝试一次…\n',
            );
            const expandedSkills =
              await deps.skillService.resolveSkillsForOuterPlan({
                agentId: ctx.input.agentId,
                userId: ctx.input.userId,
                appClientId: ctx.input.appClientId,
                scopedTools: expandScopedTools,
                scopedHostToolIds:
                  state.scopedHostTools?.map((tool) => tool.id) ?? [],
                requestedSkillId: ctx.input.requestedSkillId,
              });
            const expandedRequestedSkillDetail =
              ctx.input.requestedSkillId != null
                ? expandedSkills.find((skill) => skill.id === ctx.input.requestedSkillId)
                : undefined;
            const expandedResolvedPlan = await resolveOuterPlan({
              llmService: deps.llmService,
              promptRegistry: deps.promptRegistry,
              scope: ctx.promptScope,
              planInput: {
                userMessage: ctx.input.latestUserMessage,
                scopedToolSummaries: summarizeScopedToolsForPlan(expandScopedTools),
                availableSkills: summarizeAvailableSkillsForOuterPlan(
                  expandedSkills,
                  expandScopedTools,
                  state.scopedHostTools?.map((tool) => tool.id) ?? [],
                ),
                sessionWorkingMemory: buildPlanSessionWorkingMemory({
                  goa: ctx.getSessionGoa(),
                  scopedTools: expandScopedTools,
                  runOwnedObservations: runOwnedToolObservations(state),
                }),
                requestedSkillId: ctx.input.requestedSkillId,
                requestedSkillDetail: expandedRequestedSkillDetail,
              },
            });
            const expandedBundle = ctx.requestedSkillCtx
              ? ctx.requestedSkillCtx.scoped.scopedToolBundle
              : deps.toolEngine.buildLangChainTools(expandScopedTools, {
                  ...ctx.input.toolBuildCtx,
                  allowedToolIds: expandScopedTools.map((tool) => tool.id),
                });
            return skillFrame.applySkillFrameContext({
              ...state,
              steps,
              pendingToolCalls: [],
              pendingRespond: null,
              lastToolRoundMeta: null,
              scopedTools: expandScopedTools,
              scopedLangChainTools: expandedBundle.tools,
              scopedToolBundle: expandedBundle,
              scopedAllowedToolIds: expandScopedTools.map((tool) => tool.id),
              hasExpandedOnce: true,
              taskPlan: expandedResolvedPlan.plan,
              skillApplied: false,
              activeSkillId: null,
              activeSkillPrompt: null,
              activeSkillName: null,
              activeSkillDescription: null,
              activeSkillConfig: null,
              activeSkillRiskLevel: null,
            });
          }

          if (outcome.route === 'summarize') {
            const planStepExhausted =
              outcome.reason === 'plan_tool_step_exhausted' ||
              outcome.reason === 'plan_write_step_exhausted';
            const summaryObservation = planStepExhausted
              ? null
              : summaryObservationForAbort;
            if (summaryObservation) {
              if (
                outcome.reason === 'duplicate_tool_call_round' ||
                outcome.reason === 'all_tool_calls_duplicate'
              ) {
                emitRouteThink(
                  '检测到与上一轮完全相同的工具调用，强制汇总已有结果…\n',
                );
              } else if (outcome.reason === 'empty_tool_results') {
                emitRouteThink(
                  '查询成功，但未找到符合条件的数据，正在生成说明…\n',
                );
              } else if (outcome.reason === 'tool_error_same_args_repeat') {
                emitRouteThink(
                  '参数未调整且与上次失败调用相同，正在生成说明…\n',
                );
              } else if (
                outcome.reason === 'tool_error_summarize' &&
                planAbortedOnToolError
              ) {
                emitRouteThink('工具调用失败，正在生成说明…\n');
              }
              await runHelpers.updateRun(
              ctx.input.runId,
              steps,
              AgentRunStatus.running,
              );
              return {
                ...state,
                steps,
                taskPlan: taskPlanAfterCheck,
                pendingToolCalls: [],
                pendingRespond: pendingRespondFromObservation(summaryObservation),
                lastToolRoundMeta: null,
                planAborted: planAbortedAfterCheck || undefined,
              };
            }
            const exhaustedFallback =
              outcome.reason === 'plan_write_step_exhausted'
                ? '未能按任务计划发起写操作（未生成有效的工具调用）。请确认需要提交回复或修改数据后，我再试一次。'
                : outcome.reason === 'plan_tool_step_exhausted'
                  ? '我未能按任务计划调用所需工具获取数据，请补充更具体的查询条件后我再试一次。'
                  : '我暂时无法根据已有工具结果给出汇总，请补充更具体的条件后我再试一次。';
            emitRouteThink(
              outcome.reason === 'plan_write_step_exhausted'
                ? '未能完成写操作步骤，正在生成说明…\n'
                : '无法从已有工具结果生成汇总，正在生成说明…\n',
            );
            await runHelpers.updateRun(
              ctx.input.runId,
              steps,
              AgentRunStatus.running,
            );
            return {
              ...state,
              steps,
              taskPlan: taskPlanAfterCheck,
              pendingToolCalls: [],
              pendingRespond: pendingRespondFromObservation(
                summarize.buildDirectReplyObservation(
                  ctx.input.latestUserMessage,
                  exhaustedFallback,
                ),
              ),
              lastToolRoundMeta: null,
            };
          }

          if (
            outcome.route === 'tools' &&
            outcome.reason === 'paged_gather_resume'
          ) {
            emitRouteThink(
              outcome.pagedGatherResumeKind === 'map_summary'
                ? '页内摘要未完成，正在重试（复用已拉取数据）…\n'
                : '分页数据未拉取完整，正在继续拉取…\n',
            );
            await runHelpers.updateRun(
              ctx.input.runId,
              steps,
              AgentRunStatus.running,
            );
            return {
              ...state,
              steps,
              taskPlan: taskPlanAfterCheck,
              pendingToolCalls: [],
              pendingRespond: null,
              lastToolRoundMeta: null,
            };
          }

          if (outcome.reason === 'duplicate_off_plan_step') {
            emitRouteThink('当前任务步骤需要其他工具，正在重新决策…\n');
          }
          if (outcome.reason === 'plan_tool_step_required') {
            emitRouteThink('当前任务步骤需要先调用工具，正在重新决策…\n');
          }
          if (outcome.reason === 'plan_write_step_required') {
            emitRouteThink('当前任务步骤需要执行写操作，正在重新决策…\n');
          }
          if (outcome.reason === 'plan_write_step_exhausted') {
            emitRouteThink('多次未能发起写操作，正在生成说明…\n');
          }
          if (outcome.reason === 'plan_tool_step_exhausted') {
            emitRouteThink(
              '多次未能按任务计划调用工具，正在根据已有信息生成说明…\n',
            );
          }

          await runHelpers.updateRun(
              ctx.input.runId,
              steps,
              AgentRunStatus.running,
          );

          return {
            ...state,
            ...workflowProgressPatch(state, planBeforeReact, planAdvance),
            steps,
            taskPlan: taskPlanAfterCheck,
            pendingToolCalls: outcome.pendingToolCalls,
            pendingRespond: null,
            lastToolRoundMeta: null,
          };
    
  };
}