import type { ToolObservation } from '../main/agent-engine.types';
import {
  getPendingPlanToolStep,
  isPendingPlanAnswerStep,
  isPlanToolStepSatisfiedByObservations,
  listBusinessFieldsForPlanGatherStep,
  type PlanScopedTool,
} from '../main/task-plan.util';
import {
  selectObservationsForPlanToolSatisfaction,
  type PlanObservationBuckets,
} from '../main/plan-observation-scope.util';
import type { TaskPlanSnapshot } from '../main/task-plan.types';
import type { LlmService } from '../../../llm/llm.service';
import type { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import {
  evaluateReadinessSlotsWithLlm,
  isReadinessSlotLlmEnabled,
  normalizeMissingFieldsFromLlm,
} from './turn-readiness-llm.util';
import type {
  TurnReadinessResult,
  TurnRespondRequest,
} from './turn-respond.types';

export function isTurnReadinessEnabled(): boolean {
  const raw = process.env.AGENT_TURN_READINESS?.trim();
  return raw !== '0' && raw !== 'false';
}

export type EvaluateExecutionReadinessInput = {
  userMessage: string;
  taskPlan?: TaskPlanSnapshot | null;
  scopedTools: PlanScopedTool[];
  skillConfig?: unknown;
  resumeFromWriteConfirm?: boolean;
  llmService?: LlmService;
  promptRegistry?: PromptRegistryService;
  scope?: { appClientId: number; agentId: number };
  sessionObservationSummary?: string | null;
  observationBuckets: PlanObservationBuckets;
};

function ready(reason: string): TurnReadinessResult {
  return { status: 'ready', reason };
}

function respond(
  reason: string,
  request: TurnRespondRequest,
): TurnReadinessResult {
  return { status: 'respond', reason, request };
}

/** Plan 之后：判断当前 gather 步是否具备执行条件（槽位 / observation），不做对话意图判断。 */
export async function evaluateExecutionReadiness(
  input: EvaluateExecutionReadinessInput,
): Promise<TurnReadinessResult> {
  if (!isTurnReadinessEnabled()) {
    return ready('disabled');
  }
  if (input.resumeFromWriteConfirm) {
    return ready('write_confirm_resume');
  }

  const userMessage = input.userMessage.trim();
  const plan = input.taskPlan;
  if (!plan || isPendingPlanAnswerStep(plan)) {
    return ready('plan_answer_or_missing');
  }

  const gatherStep = getPendingPlanToolStep(plan);
  if (!gatherStep || gatherStep.kind !== 'tool') {
    return ready('no_gather_step');
  }

  if (input.scopedTools.length === 0) {
    return respond('unsupported_scope', {
      kind: 'unsupported_scope',
      userMessage,
      payload: { readinessReason: 'no_scoped_tools' },
    });
  }

  const satisfactionObservations = selectObservationsForPlanToolSatisfaction(
    input.observationBuckets,
  );
  if (
    isPlanToolStepSatisfiedByObservations({
      step: gatherStep,
      observations: satisfactionObservations,
      scopedTools: input.scopedTools,
      taskPlan: plan,
      skillConfig: input.skillConfig,
      purpose: 'pre_tools_advance',
    })
  ) {
    return ready('observation_satisfied');
  }

  const requiredFields = listBusinessFieldsForPlanGatherStep(
    gatherStep,
    input.scopedTools,
  );
  if (requiredFields.length === 0) {
    return ready('no_business_fields');
  }

  if (
    !isReadinessSlotLlmEnabled() ||
    !input.llmService ||
    !input.promptRegistry ||
    !input.scope
  ) {
    return ready('slot_llm_disabled');
  }

  const slotResult = await evaluateReadinessSlotsWithLlm({
    llmService: input.llmService,
    promptRegistry: input.promptRegistry,
    scope: input.scope,
    userMessage,
    planGoal: plan.goal,
    currentObjective: plan.currentObjective,
    requiredFields,
    sessionObservationSummary: input.sessionObservationSummary ?? null,
  });

  if (slotResult.ready) {
    return ready('slots_ready');
  }

  const missingFields = normalizeMissingFieldsFromLlm(slotResult.missingFields);
  if (missingFields.length === 0) {
    return ready('slots_ready_empty_missing');
  }

  return respond('missing_business_fields', {
    kind: 'clarification',
    userMessage,
    payload: {
      missingFields,
      planStepId: gatherStep.id,
      toolRole: gatherStep.toolRole,
      readinessReason: 'missing_business_fields',
    },
  });
}

export function summarizeSessionObservationsForReadiness(
  observations: ToolObservation[],
  maxItems = 3,
): string | null {
  if (observations.length === 0) {
    return null;
  }
  const tail = observations.slice(-maxItems);
  const lines = tail.map((row) => {
    const args = row.llmPayload?.args;
    const argsText =
      args && typeof args === 'object'
        ? JSON.stringify(args)
        : '';
    return `- tool=${row.name}${argsText ? ` args=${argsText}` : ''}`;
  });
  return lines.join('\n');
}
