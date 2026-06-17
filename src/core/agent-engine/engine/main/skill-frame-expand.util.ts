import type { LlmService } from '../../../llm/llm.service';
import type { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import type { SkillService } from '../../../skill/skill.service';
import type { AvailableSkillRow } from '../../../skill/skill.types';
import { RequestedSkillRunError } from './requested-skill-run.error';
import type { ToolBuildContext } from '../../../tool-engine/tool-engine.service';
import type { AgentEngineTool } from './agent-engine.types';
import type { PlanFrame } from './plan-stack.types';
import {
  applyActiveFrameStepComplete,
  isPendingSkillEntryStep,
  isSkillFrameActiveForPendingStep,
  pushPlanFrame,
  syncPlanFromActiveFrame,
} from './plan-stack.util';
import { resolveTaskPlan } from './task-plan-llm.util';
import type { TaskPlanSnapshot } from './task-plan.types';
import { summarizeScopedToolsForPlan } from './task-plan.util';

export type SkillFrameExpandResult = {
  plan: TaskPlanSnapshot;
  scopedTools: AgentEngineTool[];
  scopedAllowedToolIds: number[];
  scopedToolBundle: ReturnType<SkillService['bindSkillToScopedTools']>['scopedToolBundle'];
  skill: AvailableSkillRow | null;
};

function getPendingSkillStep(plan: TaskPlanSnapshot) {
  const stepId = plan.pendingStepIds[0] ?? plan.currentStepId;
  if (!stepId) {
    return null;
  }
  const step = plan.steps.find((row) => row.id === stepId);
  if (step?.kind !== 'skill' || step.skillId == null) {
    return null;
  }
  return step;
}

/** 内层 skill 帧已展开时，用帧内缓存重建 skill 行，避免每轮 ReAct 重复查库。 */
function skillRowFromActiveFrame(
  frame: PlanFrame,
  scopedTools: AgentEngineTool[],
): AvailableSkillRow | null {
  if (!frame.skillId || !frame.skillName) {
    return null;
  }
  return {
    id: frame.skillId,
    name: frame.skillName,
    description: frame.skillDescription ?? null,
    prompt: frame.skillPrompt ?? '',
    config: frame.skillConfig ?? null,
    riskLevel: frame.skillRiskLevel ?? 'L1',
    capabilityKey: null,
    skillToolIds: scopedTools.map((tool) => tool.id),
  };
}

function innerFrameFromSkillPlan(input: {
  skill: AvailableSkillRow;
  parentSkillStepId: string;
  innerPlan: TaskPlanSnapshot;
}): PlanFrame {
  return {
    frameId: `${input.parentSkillStepId}:skill:${input.skill.id}`,
    skillId: input.skill.id,
    skillName: input.skill.name,
    source: input.innerPlan.source,
    steps: input.innerPlan.steps,
    pendingStepIds: [...input.innerPlan.pendingStepIds],
    completedStepIds: [...input.innerPlan.completedStepIds],
    taskPhase: input.innerPlan.taskPhase,
    currentObjective: input.innerPlan.currentObjective,
    currentStepId: input.innerPlan.currentStepId,
    parentSkillStepId: input.parentSkillStepId,
    skillPrompt: input.skill.prompt,
    skillDescription: input.skill.description,
    skillConfig: input.skill.config,
    skillRiskLevel: input.skill.riskLevel,
  };
}

/**
 * 遇到外层 kind=skill 步时，展开 skill 内层 steps 并 push 新帧。
 * 内层步序来自 resolveTaskPlan（workflow / 模板 / 内层 Plan LLM）。
 */
export async function expandPendingSkillStepIfNeeded(input: {
  plan: TaskPlanSnapshot;
  scopedTools: AgentEngineTool[];
  toolBuildCtx: ToolBuildContext;
  skillService: SkillService;
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  agentId: number;
  userId: number;
  appClientId: number;
  /** 用户指定 skillId 时，展开失败须中止 run，不可静默跳过 skill 步。 */
  enforceRequestedSkill?: boolean;
}): Promise<SkillFrameExpandResult> {
  const base = {
    plan: input.plan,
    scopedTools: input.scopedTools,
    scopedAllowedToolIds: input.scopedTools.map((tool) => tool.id),
    scopedToolBundle: input.skillService.bindSkillToScopedTools(
      { skillToolIds: input.scopedTools.map((tool) => tool.id) },
      input.scopedTools,
      input.toolBuildCtx,
    ).scopedToolBundle,
    skill: null as AvailableSkillRow | null,
  };

  if (!isPendingSkillEntryStep(input.plan)) {
    return base;
  }
  if (isSkillFrameActiveForPendingStep(input.plan)) {
    const frame = input.plan.frames[input.plan.activeFrameIndex];
    const skillRow = skillRowFromActiveFrame(frame, input.scopedTools);
    if (!skillRow) {
      return base;
    }
    const bind = input.skillService.bindSkillToScopedTools(
      skillRow,
      input.scopedTools,
      input.toolBuildCtx,
    );
    return {
      plan: input.plan,
      scopedTools: bind.scopedTools,
      scopedAllowedToolIds: bind.scopedAllowedToolIds,
      scopedToolBundle: bind.scopedToolBundle,
      skill: skillRow,
    };
  }

  const skillStep = getPendingSkillStep(input.plan);
  if (!skillStep?.skillId) {
    return base;
  }

  const skill = await input.skillService.getAvailableSkillById({
    agentId: input.agentId,
    userId: input.userId,
    appClientId: input.appClientId,
    skillId: skillStep.skillId,
    scopedTools: input.scopedTools,
  });
  if (!skill) {
    if (input.enforceRequestedSkill) {
      const skillId = skillStep.skillId;
      throw new RequestedSkillRunError(
        'SKILL_EXPAND_FAILED',
        `requested skill ${skillId} could not be expanded into scoped tools`,
      );
    }
    return {
      ...base,
      plan: syncPlanFromActiveFrame(
        applyActiveFrameStepComplete(input.plan, skillStep.id),
      ),
    };
  }

  const bind = input.skillService.bindSkillToScopedTools(
    skill,
    input.scopedTools,
    input.toolBuildCtx,
  );
  const scopedSummaries = summarizeScopedToolsForPlan(bind.scopedTools);
  const innerResolved = await resolveTaskPlan({
    llmService: input.llmService,
    promptRegistry: input.promptRegistry,
    scope: input.scope,
    planInput: {
      userMessage: input.plan.originalUserRequest,
      scopedToolSummaries: scopedSummaries,
      skillApplied: true,
      skillName: skill.name,
      skillDescription: skill.description,
      skillConfig: skill.config,
      skillRiskLevel: skill.riskLevel,
      skillPrompt: skill.prompt,
    },
  });
  const innerPlan = innerResolved.plan;

  const childFrame = innerFrameFromSkillPlan({
    skill,
    parentSkillStepId: skillStep.id,
    innerPlan,
  });

  const plan = pushPlanFrame(input.plan, childFrame);

  return {
    plan: syncPlanFromActiveFrame(plan),
    scopedTools: bind.scopedTools,
    scopedAllowedToolIds: bind.scopedAllowedToolIds,
    scopedToolBundle: bind.scopedToolBundle,
    skill,
  };
}
