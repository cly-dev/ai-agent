import type { AvailableSkillRow } from '../../../../skill/skill.types';
import type { AgentEngineTool } from '../types/agent-engine.types';
import type {
  OuterPlanSkillSummary,
  ResolveOuterPlanInput,
} from './task-plan.types';
import { summarizeScopedToolsForPlan } from './task-plan.util';

export function toRequestedSkillPlanDetail(
  skill: AvailableSkillRow | undefined,
): ResolveOuterPlanInput['requestedSkillDetail'] {
  if (!skill) {
    return undefined;
  }
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    config: skill.config,
    riskLevel: skill.riskLevel,
    skillToolIds: skill.skillToolIds,
    hostToolIds: skill.hostToolIds,
  };
}

export function summarizeAvailableSkillsForOuterPlan(
  skills: AvailableSkillRow[],
  scopedTools: AgentEngineTool[],
  scopedHostToolIds?: number[],
): OuterPlanSkillSummary[] {
  const scopedToolIdSet = new Set(scopedTools.map((tool) => tool.id));
  const scopedHostToolIdSet = new Set(scopedHostToolIds ?? []);
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
    const hostToolIds =
      scopedHostToolIdSet.size > 0
        ? skill.hostToolIds.filter((hostToolId) =>
            scopedHostToolIdSet.has(hostToolId),
          )
        : skill.hostToolIds;
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      capabilityKey: skill.capabilityKey,
      riskLevel: skill.riskLevel,
      toolRoles,
      hostToolIds,
      runnableKind: skill.runnableKind,
    };
  });
}
