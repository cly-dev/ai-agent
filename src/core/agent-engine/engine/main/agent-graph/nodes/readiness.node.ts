import type {
  AgentGraphNodeBundle,
  AgentGraphNodeFn,
} from '../types/graph.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import { allToolObservations } from '../../../graph-tool-observations.util';
import {
  evaluateExecutionReadiness,
  summarizeSessionObservationsForReadiness,
} from '../../../turn/turn-readiness.util';
import {
  hasPendingRespond,
  pendingRespondFromObservation,
  pendingRespondFromTurn,
} from '../../../turn/turn-respond.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import {
  planObservationBucketsFromState,
  planRunContextFromState,
} from '../../plan/plan-observation-scope.util';
import { buildSkillFrameExpandedPlanSyncStep } from '../../plan/plan-sync.util';
import {
  buildPlanSummarizeObservation,
  getPendingPlanToolStep,
  isPlanTextGenerationStep,
  isPlanWriteExecutionStepInMutationFlow,
  resolvePlanExecutionStep,
} from '../../plan/task-plan.util';
import {
  formatComposedWriteGateDiagnosticForLog,
  resolvePendingWriteForPlanWriteStepResult,
} from '../../plan-present/plan-draft-summarize.util';
import type { AgentRunStep } from '../../types/agent-engine.types';
import { maybeTagWorkflowReactInternalStep } from '../../run/agent-run-audit.util';

export function createReadinessNode(
  bundle: AgentGraphNodeBundle,
): AgentGraphNodeFn {
  const { deps, ctx, runHelpers, skillFrame, summarize } = bundle;
  return async (state) => {
    const frameCountBefore = state.taskPlan?.frames.length ?? 0;
    const stateAfterSkill = await skillFrame.applySkillFrameContext(state);
    if (hasPendingRespond(stateAfterSkill.pendingRespond)) {
      return stateAfterSkill;
    }
    const pendingPlanStep = resolvePlanExecutionStep({
      taskPlan: stateAfterSkill.taskPlan,
      workflowRun: stateAfterSkill.workflowRun,
      workflowNodeDefs: stateAfterSkill.workflowNodeDefs,
    });
    if (
      isPlanTextGenerationStep(
        pendingPlanStep.step,
        pendingPlanStep.workflowNodeAction,
      )
    ) {
      deps.sse.emitThink(
        ctx.input.sessionId,
        ctx.input.runId,
        '正在按任务计划生成结果…\n',
        'delta',
      );
      return {
        ...stateAfterSkill,
        pendingRespond: pendingRespondFromObservation(
          buildPlanSummarizeObservation({
            userMessage: ctx.input.latestUserMessage,
            summarizeObservation: summarize.buildSummarizeObservationFromState(
              stateAfterSkill,
              {
                taskPlan: stateAfterSkill.taskPlan,
                scopedTools: stateAfterSkill.scopedTools,
              },
            ),
          }),
        ),
      };
    }
    const stepNum = nextRunStepNumber(stateAfterSkill.steps);
    const pageContext =
      stateAfterSkill.pageContext ?? ctx.input.pageContext ?? null;
    const readinessResult = await evaluateExecutionReadiness({
      userMessage: ctx.input.latestUserMessage,
      taskPlan: stateAfterSkill.taskPlan,
      scopedTools: stateAfterSkill.scopedTools,
      observationBuckets: planObservationBucketsFromState(stateAfterSkill),
      skillConfig: stateAfterSkill.activeSkillConfig,
      resumeFromWriteConfirm: ctx.input.resumeFromWriteConfirm,
      llmService: deps.llmService,
      promptRegistry: deps.promptRegistry,
      scope: ctx.promptScope,
      sessionObservationSummary: summarizeSessionObservationsForReadiness(
        allToolObservations(stateAfterSkill),
      ),
      pageContext,
      pageContextUsage:
        stateAfterSkill.turnExecutionContract?.plan.pageContextUsage ?? null,
      workflowRun: stateAfterSkill.workflowRun,
    });
    const readinessStep = maybeTagWorkflowReactInternalStep(
      {
        step: stepNum,
        type: 'readiness',
        output: runHelpers.normalizeJsonLike({
          status: readinessResult.status,
          reason: readinessResult.reason,
        }),
      },
      stateAfterSkill,
    );
    const frameExpanded =
      (stateAfterSkill.taskPlan?.frames.length ?? 0) > frameCountBefore;
    const frameSyncStep =
      frameExpanded && stateAfterSkill.taskPlan
        ? (() => {
            const raw = buildSkillFrameExpandedPlanSyncStep({
              step: stepNum + 1,
              taskPlan: stateAfterSkill.taskPlan!,
              availableHostToolCount:
                stateAfterSkill.scopedHostTools?.length ?? 0,
              availableHostToolNames:
                stateAfterSkill.scopedHostTools?.map((tool) => tool.name) ?? [],
              frameCountBefore,
              planRunContext: planRunContextFromState(stateAfterSkill),
            });
            const output = runHelpers.normalizeJsonLike(raw.output);
            return {
              step: raw.step,
              type: raw.type,
              ...(output !== undefined ? { output } : {}),
            } as AgentRunStep;
          })()
        : null;
    const steps = [
      ...stateAfterSkill.steps,
      readinessStep,
      ...(frameSyncStep ? [frameSyncStep] : []),
    ];
    await runHelpers.updateRun(ctx.input.runId, steps, AgentRunStatus.running);
    const pendingToolStep = getPendingPlanToolStep(
      stateAfterSkill.taskPlan,
      stateAfterSkill.workflowRun,
    );
    if (isPlanWriteExecutionStepInMutationFlow(pendingToolStep)) {
      const reuse = resolvePendingWriteForPlanWriteStepResult({
        observations: allToolObservations(stateAfterSkill),
        taskPlan: stateAfterSkill.taskPlan,
        scopedTools: stateAfterSkill.scopedTools,
        pageContext: stateAfterSkill.pageContext ?? null,
      });
      const diagnosticDetail = reuse.gateDiagnostic
        ? formatComposedWriteGateDiagnosticForLog({
            call: reuse.call,
            failureReason: reuse.failureReason,
            diagnostic: reuse.gateDiagnostic,
          })
        : `failureReason=${reuse.failureReason ?? 'none'}`;
      deps.logger.log(
        `readiness write-fallback probe runId=${ctx.input.runId} step=${pendingToolStep.id} incomingPendingToolCalls=${stateAfterSkill.pendingToolCalls.length} reuse=${reuse.call ? 'yes' : 'no'} source=${reuse.source ?? 'none'} ${diagnosticDetail}`,
      );
    }
    if (readinessResult.status === 'respond') {
      return {
        ...stateAfterSkill,
        steps,
        pendingRespond: pendingRespondFromTurn(readinessResult.request),
      };
    }
    return { ...stateAfterSkill, steps };
  };
}
