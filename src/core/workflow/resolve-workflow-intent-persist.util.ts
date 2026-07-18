import { compileWorkflowIr } from './compile-workflow-ir.util';
import { materializeWorkflowGraphFromIr } from './materialize-workflow-graph-from-ir.util';
import type { WorkflowIntent } from './workflow-intent.types';
import { WORKFLOW_INTENT_VERSION } from './workflow-intent.types';
import type { WorkflowIrDocument } from './workflow-ir.types';
import { validateWorkflowIrTopology } from './validate-workflow-ir-topology.util';
import {
  parseWorkflowIntentJson,
  validateWorkflowIntent,
} from './validate-workflow-intent.util';
import {
  expandWorkflowPresetToIntent,
  parseWorkflowPresetConfig,
} from './workflow-preset.util';
import type { WorkflowPresetKind } from './workflow-preset.types';
import type { WorkflowEdge, WorkflowNodeDef, WorkflowProfile } from './workflow.types';

export type ResolvedWorkflowIntentPersist = {
  intent: WorkflowIntent;
  /** 新 IR（Flow.ir 真源） */
  ir: WorkflowIrDocument;
  /** 过渡：供现行 runtime / 绑定推导 */
  legacyGraph: {
    nodes: WorkflowNodeDef[];
    edges: WorkflowEdge[];
    entryNodeId: string;
  };
};

/**
 * Admin 保存路径：preset|intent → 校验 → 新 IR；并降低为 legacy 图供过渡 runtime。
 */
export function resolveWorkflowIntentForPersist(input: {
  profile: WorkflowProfile;
  preset?: WorkflowPresetKind;
  presetConfig?: Record<string, unknown>;
  intent?: unknown;
}): ResolvedWorkflowIntentPersist {
  if (input.preset != null && input.intent != null) {
    throw Object.assign(
      new Error('Provide either preset or intent, not both'),
      { code: 'WORKFLOW_PRESET_INTENT_CONFLICT' },
    );
  }

  let intent: WorkflowIntent;
  if (input.preset != null) {
    intent = expandWorkflowPresetToIntent({
      preset: input.preset,
      profile: input.profile,
      config: parseWorkflowPresetConfig(input.presetConfig),
    });
  } else if (input.intent != null) {
    const parsed = parseWorkflowIntentJson(input.intent);
    if (!parsed) {
      throw Object.assign(
        new Error(
          `intent must be WorkflowIntent version ${WORKFLOW_INTENT_VERSION}`,
        ),
        { code: 'WORKFLOW_INTENT_INVALID' },
      );
    }
    intent = { ...parsed, profile: input.profile };
  } else {
    throw Object.assign(
      new Error('Create/update requires intent or preset + presetConfig'),
      { code: 'WORKFLOW_INTENT_REQUIRED' },
    );
  }

  const issues = validateWorkflowIntent(intent);
  if (issues.length > 0) {
    throw Object.assign(new Error('Workflow intent validation failed'), {
      code: 'WORKFLOW_INTENT_INVALID',
      issues,
    });
  }

  const compiled = compileWorkflowIr(intent);
  const ir: WorkflowIrDocument = {
    version: 1,
    entryNodeId: compiled.entryNodeId,
    nodes: compiled.nodes,
    edges: compiled.edges,
  };
  const irTopologyIssues = validateWorkflowIrTopology(ir);
  if (irTopologyIssues.length > 0) {
    throw Object.assign(new Error('Workflow IR topology validation failed'), {
      code: 'WORKFLOW_INTENT_INVALID',
      issues: irTopologyIssues,
    });
  }
  const materialized = materializeWorkflowGraphFromIr(ir);
  const legacyGraph = {
    nodes: materialized.nodes,
    edges: materialized.edges,
    entryNodeId: materialized.entryNodeId,
  };

  return { intent, ir, legacyGraph };
}
