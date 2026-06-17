import {
  skillRequiresWriteConfirmation,
  toolRequiresWriteConfirmation,
} from '../../../core/risk/risk-level.util';
import type { SkillDetailRow, SkillResponse } from '../types/skill.types';

export function toSkillResponse(row: SkillDetailRow): SkillResponse {
  const { appClient, ...agent } = row.agent;
  return {
    id: row.id,
    agentId: row.agentId,
    appClientId: agent.appClientId,
    appClientName: appClient.name,
    agentName: agent.name,
    agent,
    appClient,
    name: row.name,
    capabilityKey: row.capabilityKey,
    description: row.description,
    prompt: row.prompt,
    riskLevel: row.riskLevel,
    requiresWriteConfirmation: skillRequiresWriteConfirmation(row.riskLevel),
    config: row.config,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    skillTools: row.skillTools.map((binding) => ({
      id: binding.id,
      toolId: binding.toolId,
      isRequired: binding.isRequired,
      requiresWriteConfirmation: toolRequiresWriteConfirmation({
        riskLevel: binding.tool.riskLevel,
        agentMetadata: binding.tool.agentMetadata,
      }),
      tool: binding.tool,
    })),
    toolCount: row._count?.skillTools ?? row.skillTools.length,
    roleSkillCount: row._count?.roleSkills ?? 0,
  };
}

export function toSkillResponseList(rows: SkillDetailRow[]): SkillResponse[] {
  return rows.map((row) => toSkillResponse(row));
}
