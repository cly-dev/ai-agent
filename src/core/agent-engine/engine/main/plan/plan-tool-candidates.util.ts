import {
  buildCompactToolInput,
} from '../../../../tool-engine/tool-decision-input.util';
import { listUserFacingRequiredParamNames } from '../../../../tool-engine/tool-user-facing-params.util';
import { parseAgentMetadata } from '../../../../tool-engine/tool-agent-metadata.util';
import type { ToolDecisionRole } from '../../../../tool-engine/tool-decision-role.enum';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';
import {
  getPendingPlanToolStep,
  isPlanStepBlockingToolScope,
  getPendingPlanHostToolStep,
  resolvePlanExecutionStep,
  resolveScopedToolRoleForPlan,
  type PlanScopedTool,
} from './task-plan.util';
import type { TaskPlanSnapshot, TaskPlanStep } from './task-plan.types';

export type PlanToolCandidateTool = PlanScopedTool & {
  inputSchema?: unknown;
  schema?: unknown;
};

export type PlanToolCandidateStrategy =
  | 'no_gather_step'
  | 'host_or_blocked'
  | 'plan_pinned_tool'
  | 'single_role_match'
  | 'broad_list_preferred'
  | 'list_operation_preferred'
  | 'role_match_all'
  | 'fallback_scoped';

export type PlanToolCandidateResolveResult<T extends PlanToolCandidateTool> = {
  candidates: T[];
  strategy: PlanToolCandidateStrategy;
  planStepId: string | null;
  toolRole: ToolDecisionRole | null;
};

export type PlanToolRequiredParamGroup = {
  toolNames: string[];
  fields: string[];
};

export function listUserFacingRequiredParamsForTool(
  tool: PlanToolCandidateTool,
): string[] {
  const compact = buildCompactToolInput(
    tool.inputSchema,
    tool.schema,
    tool.agentMetadata,
  );
  return listUserFacingRequiredParamNames(compact);
}

export function groupPlanToolsByRequiredParams<T extends PlanToolCandidateTool>(
  tools: T[],
): PlanToolRequiredParamGroup[] {
  const bySignature = new Map<string, PlanToolRequiredParamGroup>();
  for (const tool of tools) {
    const fields = listUserFacingRequiredParamsForTool(tool);
    const signature = fields.join('\0');
    const existing = bySignature.get(signature);
    if (existing) {
      existing.toolNames.push(tool.name);
      continue;
    }
    bySignature.set(signature, { toolNames: [tool.name], fields });
  }
  return [...bySignature.values()];
}

function isBroadListGatherStep(
  taskPlan: TaskPlanSnapshot | null | undefined,
  step: TaskPlanStep,
): boolean {
  if (step.kind !== 'tool' || step.toolRole !== 'read-list') {
    return false;
  }
  const deliverable = taskPlan?.deliverable;
  return deliverable === 'analysis' || deliverable === 'list';
}

function preferListOperationTools<T extends PlanToolCandidateTool>(
  tools: T[],
): T[] {
  const listTools = tools.filter((tool) => {
    const meta = parseAgentMetadata(tool.agentMetadata);
    return meta?.operation === 'LIST';
  });
  return listTools.length > 0 ? listTools : tools;
}

/**
 * 解析当前 plan gather 步的 HTTP 工具候选面（tool_resolve SSOT）。
 * 不用 businessFields；按 toolRole + schema 必填 + deliverable 收窄。
 */
export function resolvePlanToolCandidates<T extends PlanToolCandidateTool>(input: {
  scopedTools: T[];
  taskPlan?: TaskPlanSnapshot | null;
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
}): PlanToolCandidateResolveResult<T> {
  const { step: executionStep, workflowNodeAction } = resolvePlanExecutionStep({
    taskPlan: input.taskPlan,
    workflowRun: input.workflowRun,
    workflowNodeDefs: input.workflowNodeDefs,
  });
  if (isPlanStepBlockingToolScope(executionStep, workflowNodeAction)) {
    return {
      candidates: [],
      strategy: 'host_or_blocked',
      planStepId: executionStep?.id ?? null,
      toolRole: executionStep?.toolRole ?? null,
    };
  }
  if (getPendingPlanHostToolStep(input.taskPlan, input.workflowRun)) {
    return {
      candidates: [],
      strategy: 'host_or_blocked',
      planStepId: input.taskPlan?.currentStepId ?? null,
      toolRole: null,
    };
  }

  const step = getPendingPlanToolStep(input.taskPlan, input.workflowRun);
  if (!step || step.kind !== 'tool' || !step.toolRole) {
    if (step?.kind === 'tool' && step.pinnedToolNames?.length) {
      const pinned = input.scopedTools.filter((tool) =>
        step.pinnedToolNames!.includes(tool.name),
      );
      if (pinned.length > 0) {
        return {
          candidates: pinned,
          strategy: 'plan_pinned_tool',
          planStepId: step.id,
          toolRole: step.toolRole ?? null,
        };
      }
    }
    return {
      candidates: input.scopedTools,
      strategy: 'no_gather_step',
      planStepId: step?.id ?? null,
      toolRole: step?.toolRole ?? null,
    };
  }

  const pinnedNames = step.pinnedToolNames;
  if (pinnedNames && pinnedNames.length > 0) {
    const pinned = input.scopedTools.filter((tool) =>
      pinnedNames.includes(tool.name),
    );
    if (pinned.length > 0) {
      return {
        candidates: pinned,
        strategy: 'plan_pinned_tool',
        planStepId: step.id,
        toolRole: step.toolRole,
      };
    }
  }

  const roleMatched = input.scopedTools.filter(
    (tool) => resolveScopedToolRoleForPlan(tool) === step.toolRole,
  );
  if (roleMatched.length === 0) {
    return {
      candidates: input.scopedTools,
      strategy: 'fallback_scoped',
      planStepId: step.id,
      toolRole: step.toolRole,
    };
  }
  if (roleMatched.length === 1) {
    return {
      candidates: roleMatched,
      strategy: 'single_role_match',
      planStepId: step.id,
      toolRole: step.toolRole,
    };
  }

  if (isBroadListGatherStep(input.taskPlan, step)) {
    const broad = roleMatched.filter(
      (tool) => listUserFacingRequiredParamsForTool(tool).length === 0,
    );
    if (broad.length > 0) {
      const narrowed = preferListOperationTools(broad);
      return {
        candidates: narrowed,
        strategy: 'broad_list_preferred',
        planStepId: step.id,
        toolRole: step.toolRole,
      };
    }
  }

  if (step.toolRole === 'read-list') {
    const listOps = preferListOperationTools(roleMatched);
    const withoutUserRequired = listOps.filter(
      (tool) => listUserFacingRequiredParamsForTool(tool).length === 0,
    );
    if (withoutUserRequired.length > 0) {
      return {
        candidates: withoutUserRequired,
        strategy: 'list_operation_preferred',
        planStepId: step.id,
        toolRole: step.toolRole,
      };
    }
    if (listOps.length < roleMatched.length) {
      return {
        candidates: listOps,
        strategy: 'list_operation_preferred',
        planStepId: step.id,
        toolRole: step.toolRole,
      };
    }
  }

  return {
    candidates: roleMatched,
    strategy: 'role_match_all',
    planStepId: step.id,
    toolRole: step.toolRole,
  };
}

export function resolvePlanStepToolCandidatesFromState<T extends PlanToolCandidateTool>(
  state: {
    planStepToolCandidates?: T[] | null;
    planStepToolCandidateStrategy?: PlanToolCandidateStrategy | null;
    scopedTools: T[];
    taskPlan?: TaskPlanSnapshot | null;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
  },
): PlanToolCandidateResolveResult<T> {
  if (state.planStepToolCandidates && state.planStepToolCandidates.length > 0) {
    const currentStepId = state.taskPlan?.currentStepId ?? null;
    return {
      candidates: state.planStepToolCandidates,
      strategy: state.planStepToolCandidateStrategy ?? 'role_match_all',
      planStepId: currentStepId,
      toolRole:
        state.taskPlan?.steps.find((row) => row.id === currentStepId)
          ?.toolRole ?? null,
    };
  }
  return resolvePlanToolCandidates(state);
}
