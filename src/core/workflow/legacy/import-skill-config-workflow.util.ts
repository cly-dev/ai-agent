import { parseSkillPlanConfig } from '../../agent-engine/engine/main/plan/task-plan.util';
import { compileTaskPlanToWorkflowNodes } from '../compile-plan-to-workflow.util';
import type { WorkflowNodeDef } from '../workflow.types';

/**
 * @deprecated LEGACY 迁移工具 — 将 Skill.config.workflow 编译为 WorkflowNodeDef。
 * 新 Skill 请绑定 Skill.workflowId；运行时不应再走 config.workflow 主路径。
 */
/** 将 Skill.config.workflow.steps（旧 TaskPlan 形态）编译为 WorkflowNodeDef[]（迁移用）。 */
export function importSkillConfigWorkflowNodes(
  skillConfig: unknown,
): WorkflowNodeDef[] {
  const parsed = parseSkillPlanConfig(skillConfig);
  if (!parsed.workflowSteps?.length) {
    return [];
  }
  return compileTaskPlanToWorkflowNodes(parsed.workflowSteps);
}

export function importSkillConfigWorkflowDeliverable(
  skillConfig: unknown,
): string | null {
  const parsed = parseSkillPlanConfig(skillConfig);
  return parsed.deliverable ?? null;
}
