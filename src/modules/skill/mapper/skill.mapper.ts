import {
  skillRequiresWriteConfirmation,
  toolRequiresWriteConfirmation,
} from '../../../core/risk/risk-level.util';
import { toSkillHostToolBindingResponse } from '../../host-tool/host-tool.mapper';
import type {
  SkillDetailRow,
  SkillListRow,
  SkillResponse,
} from '../types/skill.types';

function mapSkillToolBindings(
  skillTools: SkillDetailRow['skillTools'] | SkillListRow['skillTools'],
) {
  return skillTools.map((binding) => ({
    id: binding.id,
    toolId: binding.toolId,
    isRequired: binding.isRequired,
    requiresWriteConfirmation: toolRequiresWriteConfirmation({
      riskLevel: binding.tool.riskLevel,
      agentMetadata: binding.tool.agentMetadata,
    }),
    tool: binding.tool,
  }));
}

function mapSkillCore(
  row: SkillDetailRow | SkillListRow,
): Omit<
  SkillResponse,
  | 'skillTools'
  | 'skillHostTools'
  | 'hostTools'
  | 'toolCount'
  | 'hostToolCount'
  | 'roleSkillCount'
  | 'agentSkillCount'
> {
  return {
    id: row.id,
    appClientId: row.appClientId,
    appClientName: row.appClient.name,
    appClient: row.appClient,
    name: row.name,
    capabilityKey: row.capabilityKey,
    description: row.description,
    prompt: row.prompt,
    riskLevel: row.riskLevel,
    requiresWriteConfirmation: skillRequiresWriteConfirmation(row.riskLevel),
    config: row.config,
    workflowId: row.workflowId,
    workflowVersion: row.workflowVersion,
    flowId: row.flowId,
    flowVersion: row.flowVersion,
    workflowOverrides: row.workflowOverrides,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toSkillResponse(row: SkillDetailRow): SkillResponse {
  const skillHostTools = row.skillHostTools.map((binding) =>
    toSkillHostToolBindingResponse(binding),
  );
  return {
    ...mapSkillCore(row),
    skillTools: mapSkillToolBindings(row.skillTools),
    skillHostTools,
    hostTools: skillHostTools.map((binding) => binding.hostTool),
    toolCount: row._count?.skillTools ?? row.skillTools.length,
    hostToolCount: skillHostTools.length,
    roleSkillCount: row._count?.roleSkills ?? 0,
    agentSkillCount: row._count?.agentSkills ?? 0,
  };
}

export function toSkillListResponse(row: SkillListRow): SkillResponse {
  return {
    ...mapSkillCore(row),
    skillTools: mapSkillToolBindings(row.skillTools),
    skillHostTools: [],
    hostTools: [],
    toolCount: row._count?.skillTools ?? row.skillTools.length,
    hostToolCount: row._count?.skillHostTools ?? 0,
    roleSkillCount: row._count?.roleSkills ?? 0,
    agentSkillCount: row._count?.agentSkills ?? 0,
  };
}

export function toSkillResponseList(rows: SkillDetailRow[]): SkillResponse[] {
  return rows.map((row) => toSkillResponse(row));
}

export function toSkillListResponseList(rows: SkillListRow[]): SkillResponse[] {
  return rows.map((row) => toSkillListResponse(row));
}
