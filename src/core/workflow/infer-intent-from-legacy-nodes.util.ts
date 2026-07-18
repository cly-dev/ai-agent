import {
  WORKFLOW_INTENT_VERSION,
  type WorkflowIntent,
  type WorkflowIntentEdge,
  type WorkflowIntentStep,
} from './workflow-intent.types';
import { validateWorkflowIntent } from './validate-workflow-intent.util';
import type {
  WorkflowNodeDef,
  WorkflowProfile,
} from './workflow.types';

export type InferIntentFromLegacyResult = {
  intent: WorkflowIntent;
  /** 启发式无法完美还原时的说明（分支边、load_page_context 等） */
  warnings: string[];
  matchedPattern:
    | 'mutation'
    | 'fetch_fill_speak'
    | 'fill_speak'
    | 'fetch_speak'
    | 'speak_only'
    | 'custom';
};

/**
 * 将 legacy Workflow.nodes（原子 action）启发式还原为 Intent。
 * 不保证 1:1：clue 扇出、自定义节点序可能被折叠；配置面以还原后 Intent 为准再编译。
 */
export function inferWorkflowIntentFromLegacyNodes(input: {
  profile: WorkflowProfile;
  nodes: WorkflowNodeDef[];
}): InferIntentFromLegacyResult {
  const warnings: string[] = [];
  const nodes = input.nodes ?? [];
  if (nodes.length === 0) {
    throw Object.assign(new Error('Legacy workflow has empty nodes'), {
      code: 'LEGACY_WORKFLOW_EMPTY_NODES',
    });
  }

  const actions = new Set(nodes.map((n) => n.action as string));
  if (actions.has('load_page_context')) {
    warnings.push(
      'load_page_context ignored: pageContext is Runtime Context, not an Intent step',
    );
  }

  const isMutation =
    actions.has('write_data') ||
    actions.has('compose_mutation') ||
    actions.has('await_user_confirm') ||
    actions.has('present_mutation');

  let steps: WorkflowIntentStep[];
  let matchedPattern: InferIntentFromLegacyResult['matchedPattern'];

  if (isMutation) {
    const writeNode = nodes.find((n) => n.action === 'write_data');
    const writeToolId = positiveInt(
      (writeNode?.input as { toolId?: unknown } | undefined)?.toolId,
    );
    if (writeToolId == null) {
      throw Object.assign(
        new Error(
          'Cannot migrate mutation workflow without write_data.input.toolId',
        ),
        { code: 'LEGACY_MUTATION_WRITE_TOOL_MISSING' },
      );
    }
    const readToolIds = collectReadToolIds(nodes);
    const present = nodes.find((n) => n.action === 'present_mutation');
    const summarize = nodes.find((n) => n.action === 'summarize');
    steps = [
      {
        id: 'mutate',
        operation: 'mutate',
        name: writeNode?.name ?? '变更提交',
        objective: writeNode?.objective,
        slots: {
          writeToolId,
          ...(readToolIds.length > 0 ? { readToolIds } : {}),
        },
        explainBeforeConfirm: present != null,
        summarizeAfter: summarize != null,
      },
    ];
    matchedPattern = 'mutation';
    if (actions.has('detect_clues')) {
      warnings.push(
        'detect_clues collapsed into mutate-era Intent; branching edges are not preserved',
      );
    }
  } else {
    steps = [];
    let stepIdx = 0;
    for (const node of nodes) {
      // 历史库可能仍有已淘汰 action；按字符串跳过，避免类型收窄误伤。
      if ((node.action as string) === 'load_page_context') {
        continue;
      }
      if (node.action === 'fetch_data') {
        const readToolIds = collectReadToolIdsFromNode(node);
        if (readToolIds.length === 0) {
          warnings.push(
            `fetch_data node "${node.id}" has no toolId(s); skipped`,
          );
          continue;
        }
        steps.push({
          id: `read_${++stepIdx}`,
          operation: 'read',
          name: node.name,
          objective: node.objective,
          slots: { readToolIds },
        });
        continue;
      }
      if (node.action === 'summarize_images') {
        const imagesInput = node.input as {
          hint?: unknown;
          from?: unknown;
        };
        steps.push({
          id: `read_images_${++stepIdx}`,
          operation: 'read',
          name: node.name,
          objective: node.objective,
          capabilities: {
            images: {
              enabled: true,
              ...(typeof imagesInput.hint === 'string'
                ? { hint: imagesInput.hint }
                : {}),
              ...(imagesInput.from === 'upstream' ||
              imagesInput.from === 'page_context' ||
              imagesInput.from === 'all'
                ? { from: imagesInput.from }
                : {}),
            },
          },
        });
        continue;
      }
      if (node.action === 'detect_clues') {
        const hint = (node.input as { hint?: unknown } | undefined)?.hint;
        steps.push({
          id: `judge_${++stepIdx}`,
          operation: 'judge',
          name: node.name,
          objective: node.objective,
          ...(typeof hint === 'string'
            ? { capabilities: { policyHint: hint } }
            : {}),
        });
        warnings.push(
          'detect_clues migrated as judge; clue branching edges are not preserved',
        );
        continue;
      }
      if (node.action === 'generate_and_push') {
        const hostToolIds = collectHostToolIdsFromNode(node);
        if (hostToolIds.length === 0) {
          warnings.push(
            `generate_and_push node "${node.id}" has no hostToolId(s); skipped`,
          );
          continue;
        }
        steps.push({
          id: `fill_${++stepIdx}`,
          operation: 'deliver',
          channel: 'fill',
          name: node.name,
          objective: node.objective,
          slots: { fillHostToolIds: hostToolIds },
        });
        continue;
      }
      if (node.action === 'summarize') {
        steps.push({
          id: `speak_${++stepIdx}`,
          operation: 'deliver',
          channel: 'speak',
          name: node.name,
          objective: node.objective,
        });
        continue;
      }
      warnings.push(
        `Unsupported legacy action "${node.action}" on node "${node.id}" skipped`,
      );
    }

    if (steps.length === 0) {
      throw Object.assign(
        new Error('Could not infer any Intent steps from legacy nodes'),
        { code: 'LEGACY_INTENT_INFER_EMPTY' },
      );
    }

    const ops = steps.map((s) => s.operation);
    const hasRead = ops.includes('read');
    const hasFill = steps.some(
      (s) => s.operation === 'deliver' && s.channel === 'fill',
    );
    const hasSpeak = steps.some(
      (s) => s.operation === 'deliver' && s.channel === 'speak',
    );
    const hasJudge = ops.includes('judge');
    if (hasJudge || ops.filter((o) => o === 'read').length > 1) {
      matchedPattern = 'custom';
    } else if (hasRead && hasFill && hasSpeak) {
      matchedPattern = 'fetch_fill_speak';
    } else if (hasFill && hasSpeak && !hasRead) {
      matchedPattern = 'fill_speak';
    } else if (hasRead && hasSpeak && !hasFill) {
      matchedPattern = 'fetch_speak';
    } else if (hasSpeak && !hasRead && !hasFill) {
      matchedPattern = 'speak_only';
    } else {
      matchedPattern = 'custom';
    }
  }

  const intent: WorkflowIntent = {
    version: WORKFLOW_INTENT_VERSION,
    profile: input.profile,
    entryStepId: steps[0]!.id,
    steps,
    edges: linearAlwaysEdges(steps.map((s) => s.id)),
  };

  const issues = validateWorkflowIntent(intent);
  if (issues.length > 0) {
    throw Object.assign(
      new Error(
        `Inferred Intent invalid: ${issues.map((i) => i.message).join('; ')}`,
      ),
      { code: 'LEGACY_INTENT_INFER_INVALID', issues },
    );
  }

  return { intent, warnings, matchedPattern };
}

function linearAlwaysEdges(stepIds: string[]): WorkflowIntentEdge[] {
  const edges: WorkflowIntentEdge[] = [];
  for (let i = 0; i < stepIds.length - 1; i++) {
    edges.push({
      id: `e_${stepIds[i]}_${stepIds[i + 1]}`,
      from: stepIds[i]!,
      to: stepIds[i + 1]!,
      kind: 'always',
    });
  }
  return edges;
}

function positiveInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function collectReadToolIds(nodes: WorkflowNodeDef[]): number[] {
  const ids: number[] = [];
  for (const node of nodes) {
    if (node.action !== 'fetch_data') {
      continue;
    }
    ids.push(...collectReadToolIdsFromNode(node));
  }
  return [...new Set(ids)];
}

function collectReadToolIdsFromNode(node: WorkflowNodeDef): number[] {
  const input = node.input as {
    toolId?: unknown;
    toolIds?: unknown;
  };
  const ids: number[] = [];
  const single = positiveInt(input.toolId);
  if (single != null) {
    ids.push(single);
  }
  if (Array.isArray(input.toolIds)) {
    for (const id of input.toolIds) {
      const n = positiveInt(id);
      if (n != null) {
        ids.push(n);
      }
    }
  }
  return [...new Set(ids)];
}

function collectHostToolIdsFromNode(node: WorkflowNodeDef): number[] {
  const input = node.input as {
    hostToolId?: unknown;
    hostToolIds?: unknown;
  };
  const ids: number[] = [];
  const single = positiveInt(input.hostToolId);
  if (single != null) {
    ids.push(single);
  }
  if (Array.isArray(input.hostToolIds)) {
    for (const id of input.hostToolIds) {
      const n = positiveInt(id);
      if (n != null) {
        ids.push(n);
      }
    }
  }
  return [...new Set(ids)];
}
