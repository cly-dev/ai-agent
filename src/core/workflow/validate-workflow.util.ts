import { getWorkflowActionRegistryEntry, isWorkflowActionKind } from './workflow-action-registry';
import { resolveWorkflowEdgeKind } from './graph/workflow-edge.util';
import {
  resolveFetchDataToolIds,
  resolveGenerateAndPushHostToolIds,
} from './resolve-workflow-node-tool-refs.util';
import type {
  WorkflowBindingRefs,
  WorkflowDefinition,
  WorkflowEdge,
  WorkflowNodeDef,
  WorkflowProfile,
  WorkflowValidationIssue,
} from './workflow.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function pushIssue(
  issues: WorkflowValidationIssue[],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ path, code, message });
}

function validateNodeInput(
  node: WorkflowNodeDef,
  issues: WorkflowValidationIssue[],
): void {
  const basePath = `nodes.${node.id}.input`;
  const rawInput: unknown = node.input;
  if (!isRecord(rawInput)) {
    pushIssue(issues, basePath, 'invalid_input', 'input must be an object');
    return;
  }
  const input = rawInput;

  switch (node.action) {
    case 'detect_clues':
      if (input.hint != null && typeof input.hint !== 'string') {
        pushIssue(
          issues,
          `${basePath}.hint`,
          'invalid_hint',
          'hint must be a string when provided',
        );
      }
      break;
    case 'summarize_images': {
      if (
        input.from != null &&
        input.from !== 'upstream' &&
        input.from !== 'page_context' &&
        input.from !== 'all'
      ) {
        pushIssue(
          issues,
          `${basePath}.from`,
          'invalid_enum',
          'from must be upstream | page_context | all',
        );
      }
      if (input.maxCells != null) {
        if (
          typeof input.maxCells !== 'number' ||
          !Number.isInteger(input.maxCells) ||
          input.maxCells < 1 ||
          input.maxCells > 6
        ) {
          pushIssue(
            issues,
            `${basePath}.maxCells`,
            'invalid_max_cells',
            'maxCells must be an integer in 1..6',
          );
        }
      }
      if (input.maxGroups != null) {
        if (
          typeof input.maxGroups !== 'number' ||
          !Number.isInteger(input.maxGroups) ||
          input.maxGroups < 1 ||
          input.maxGroups > 20
        ) {
          pushIssue(
            issues,
            `${basePath}.maxGroups`,
            'invalid_max_groups',
            'maxGroups must be an integer in 1..20',
          );
        }
      }
      if (input.maxCellsPerGroup != null) {
        if (
          typeof input.maxCellsPerGroup !== 'number' ||
          !Number.isInteger(input.maxCellsPerGroup) ||
          input.maxCellsPerGroup < 1 ||
          input.maxCellsPerGroup > 6
        ) {
          pushIssue(
            issues,
            `${basePath}.maxCellsPerGroup`,
            'invalid_max_cells_per_group',
            'maxCellsPerGroup must be an integer in 1..6',
          );
        }
      }
      if (input.cellPx != null) {
        if (
          typeof input.cellPx !== 'number' ||
          !Number.isInteger(input.cellPx) ||
          input.cellPx < 128 ||
          input.cellPx > 1024
        ) {
          pushIssue(
            issues,
            `${basePath}.cellPx`,
            'invalid_cell_px',
            'cellPx must be an integer in 128..1024',
          );
        }
      }
      if (input.hint != null && typeof input.hint !== 'string') {
        pushIssue(
          issues,
          `${basePath}.hint`,
          'invalid_hint',
          'hint must be a string when provided',
        );
      }
      if (
        input.onFailure != null &&
        input.onFailure !== 'degrade' &&
        input.onFailure !== 'fail'
      ) {
        pushIssue(
          issues,
          `${basePath}.onFailure`,
          'invalid_enum',
          'onFailure must be degrade | fail',
        );
      }
      if (input.cacheTtlSec != null) {
        if (
          typeof input.cacheTtlSec !== 'number' ||
          !Number.isInteger(input.cacheTtlSec) ||
          input.cacheTtlSec < 0 ||
          input.cacheTtlSec > 604_800
        ) {
          pushIssue(
            issues,
            `${basePath}.cacheTtlSec`,
            'invalid_cache_ttl',
            'cacheTtlSec must be an integer in 0..604800 (0 disables cache)',
          );
        }
      }
      break;
    }
    case 'fetch_data': {
      const toolIds = resolveFetchDataToolIds(input);
      if (toolIds.length === 0 && !isNonEmptyString(input.definitionKey)) {
        pushIssue(
          issues,
          `${basePath}.toolIds`,
          'missing_tool_ids',
          'fetch_data requires input.toolIds (non-empty) or legacy toolId / definitionKey',
        );
      }
      if (
        input.completeWhen != null &&
        input.completeWhen !== 'first_success' &&
        input.completeWhen !== 'fetch_all_pages'
      ) {
        pushIssue(
          issues,
          `${basePath}.completeWhen`,
          'invalid_enum',
          'completeWhen must be first_success or fetch_all_pages',
        );
      }
      break;
    }
    case 'generate_and_push': {
      const hostToolIds = resolveGenerateAndPushHostToolIds(input);
      if (hostToolIds.length === 0) {
        pushIssue(
          issues,
          `${basePath}.hostToolIds`,
          'missing_host_tool_ids',
          'generate_and_push requires input.hostToolIds (non-empty) or legacy hostToolId',
        );
      }
      // 历史 input.stream 已废弃（交付由 HostTool 契约 + HOST_TOOL_STREAM 决定），忽略不校验。
      break;
    }
    case 'summarize':
      if (
        input.mode != null &&
        input.mode !== 'brief' &&
        input.mode !== 'detailed' &&
        input.mode !== 'draft' &&
        input.mode !== 'final'
      ) {
        pushIssue(
          issues,
          `${basePath}.mode`,
          'invalid_enum',
          'mode must be brief, detailed, draft, or final',
        );
      }
      break;
    case 'compose_mutation':
    case 'write_data':
      if (!isPositiveInt(input.toolId)) {
        pushIssue(
          issues,
          `${basePath}.toolId`,
          'missing_tool',
          `${node.action} requires toolId`,
        );
      }
      break;
    case 'present_mutation':
      if (
        input.mode != null &&
        input.mode !== 'brief' &&
        input.mode !== 'detailed'
      ) {
        pushIssue(
          issues,
          `${basePath}.mode`,
          'invalid_enum',
          'mode must be brief or detailed',
        );
      }
      break;
    case 'await_user_confirm':
      if (
        input.confirmKind != null &&
        input.confirmKind !== 'mutation' &&
        input.confirmKind !== 'generic'
      ) {
        pushIssue(
          issues,
          `${basePath}.confirmKind`,
          'invalid_enum',
          'confirmKind must be mutation or generic',
        );
      }
      break;
    default:
      pushIssue(
        issues,
        `nodes.${node.id}.action`,
        'unknown_action',
        `unknown action ${String(node.action)}`,
      );
  }
}

function validateNodeBindings(
  node: WorkflowNodeDef,
  bindings: WorkflowBindingRefs,
  issues: WorkflowValidationIssue[],
): void {
  const rawInput: unknown = node.input;
  if (!isRecord(rawInput)) {
    return;
  }
  const input = rawInput;

  if (
    node.action === 'fetch_data' ||
    node.action === 'compose_mutation' ||
    node.action === 'write_data'
  ) {
    const toolIds =
      node.action === 'fetch_data'
        ? resolveFetchDataToolIds(input)
        : isPositiveInt(input.toolId)
          ? [input.toolId]
          : [];
    for (const toolId of toolIds) {
      if (!bindings.toolIds.includes(toolId)) {
        pushIssue(
          issues,
          `nodes.${node.id}.input.toolIds`,
          'tool_not_bound',
          `toolId ${toolId} is not in WorkflowTool bindings`,
        );
      }
    }
  }

  if (node.action === 'generate_and_push') {
    for (const hostToolId of resolveGenerateAndPushHostToolIds(input)) {
      if (!bindings.hostToolIds.includes(hostToolId)) {
        pushIssue(
          issues,
          `nodes.${node.id}.input.hostToolIds`,
          'host_tool_not_bound',
          `hostToolId ${hostToolId} is not in WorkflowHostTool bindings`,
        );
      }
    }
  }
}

function validateNodeDef(
  node: unknown,
  index: number,
  profile: WorkflowProfile,
  bindings: WorkflowBindingRefs,
  issues: WorkflowValidationIssue[],
): WorkflowNodeDef | null {
  const path = `nodes[${index}]`;
  if (!isRecord(node)) {
    pushIssue(issues, path, 'invalid_node', 'node must be an object');
    return null;
  }

  const id = node.id;
  const action = node.action;
  const name = node.name;
  const objective = node.objective;

  if (!isNonEmptyString(id)) {
    pushIssue(issues, `${path}.id`, 'missing_id', 'node id is required');
  }
  if (!isNonEmptyString(name)) {
    pushIssue(issues, `${path}.name`, 'missing_name', 'node name is required');
  }
  if (!isNonEmptyString(objective)) {
    pushIssue(
      issues,
      `${path}.objective`,
      'missing_objective',
      'node objective is required',
    );
  }
  if (!isNonEmptyString(action) || !isWorkflowActionKind(action)) {
    pushIssue(
      issues,
      `${path}.action`,
      'unknown_action',
      'action is not in workflow registry',
    );
    return null;
  }

  const registryEntry = getWorkflowActionRegistryEntry(action);
  if (!registryEntry?.implemented) {
    pushIssue(
      issues,
      `${path}.action`,
      'action_not_implemented',
      `action ${action} is not implemented yet`,
    );
  }

  const typedNode = node as WorkflowNodeDef;
  validateNodeInput(typedNode, issues);
  validateNodeBindings(typedNode, bindings, issues);
  return typedNode;
}

export function validateWorkflowDefinition(input: {
  definition: WorkflowDefinition;
  bindings?: WorkflowBindingRefs;
}): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  const { definition } = input;
  const bindings = input.bindings ?? { toolIds: [], hostToolIds: [] };

  if (!isNonEmptyString(definition.workflowKey)) {
    pushIssue(
      issues,
      'workflowKey',
      'missing_workflow_key',
      'workflowKey is required',
    );
  }
  if (!isNonEmptyString(definition.name)) {
    pushIssue(issues, 'name', 'missing_name', 'name is required');
  }
  if (
    definition.profile !== 'chat_skill' &&
    definition.profile !== 'page_action' &&
    definition.profile !== 'shared'
  ) {
    pushIssue(
      issues,
      'profile',
      'invalid_profile',
      'profile must be chat_skill, page_action, or shared',
    );
  }

  if (!Array.isArray(definition.nodes) || definition.nodes.length === 0) {
    pushIssue(issues, 'nodes', 'empty_nodes', 'nodes must be a non-empty array');
    return issues;
  }

  const seenIds = new Set<string>();
  for (let index = 0; index < definition.nodes.length; index += 1) {
    const node = validateNodeDef(
      definition.nodes[index],
      index,
      definition.profile,
      bindings,
      issues,
    );
    if (node && isNonEmptyString(node.id)) {
      if (seenIds.has(node.id)) {
        pushIssue(
          issues,
          `nodes.${node.id}.id`,
          'duplicate_node_id',
          `duplicate node id ${node.id}`,
        );
      }
      seenIds.add(node.id);
    }
  }

  // 仅在显式 edges 时做图校验；遗留纯数组不校验（线性兼容）
  if (definition.edges != null) {
    validateWorkflowEdges({
      nodes: definition.nodes,
      edges: definition.edges,
      entryNodeId: definition.entryNodeId,
      issues,
      nodeIds: seenIds,
    });
  }

  return issues;
}

function hasCycle(edges: WorkflowEdge[], nodeIds: Set<string>): boolean {
  const outs = new Map<string, string[]>();
  for (const id of nodeIds) {
    outs.set(id, []);
  }
  for (const edge of edges) {
    outs.get(edge.from)?.push(edge.to);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const dfs = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }
    visiting.add(nodeId);
    for (const next of outs.get(nodeId) ?? []) {
      if (dfs(next)) {
        return true;
      }
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };
  for (const id of nodeIds) {
    if (dfs(id)) {
      return true;
    }
  }
  return false;
}

function validateWorkflowEdges(input: {
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId?: string;
  issues: WorkflowValidationIssue[];
  nodeIds: Set<string>;
}): void {
  const { edges, issues, nodeIds, nodes } = input;
  const seenEdgeIds = new Set<string>();

  if (input.entryNodeId != null && !nodeIds.has(input.entryNodeId)) {
    pushIssue(
      issues,
      'entryNodeId',
      'unknown_entry',
      `entryNodeId ${input.entryNodeId} is not a node id`,
    );
  }

  for (let index = 0; index < edges.length; index += 1) {
    const edge = edges[index]!;
    const path = `edges[${index}]`;
    if (!isNonEmptyString(edge.id)) {
      pushIssue(issues, `${path}.id`, 'missing_edge_id', 'edge id is required');
    } else if (seenEdgeIds.has(edge.id)) {
      pushIssue(
        issues,
        `${path}.id`,
        'duplicate_edge_id',
        `duplicate edge id ${edge.id}`,
      );
    } else {
      seenEdgeIds.add(edge.id);
    }
    if (!nodeIds.has(edge.from)) {
      pushIssue(
        issues,
        `${path}.from`,
        'unknown_from',
        `edge.from ${edge.from} is not a node id`,
      );
    }
    if (!nodeIds.has(edge.to)) {
      pushIssue(
        issues,
        `${path}.to`,
        'unknown_to',
        `edge.to ${edge.to} is not a node id`,
      );
    }
    if (edge.from === edge.to) {
      pushIssue(issues, path, 'self_loop', 'edge must not be a self-loop');
    }

    const kind = resolveWorkflowEdgeKind(edge);
    if (kind === 'clue') {
      if (!edge.clue || !isNonEmptyString(edge.clue.key)) {
        pushIssue(
          issues,
          `${path}.clue.key`,
          'missing_clue_key',
          'clue edges require clue.key',
        );
      }
      if (!edge.clue || !isNonEmptyString(edge.clue.description)) {
        pushIssue(
          issues,
          `${path}.clue.description`,
          'missing_clue_description',
          'clue edges require clue.description',
        );
      }
    }
  }

  if (hasCycle(edges, nodeIds)) {
    pushIssue(issues, 'edges', 'cycle', 'workflow edges must form a DAG');
  }

  const detectNodes = nodes.filter((node) => node.action === 'detect_clues');

  for (const detect of detectNodes) {
    const outs = edges.filter((edge) => edge.from === detect.id);
    if (outs.length === 0) {
      pushIssue(
        issues,
        `nodes.${detect.id}`,
        'detect_no_outgoing',
        'detect_clues must have at least one outgoing edge',
      );
      continue;
    }

    let defaultCount = 0;
    const clueKeys = new Set<string>();
    let clueCount = 0;
    for (const edge of outs) {
      const kind = resolveWorkflowEdgeKind(edge);
      if (kind === 'always') {
        pushIssue(
          issues,
          `edges.${edge.id}`,
          'detect_always_edge',
          'detect_clues outgoing edges must be clue or default (not always)',
        );
      }
      if (kind === 'default') {
        defaultCount += 1;
      }
      if (kind === 'clue') {
        clueCount += 1;
        const key = edge.clue?.key;
        if (key) {
          if (clueKeys.has(key)) {
            pushIssue(
              issues,
              `edges.${edge.id}.clue.key`,
              'duplicate_clue_key',
              `duplicate clue.key ${key} on detect outs`,
            );
          }
          clueKeys.add(key);
        }
      }
    }
    if (defaultCount > 1) {
      pushIssue(
        issues,
        `nodes.${detect.id}`,
        'multiple_default',
        'detect_clues may have at most one default outgoing edge',
      );
    }
    if (clueCount > 0 && defaultCount === 0) {
      pushIssue(
        issues,
        `nodes.${detect.id}`,
        'missing_default',
        'detect_clues with clue edges must declare a default edge',
      );
    }

    const clueOuts = outs.filter(
      (edge) => resolveWorkflowEdgeKind(edge) === 'clue',
    );
    const clueTargets = new Set<string>();
    for (const clueEdge of clueOuts) {
      if (clueTargets.has(clueEdge.to)) {
        pushIssue(
          issues,
          `edges.${clueEdge.id}`,
          'duplicate_clue_target',
          `each clue edge must target a distinct node; duplicate to=${clueEdge.to}`,
        );
      }
      clueTargets.add(clueEdge.to);
    }

    const defaultEdge = outs.find(
      (edge) => resolveWorkflowEdgeKind(edge) === 'default',
    );

    // default.to 不得与任一 clue.to 重叠（零命中路径与命中分支去向需区分）
    if (defaultEdge && clueTargets.has(defaultEdge.to)) {
      pushIssue(
        issues,
        `edges.${defaultEdge.id}`,
        'default_overlaps_clue_target',
        'default.to must not equal any clue edge to',
      );
    }

    // 各状态分支可各自收尾（不同说明/动作），不强制 always 汇合到 default.to
  }

  // 非 detect：至多一条 always 出边（advance 只取第一条，多条会孤儿）
  for (const node of nodes) {
    if (node.action === 'detect_clues') {
      continue;
    }
    const alwaysOuts = edges.filter(
      (edge) =>
        edge.from === node.id && resolveWorkflowEdgeKind(edge) === 'always',
    );
    if (alwaysOuts.length > 1) {
      pushIssue(
        issues,
        `nodes.${node.id}`,
        'multiple_always_outgoing',
        `non-detect node may have at most one always outgoing edge (got ${alwaysOuts.length})`,
      );
    }
  }

  // 非 detect 节点不得发出 clue/default
  for (const edge of edges) {
    const fromNode = nodes.find((node) => node.id === edge.from);
    if (!fromNode || fromNode.action === 'detect_clues') {
      continue;
    }
    const kind = resolveWorkflowEdgeKind(edge);
    if (kind === 'clue' || kind === 'default') {
      pushIssue(
        issues,
        `edges.${edge.id}`,
        'gated_edge_from_non_detect',
        'clue/default edges may only leave detect_clues nodes',
      );
    }
  }

  // 每个节点必须从入口可达，避免 finalize 时仍有 pending 却标 completed
  const entryId =
    input.entryNodeId && nodeIds.has(input.entryNodeId)
      ? input.entryNodeId
      : (nodes[0]?.id ?? null);
  if (entryId) {
    const reachable = collectReachableNodeIds(entryId, edges, nodeIds);
    for (const id of nodeIds) {
      if (!reachable.has(id)) {
        pushIssue(
          issues,
          `nodes.${id}`,
          'unreachable_node',
          `node ${id} is not reachable from entry ${entryId}`,
        );
      }
    }
  }
}

function collectReachableNodeIds(
  entryId: string,
  edges: WorkflowEdge[],
  nodeIds: Set<string>,
): Set<string> {
  const outs = new Map<string, string[]>();
  for (const id of nodeIds) {
    outs.set(id, []);
  }
  for (const edge of edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      continue;
    }
    outs.get(edge.from)?.push(edge.to);
  }
  const reachable = new Set<string>();
  const stack = [entryId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (reachable.has(id)) {
      continue;
    }
    reachable.add(id);
    for (const next of outs.get(id) ?? []) {
      stack.push(next);
    }
  }
  return reachable;
}

export function isValidWorkflowDefinition(input: {
  definition: WorkflowDefinition;
  bindings?: WorkflowBindingRefs;
}): boolean {
  return validateWorkflowDefinition(input).length === 0;
}

/**
 * 仅图拓扑（边 / detect / 可达性），不含节点 input / bindings。
 * 供运行时 load fail-closed，与 B 端完整校验互补。
 */
export function validateWorkflowTopology(input: {
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId?: string | null;
}): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  const nodeIds = new Set(
    input.nodes
      .map((node) => node.id)
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
  );
  if (nodeIds.size === 0) {
    return issues;
  }
  validateWorkflowEdges({
    nodes: input.nodes,
    edges: input.edges,
    entryNodeId: input.entryNodeId ?? undefined,
    issues,
    nodeIds,
  });
  return issues;
}
