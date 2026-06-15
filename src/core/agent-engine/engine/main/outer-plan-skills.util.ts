import type { AvailableSkillRow } from '../../../skill/skill.types';
import type { AgentEngineTool } from './agent-engine.types';
import type { OuterPlanSkillSummary } from './task-plan.types';
import { summarizeScopedToolsForPlan } from './task-plan.util';

export function summarizeAvailableSkillsForOuterPlan(
  skills: AvailableSkillRow[],
  scopedTools: AgentEngineTool[],
): OuterPlanSkillSummary[] {
  const scopedToolIdSet = new Set(scopedTools.map((tool) => tool.id));
  return skills.map((skill) => {
    const matchingTools = scopedTools.filter(
      (tool) =>
        skill.skillToolIds.includes(tool.id) && scopedToolIdSet.has(tool.id),
    );
    const toolRoles = [
      ...new Set(
        summarizeScopedToolsForPlan(matchingTools).map((tool) => tool.role),
      ),
    ];
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      capabilityKey: skill.capabilityKey,
      riskLevel: skill.riskLevel,
      toolRoles,
    };
  });
}
