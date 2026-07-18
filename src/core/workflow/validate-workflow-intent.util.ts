import type {
  WorkflowIntent,
  WorkflowIntentEdge,
  WorkflowIntentStep,
} from './workflow-intent.types';
import { WORKFLOW_INTENT_VERSION } from './workflow-intent.types';

export type WorkflowIntentValidationIssue = {
  path: string;
  code: string;
  message: string;
};

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 校验 Intent 配置真源。
 * Flow 能力不按 profile 分流（mutate / 全 Preset 均可）；profile 仅作存量字段兼容。
 * 不做业务词表匹配；状态描述由配置者提供。
 */
export function validateWorkflowIntent(
  intent: WorkflowIntent,
): WorkflowIntentValidationIssue[] {
  const issues: WorkflowIntentValidationIssue[] = [];

  if (intent.version !== WORKFLOW_INTENT_VERSION) {
    issues.push({
      path: 'intent.version',
      code: 'unsupported_intent_version',
      message: `intent.version must be ${WORKFLOW_INTENT_VERSION}`,
    });
  }

  if (!intent.steps?.length) {
    issues.push({
      path: 'intent.steps',
      code: 'empty_steps',
      message: 'intent.steps must be non-empty',
    });
    return issues;
  }

  const ids = new Set<string>();
  for (let i = 0; i < intent.steps.length; i++) {
    const step = intent.steps[i]!;
    const base = `intent.steps[${i}]`;
    if (!step.id?.trim()) {
      issues.push({
        path: `${base}.id`,
        code: 'missing_id',
        message: 'step.id is required',
      });
      continue;
    }
    if (ids.has(step.id)) {
      issues.push({
        path: `${base}.id`,
        code: 'duplicate_id',
        message: `duplicate step id: ${step.id}`,
      });
    }
    ids.add(step.id);
    issues.push(...validateStep(step, base));
  }

  if (!ids.has(intent.entryStepId)) {
    issues.push({
      path: 'intent.entryStepId',
      code: 'invalid_entry',
      message: `entryStepId "${intent.entryStepId}" not in steps`,
    });
  }

  if (!intent.edges?.length) {
    if (intent.steps.length > 1) {
      issues.push({
        path: 'intent.edges',
        code: 'missing_edges',
        message:
          'intent.edges must be non-empty when there are multiple steps (linear flows need always edges)',
      });
    }
  } else {
    for (let i = 0; i < intent.edges.length; i++) {
      issues.push(...validateEdge(intent.edges[i]!, ids, `intent.edges[${i}]`));
    }
    issues.push(...validateJudgeFanout(intent));
  }

  return issues;
}

function validateStep(
  step: WorkflowIntentStep,
  path: string,
): WorkflowIntentValidationIssue[] {
  const issues: WorkflowIntentValidationIssue[] = [];

  if (step.operation === 'mutate') {
    if (!isPositiveInt(step.slots?.writeToolId)) {
      issues.push({
        path: `${path}.slots.writeToolId`,
        code: 'missing_write_tool',
        message: 'mutate requires slots.writeToolId',
      });
    }
  }

  if (step.operation === 'deliver') {
    if (step.channel !== 'speak' && step.channel !== 'fill') {
      issues.push({
        path: `${path}.channel`,
        code: 'invalid_channel',
        message: 'deliver.channel must be speak | fill',
      });
    }
    if (step.channel === 'fill') {
      const ids = step.slots?.fillHostToolIds ?? [];
      if (!ids.length || !ids.every(isPositiveInt)) {
        issues.push({
          path: `${path}.slots.fillHostToolIds`,
          code: 'missing_host_tools',
          message: 'deliver.channel=fill requires fillHostToolIds',
        });
      }
    }
  }

  if (step.operation === 'read') {
    const toolIds = step.slots?.readToolIds ?? [];
    const imagesOn = step.capabilities?.images?.enabled === true;
    // 允许仅依赖 pageContext + 可选识图的 read（无 HTTP tool）
    if (toolIds.length > 0 && !toolIds.every(isPositiveInt)) {
      issues.push({
        path: `${path}.slots.readToolIds`,
        code: 'invalid_read_tools',
        message: 'readToolIds must be positive integers',
      });
    }
    if (!toolIds.length && !imagesOn) {
      // 纯隐式 pageContext 不需要 read 步；若出现则警告式仍允许（用于显式「取证」占位）
    }
  }

  return issues;
}

function validateEdge(
  edge: WorkflowIntentEdge,
  stepIds: Set<string>,
  path: string,
): WorkflowIntentValidationIssue[] {
  const issues: WorkflowIntentValidationIssue[] = [];
  if (!edge.id?.trim()) {
    issues.push({
      path: `${path}.id`,
      code: 'missing_id',
      message: 'edge.id is required',
    });
  }
  if (!stepIds.has(edge.from)) {
    issues.push({
      path: `${path}.from`,
      code: 'unknown_from',
      message: `edge.from "${edge.from}" not in steps`,
    });
  }
  if (!stepIds.has(edge.to)) {
    issues.push({
      path: `${path}.to`,
      code: 'unknown_to',
      message: `edge.to "${edge.to}" not in steps`,
    });
  }
  const kind = edge.kind ?? 'always';
  if (kind === 'state') {
    if (!edge.state?.key?.trim() || !edge.state?.description?.trim()) {
      issues.push({
        path: `${path}.state`,
        code: 'missing_state',
        message: 'state edges require state.key and state.description',
      });
    }
  }
  return issues;
}

/** judge 出边：有 state 则必须恰好一条 default；state/default 仅允许从 judge 出发。 */
function validateJudgeFanout(
  intent: WorkflowIntent,
): WorkflowIntentValidationIssue[] {
  const issues: WorkflowIntentValidationIssue[] = [];
  const judgeIds = new Set(
    intent.steps.filter((s) => s.operation === 'judge').map((s) => s.id),
  );

  for (const edge of intent.edges) {
    const kind = edge.kind ?? 'always';
    if (kind !== 'state' && kind !== 'default') {
      continue;
    }
    if (!judgeIds.has(edge.from)) {
      issues.push({
        path: `intent.edges(id=${edge.id})`,
        code: 'branch_edge_not_from_judge',
        message: `${kind} edges must originate from a judge step`,
      });
    }
  }

  for (const judgeId of judgeIds) {
    const outs = intent.edges.filter((e) => e.from === judgeId);
    const states = outs.filter((e) => (e.kind ?? 'always') === 'state');
    const defaults = outs.filter((e) => e.kind === 'default');
    if (states.length > 0 && defaults.length !== 1) {
      issues.push({
        path: `intent.edges(from=${judgeId})`,
        code: 'judge_missing_default',
        message: `judge "${judgeId}" with state edges must have exactly one default edge`,
      });
    }
    if (states.length === 0 && defaults.length > 0) {
      issues.push({
        path: `intent.edges(from=${judgeId})`,
        code: 'judge_default_without_state',
        message: `judge "${judgeId}" has default edge but no state edges`,
      });
    }
  }
  return issues;
}

export function parseWorkflowIntentJson(
  value: unknown,
): WorkflowIntent | null {
  if (!isRecord(value)) return null;
  if (value.version !== WORKFLOW_INTENT_VERSION) return null;
  if (typeof value.profile !== 'string') return null;
  if (typeof value.entryStepId !== 'string') return null;
  if (!Array.isArray(value.steps) || !Array.isArray(value.edges)) return null;
  return value as unknown as WorkflowIntent;
}
