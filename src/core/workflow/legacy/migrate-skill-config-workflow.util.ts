import { WorkflowDeliverable } from '../../../../generated/prisma/client';
import {
  importSkillConfigWorkflowDeliverable,
  importSkillConfigWorkflowNodes,
} from './import-skill-config-workflow.util';
import { validateWorkflowDefinition } from '../validate-workflow.util';
import type {
  WorkflowBindingRefs,
  WorkflowNodeDef,
  WorkflowValidationIssue,
} from '../workflow.types';

export type SkillWorkflowBindingInput = {
  toolId: number;
  isRequired: boolean;
};

export type SkillWorkflowHostBindingInput = {
  hostToolId: number;
  isRequired: boolean;
};

export type SkillWorkflowMigrationInput = {
  skillId: number;
  skillName: string;
  capabilityKey: string | null;
  config: unknown;
  toolBindings: SkillWorkflowBindingInput[];
  hostToolBindings: SkillWorkflowHostBindingInput[];
};

export type SkillWorkflowMigrationPlan = {
  workflowKey: string;
  name: string;
  goal: string | null;
  deliverable: WorkflowDeliverable;
  nodes: WorkflowNodeDef[];
  tools: SkillWorkflowBindingInput[];
  hostTools: SkillWorkflowHostBindingInput[];
  validationIssues: WorkflowValidationIssue[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Skill.config 是否仍含可迁移的 legacy workflow.steps。 */
export function hasLegacySkillConfigWorkflow(config: unknown): boolean {
  return importSkillConfigWorkflowNodes(config).length > 0;
}

/** 生成迁移后 Workflow.workflowKey（appClient 内唯一）。 */
export function buildMigratedWorkflowKey(input: {
  skillId: number;
  capabilityKey: string | null;
  skillName: string;
}): string {
  const fromCapability = input.capabilityKey?.trim();
  if (fromCapability) {
    const sanitized = fromCapability
      .replace(/[^a-zA-Z0-9._-]+/g, '.')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+|\.+$/g, '');
    if (sanitized.length > 0) {
      return `skill.${sanitized}`.slice(0, 200);
    }
  }
  const fromName = input.skillName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '');
  if (fromName.length > 0) {
    return `skill.${fromName}`.slice(0, 180) + `.${input.skillId}`;
  }
  return `skill.migrated.${input.skillId}`;
}

/** 将 legacy TaskDeliverable 映射为 DB WorkflowDeliverable。 */
export function mapLegacyDeliverableToWorkflowDeliverable(
  deliverable: string | null | undefined,
): WorkflowDeliverable {
  switch (deliverable?.trim().toLowerCase()) {
    case 'mutation':
      return WorkflowDeliverable.mutation;
    case 'analysis':
    case 'list':
      return WorkflowDeliverable.analysis;
    case 'answer':
    case 'detail':
    default:
      return WorkflowDeliverable.answer;
  }
}

function sortBindingsByRequired<T extends { isRequired: boolean }>(
  rows: T[],
): T[] {
  return [...rows].sort((left, right) => {
    if (left.isRequired === right.isRequired) {
      return 0;
    }
    return left.isRequired ? -1 : 1;
  });
}

function toBindingRefs(
  tools: SkillWorkflowBindingInput[],
  hostTools: SkillWorkflowHostBindingInput[],
): WorkflowBindingRefs {
  return {
    toolIds: tools.map((row) => row.toolId),
    hostToolIds: hostTools.map((row) => row.hostToolId),
  };
}

/** 为迁移节点补齐 toolId / hostToolId（legacy compile 常留空或 0）。 */
export function enrichMigratedWorkflowNodes(
  nodes: WorkflowNodeDef[],
  bindings: WorkflowBindingRefs,
): WorkflowNodeDef[] {
  const toolIds = bindings.toolIds.filter((id) => id > 0);
  const hostToolIds = bindings.hostToolIds.filter((id) => id > 0);
  let toolCursor = 0;

  const pickToolId = (): number | undefined => {
    if (toolIds.length === 0) {
      return undefined;
    }
    const picked = toolIds[Math.min(toolCursor, toolIds.length - 1)];
    toolCursor += 1;
    return picked;
  };

  return nodes.map((node) => {
    const rawInput: Record<string, unknown> = isRecord(node.input)
      ? { ...node.input }
      : {};
    if (
      node.action === 'fetch_data' ||
      node.action === 'compose_mutation' ||
      node.action === 'write_data'
    ) {
      const hasToolId =
        typeof rawInput.toolId === 'number' && rawInput.toolId > 0;
      const hasDefinitionKey =
        typeof rawInput.definitionKey === 'string' &&
        rawInput.definitionKey.trim().length > 0;
      if (!hasToolId && !hasDefinitionKey) {
        const toolId = pickToolId();
        if (toolId != null) {
          rawInput.toolId = toolId;
        }
      }
    }
    if (node.action === 'generate_and_push') {
      const hostToolId = rawInput.hostToolId;
      const missingHostToolId =
        typeof hostToolId !== 'number' || !Number.isInteger(hostToolId) || hostToolId <= 0;
      if (missingHostToolId && hostToolIds[0] != null) {
        rawInput.hostToolId = hostToolIds[0];
      }
    }
    return {
      ...node,
      input: rawInput as WorkflowNodeDef['input'],
    };
  });
}

function readMigrationGoal(config: unknown): string | null {
  if (!isRecord(config)) {
    return null;
  }
  const workflow = isRecord(config.workflow) ? config.workflow : null;
  return readNonEmptyString(config.goal) ?? readNonEmptyString(workflow?.goal);
}

/** 构建单条 Skill 的 Workflow 迁移计划（纯函数，可单测）。 */
export function buildSkillWorkflowMigrationPlan(
  input: SkillWorkflowMigrationInput,
): SkillWorkflowMigrationPlan | null {
  const baseNodes = importSkillConfigWorkflowNodes(input.config);
  if (baseNodes.length === 0) {
    return null;
  }

  const tools = sortBindingsByRequired(input.toolBindings);
  const hostTools = sortBindingsByRequired(input.hostToolBindings);
  const bindings = toBindingRefs(tools, hostTools);
  const nodes = enrichMigratedWorkflowNodes(baseNodes, bindings);
  const workflowKey = buildMigratedWorkflowKey({
    skillId: input.skillId,
    capabilityKey: input.capabilityKey,
    skillName: input.skillName,
  });
  const deliverable = mapLegacyDeliverableToWorkflowDeliverable(
    importSkillConfigWorkflowDeliverable(input.config),
  );
  const validationIssues = validateWorkflowDefinition({
    definition: {
      workflowKey,
      name: input.skillName.trim() || `Skill ${input.skillId}`,
      profile: 'chat_skill',
      goal: readMigrationGoal(input.config),
      constraints: [],
      nodes,
    },
    bindings,
  });

  return {
    workflowKey,
    name: input.skillName.trim() || `Skill ${input.skillId}`,
    goal: readMigrationGoal(input.config),
    deliverable,
    nodes,
    tools,
    hostTools,
    validationIssues,
  };
}

/** 从 Skill.config 移除 legacy workflow 块，保留其余字段。 */
export function stripLegacySkillConfigWorkflow(
  config: unknown,
): Record<string, unknown> | null {
  if (!isRecord(config)) {
    return null;
  }
  if (!('workflow' in config)) {
    return { ...config };
  }
  const next = { ...config };
  delete next.workflow;
  return next;
}

/** workflowKey 冲突时追加 skillId 后缀。 */
export function resolveMigratedWorkflowKeyConflict(
  workflowKey: string,
  skillId: number,
): string {
  const suffix = `.skill${skillId}`;
  const maxBase = 200 - suffix.length;
  const base = workflowKey.slice(0, Math.max(1, maxBase));
  return `${base}${suffix}`;
}
