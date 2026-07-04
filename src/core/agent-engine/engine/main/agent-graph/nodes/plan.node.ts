import type {
  AgentGraphNodeBundle,
  AgentGraphNodeFn,
} from '../types/graph.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import {
  allToolObservations,
  runOwnedToolObservations,
} from '../../../graph-tool-observations.util';
import {
  hasPendingRespond,
  pendingRespondFromObservation,
} from '../../../turn/turn-respond.util';
import {
  resolveTurnExecutionContract,
} from '../../../turn/turn-execution-contract.util';
import { shouldEnforceRequestedSkillFromContract } from '../../../turn/skill-intent-alignment.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import { planRunContextFromState } from '../../plan/plan-observation-scope.util';
import { buildPlanRunStepOutput } from '../../plan/plan-sync.util';
import { fromStoredTaskPlan } from '../../session/session-graph-resume.util';
import { buildPlanSessionWorkingMemory } from '../../session/session-goa-plan-projection.util';
import {
  summarizeAvailableSkillsForOuterPlan,
  toRequestedSkillPlanDetail,
} from '../../plan/outer-plan-skills.util';
import {
  resolveAutoOuterPlanSkill,
  resolveOuterPlanSkillSelectMethod,
} from '../../plan/outer-plan-skill-resolve.util';
import { resolvePlanFromContract } from '../../plan/resolve-plan-from-contract.util';
import {
  applyOuterPlanSelectMetadata,
  resolveTaskPlanInitialAdvance,
  summarizeScopedToolsForPlan,
} from '../../plan/task-plan.util';
import type {
  AgentGraphState,
  AgentRunStep,
  ToolObservation,
} from '../../types/agent-engine.types';
import { logHostToolResolve } from '../../../../../host-bridge/host-tool-resolve-debug.util';
import { collectRemovedPendingHostToolStepIds } from '../../host-tool/host-tool-plan.util';
import { tryBuildSessionResumeWorkflowSlice } from '../../../../../workflow/session-resume-workflow.util';

export function createPlanNode(bundle: AgentGraphNodeBundle): AgentGraphNodeFn {
  const { deps, ctx, runHelpers, skillFrame, summarize } = bundle;
  return async (state) => {
    const stepNum = nextRunStepNumber(state.steps);
    if (state.taskPlan) {
      return state;
    }

    const contract = resolveTurnExecutionContract(state, undefined, deps.logger);
    if (!contract.plan.enabled) {
      if (hasPendingRespond(state.pendingRespond)) {
        return state;
      }
      const step: AgentRunStep = {
        step: stepNum,
        type: 'plan',
        output: runHelpers.normalizeJsonLike({
          skipped: true,
          reason: 'plan_disabled_by_contract',
        }),
      };
      const stepsWithSkip = [...state.steps, step];
      await runHelpers.updateRun(
        ctx.input.runId,
        stepsWithSkip,
        AgentRunStatus.running,
      );
      return runHelpers.buildTurnRespondState(state, stepsWithSkip, {
        kind: 'off_domain',
        userMessage: ctx.input.latestUserMessage,
        payload: {
          routingReason:
            contract.routing.reason ?? 'plan_disabled_by_contract',
        },
      });
    }

    const sessionGoa = ctx.getSessionGoa();
    if (sessionGoa && !ctx.requestedSkillCtx) {
      const resumeDecision = await deps.resumeGate.evaluate({
        sessionId: ctx.input.sessionId,
        appClientId: ctx.input.appClientId,
        agentId: ctx.input.agentId,
        latestUserMessage: ctx.input.latestUserMessage,
        goa: sessionGoa,
        contract,
      });
      if (resumeDecision.action === 'abandon_and_fresh') {
        ctx.setSessionGoa(
          await deps.goaService.getPayload(ctx.input.sessionId),
        );
      }
      if (resumeDecision.action === 'resume') {
        const taskPlan = fromStoredTaskPlan(resumeDecision.plan);
        const planStep: AgentRunStep = {
          step: stepNum,
          type: 'plan',
          output: runHelpers.normalizeJsonLike({
            method: 'session_resume',
            activeFrameIndex: taskPlan.activeFrameIndex,
            frameCount: taskPlan.frames.length,
            source: taskPlan.source,
            deliverable: taskPlan.deliverable,
            goal: taskPlan.goal,
            stepIds: taskPlan.steps.map((step) => step.id),
            pendingStepIds: taskPlan.pendingStepIds,
            currentStepId: taskPlan.currentStepId,
            currentObjective: taskPlan.currentObjective,
            taskPhase: taskPlan.taskPhase,
            resumedFromRunId: resumeDecision.resumedFromRunId,
            followUpReason: resumeDecision.followUpReason,
          }),
        };
        const initialAdvance = resolveTaskPlanInitialAdvance({
          plan: taskPlan,
          allObservations: allToolObservations(state),
          runOwnedObservations: runOwnedToolObservations(state),
          userMessage: ctx.input.latestUserMessage,
          planRunContext: 'resume',
          buildMergedObservation: () =>
            summarize.buildSummarizeObservationFromState(state, {
              taskPlan,
              scopedTools: state.scopedTools,
            }),
        });
        const stepsWithPlan = [...state.steps, planStep];
        await runHelpers.updateRun(
          ctx.input.runId,
          stepsWithPlan,
          AgentRunStatus.running,
        );
        deps.sse.emitThink(
          ctx.input.sessionId,
          ctx.input.runId,
          '续接上次未完成任务步骤…\n',
          'replace',
        );
        if (initialAdvance) {
          const workflowSlice = tryBuildSessionResumeWorkflowSlice({
            workflowRun: resumeDecision.workflowRun,
            taskPlan: initialAdvance.updatedPlan,
          });
          return skillFrame.applySkillFrameContext({
            ...state,
            steps: stepsWithPlan,
            turnExecutionContract: contract,
            taskPlan: initialAdvance.updatedPlan,
            planRunContext: 'resume',
            pendingRespond: pendingRespondFromObservation(
              initialAdvance.summaryObservation as ToolObservation,
            ),
            ...(workflowSlice
              ? {
                  workflowRun: workflowSlice.workflowRun,
                  workflowNodeDefs: workflowSlice.workflowNodeDefs,
                  workflowAwaitingReact: workflowSlice.workflowAwaitingReact,
                }
              : {}),
          });
        }
        const workflowSlice = tryBuildSessionResumeWorkflowSlice({
          workflowRun: resumeDecision.workflowRun,
          taskPlan,
        });
        return skillFrame.applySkillFrameContext({
          ...state,
          steps: stepsWithPlan,
          turnExecutionContract: contract,
          taskPlan,
          planRunContext: 'resume',
          ...(workflowSlice
            ? {
                workflowRun: workflowSlice.workflowRun,
                workflowNodeDefs: workflowSlice.workflowNodeDefs,
                workflowAwaitingReact: workflowSlice.workflowAwaitingReact,
              }
            : {}),
        });
      }
    }

    if (!ctx.input.enableToolCall) {
      const step: AgentRunStep = {
        step: stepNum,
        type: 'plan',
        output: runHelpers.normalizeJsonLike({
          skipped: true,
          reason: 'tools_disabled',
        }),
      };
      const stepsWithSkip = [...state.steps, step];
      await runHelpers.updateRun(
        ctx.input.runId,
        stepsWithSkip,
        AgentRunStatus.running,
      );
      return runHelpers.buildTurnRespondState(state, stepsWithSkip, {
        kind: 'unsupported_scope',
        userMessage: ctx.input.latestUserMessage,
        payload: { readinessReason: 'tools_disabled' },
      });
    }

    const pageContextForPlan =
      state.pageContext ?? ctx.input.pageContext ?? null;
    const planHostBundle = await runHelpers.loadScopedHostTools(
      ctx.input,
      pageContextForPlan,
      contract.plan.explicitSkillId ?? ctx.input.requestedSkillId ?? null,
    );
    if (
      state.scopedTools.length === 0 &&
      planHostBundle.scopedHostTools.length === 0
    ) {
      logHostToolResolve('plan_skip_no_scoped_tools', {
        runId: ctx.input.runId,
        sessionId: ctx.input.sessionId,
        agentId: ctx.input.agentId,
        requestedSkillId: ctx.input.requestedSkillId ?? null,
        pageContext: pageContextForPlan,
        httpScopedToolCount: state.scopedTools.length,
        httpScopedToolNames: state.scopedTools.map((tool) => tool.name),
        hostScopedToolCount: planHostBundle.scopedHostTools.length,
        hostScopedToolNames: planHostBundle.scopedHostTools.map(
          (tool) => tool.name,
        ),
        requestedSkillToolIds:
          ctx.requestedSkillCtx?.scoped.skillToolIds ?? null,
        requestedSkillHostToolIds:
          ctx.requestedSkillCtx?.skill.hostToolIds ?? null,
      });
      const step: AgentRunStep = {
        step: stepNum,
        type: 'plan',
        output: runHelpers.normalizeJsonLike({
          skipped: true,
          reason: 'no_scoped_tools',
        }),
      };
      const stepsWithSkip = [...state.steps, step];
      await runHelpers.updateRun(
        ctx.input.runId,
        stepsWithSkip,
        AgentRunStatus.running,
      );
      return runHelpers.buildTurnRespondState(state, stepsWithSkip, {
        kind: 'unsupported_scope',
        userMessage: ctx.input.latestUserMessage,
        payload: { readinessReason: 'no_scoped_tools' },
      });
    }

    const goaForPlan =
      ctx.getSessionGoa() ??
      (await deps.goaService.getPayload(ctx.input.sessionId));

    const sessionWorkingMemory = buildPlanSessionWorkingMemory({
      goa: goaForPlan,
      scopedTools: state.scopedTools,
      runOwnedObservations: runOwnedToolObservations(state),
    });

    if (contract.plan.abandonActiveTaskOnFreshPlan) {
      if (
        goaForPlan.activeTask?.status === 'in_progress' ||
        goaForPlan.activeTask?.status === 'awaiting_confirmation'
      ) {
        await deps.goaService.abandonActiveTask(ctx.input.sessionId);
        ctx.setSessionGoa(await deps.goaService.getPayload(ctx.input.sessionId));
      }
    }

    deps.sse.emitThink(
      ctx.input.sessionId,
      ctx.input.runId,
      ctx.requestedSkillCtx
        ? '正在按所选技能规划任务步骤…\n'
        : '正在规划任务步骤…\n',
      'replace',
    );

    const availableSkills = await deps.skillService.resolveSkillsForOuterPlan({
      agentId: ctx.input.agentId,
      userId: ctx.input.userId,
      appClientId: ctx.input.appClientId,
      scopedTools: state.scopedTools,
      scopedHostToolIds: planHostBundle.scopedHostTools.map((tool) => tool.id),
      requestedSkillId: contract.plan.explicitSkillId ?? ctx.input.requestedSkillId,
    });

    const hostBundle = planHostBundle;
    const availableHostTools = hostBundle.scopedHostTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
    }));

    const requestedSkillDetail = toRequestedSkillPlanDetail(
      contract.plan.explicitSkillId != null
        ? availableSkills.find(
            (skill) => skill.id === contract.plan.explicitSkillId,
          )
        : undefined,
    );

    const scopedToolSummaries = summarizeScopedToolsForPlan(state.scopedTools);
    const scopedHostToolIds = planHostBundle.scopedHostTools.map((tool) => tool.id);
    const autoSkillSelection =
      contract.plan.skillSelect === 'page_host'
        ? resolveAutoOuterPlanSkill({
            availableSkills,
            scopedHostToolIds,
          })
        : null;

    const resolvedPlan = await resolvePlanFromContract({
      contract,
      autoSkillCandidate: autoSkillSelection,
      llmService: deps.llmService,
      promptRegistry: deps.promptRegistry,
      scope: ctx.promptScope,
      planInput: {
        userMessage: ctx.input.latestUserMessage,
        scopedToolSummaries,
        availableHostTools,
        availableSkills: summarizeAvailableSkillsForOuterPlan(
          availableSkills,
          state.scopedTools,
          planHostBundle.scopedHostTools.map((tool) => tool.id),
        ),
        sessionWorkingMemory,
        requestedSkillId: contract.plan.explicitSkillId ?? undefined,
        requestedSkillDetail,
      },
    });

    const skillSelectMeta = resolveOuterPlanSkillSelectMethod({
      autoSelection: autoSkillSelection,
      requestedSkillId: contract.plan.explicitSkillId,
      planMethod: resolvedPlan.method,
    });

    const outerSkillSelectMethod =
      resolvedPlan.outerSkillSelectMethod ??
      skillSelectMeta.outerSkillSelectMethod;
    const autoSelectedSkillId =
      resolvedPlan.autoSelectedSkillId ?? skillSelectMeta.autoSelectedSkillId;
    const taskPlan = applyOuterPlanSelectMetadata(resolvedPlan.plan, {
      outerSkillSelectMethod,
      autoSelectedSkillId,
    });

    const outerFrameCount = taskPlan.frames.length;

    const initialAdvance = resolveTaskPlanInitialAdvance({
      plan: taskPlan,
      allObservations: allToolObservations(state),
      runOwnedObservations: runOwnedToolObservations(state),
      userMessage: ctx.input.latestUserMessage,
      planRunContext: planRunContextFromState(state),
      buildMergedObservation: () =>
        summarize.buildSummarizeObservationFromState(state, {
          taskPlan,
          scopedTools: state.scopedTools,
        }),
    });
    const planState: AgentGraphState = {
      ...state,
      turnExecutionContract: contract,
      taskPlan: initialAdvance?.updatedPlan ?? taskPlan,
      scopedHostTools: hostBundle.scopedHostTools,
      scopedHostLangChainTools: hostBundle.scopedHostLangChainTools,
      skillApplied: false,
      activeSkillId: null,
      activeSkillPrompt: null,
      activeSkillName: null,
      activeSkillDescription: null,
      activeSkillConfig: null,
      activeSkillRiskLevel: null,
      pendingRespond: initialAdvance
        ? pendingRespondFromObservation(
            initialAdvance.summaryObservation as ToolObservation,
          )
        : null,
    };
    const expandedState = await skillFrame.applySkillFrameContext(planState);
    const expandedTaskPlan = expandedState.taskPlan ?? taskPlan;
    const skillFrameExpanded = expandedTaskPlan.frames.length > outerFrameCount;
    const prunedHostToolStepIds = collectRemovedPendingHostToolStepIds(
      planState.taskPlan,
      expandedTaskPlan,
    );

    const planStep: AgentRunStep = {
      step: stepNum,
      type: 'plan',
      output: runHelpers.normalizeJsonLike(
        buildPlanRunStepOutput({
          taskPlan: expandedTaskPlan,
          method: resolvedPlan.method,
          llmFallbackReason: resolvedPlan.llmFallbackReason,
          droppedHostToolStepIds: resolvedPlan.droppedHostToolStepIds,
          prunedHostToolStepIds,
          availableHostToolCount: hostBundle.scopedHostTools.length,
          availableHostToolNames: hostBundle.scopedHostTools.map(
            (tool) => tool.name,
          ),
          availableSkillIds: availableSkills.map((skill) => skill.id),
          requestedSkillId: contract.plan.explicitSkillId,
          requestedSkillEnforced: shouldEnforceRequestedSkillFromContract({
            scopedToolsSource: contract.plan.scopedToolsSource,
          }),
          sessionWorkingMemoryIncluded: sessionWorkingMemory != null,
          skillFrameExpanded,
          outerFrameCount,
          outerSkillSelectMethod,
          autoSelectedSkillId,
          turnRoute: contract.routing.route,
          turnSkillSelect: contract.plan.skillSelect,
          pageContextPlan: contract.plan.pageContextPlan,
          pageContextApplies: contract.plan.pageContextUsage.applies,
          pageContextTaskKind: contract.routing.pageContextTaskKind,
          pageContextDataSufficiency:
            contract.plan.pageContextUsage.dataSufficiency,
        }),
      ),
    };

    const stepsWithPlan = [...state.steps, planStep];
    await runHelpers.updateRun(
      ctx.input.runId,
      stepsWithPlan,
      AgentRunStatus.running,
    );
    return { ...expandedState, steps: stepsWithPlan };
  };
}
