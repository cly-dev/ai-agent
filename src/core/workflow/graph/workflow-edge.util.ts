import type {
  WorkflowEdge,
  WorkflowEdgeKind,
  WorkflowNodeDef,
  WorkflowValidationIssue,
} from '../workflow.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function resolveWorkflowEdgeKind(edge: WorkflowEdge): WorkflowEdgeKind {
  return edge.kind ?? 'always';
}

/** 无显式 edges 时按 nodes 数组顺序合成 always 边（行为与线性一致）。 */
export function synthesizeLinearWorkflowEdges(
  nodes: WorkflowNodeDef[],
): WorkflowEdge[] {
  const edges: WorkflowEdge[] = [];
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const from = nodes[index]!;
    const to = nodes[index + 1]!;
    edges.push({
      id: `linear:${from.id}->${to.id}`,
      from: from.id,
      to: to.id,
      kind: 'always',
    });
  }
  return edges;
}

/**
 * 严格解析单条边：字段不全则返回 issue，不吞掉。
 * kind 缺省视为 always；kind=clue 时要求 clue.key + description。
 */
export function tryParseWorkflowEdge(
  row: unknown,
  index: number,
):
  | { ok: true; edge: WorkflowEdge }
  | { ok: false; issue: WorkflowValidationIssue } {
  const path = `edges[${index}]`;
  if (!isRecord(row)) {
    return {
      ok: false,
      issue: {
        path,
        code: 'invalid_edge',
        message: 'edge must be an object',
      },
    };
  }
  if (!isNonEmptyString(row.id)) {
    return {
      ok: false,
      issue: {
        path: `${path}.id`,
        code: 'missing_edge_id',
        message: 'edge id is required',
      },
    };
  }
  if (!isNonEmptyString(row.from)) {
    return {
      ok: false,
      issue: {
        path: `${path}.from`,
        code: 'missing_edge_from',
        message: 'edge.from is required',
      },
    };
  }
  if (!isNonEmptyString(row.to)) {
    return {
      ok: false,
      issue: {
        path: `${path}.to`,
        code: 'missing_edge_to',
        message: 'edge.to is required',
      },
    };
  }

  let kind: WorkflowEdgeKind | undefined;
  if (row.kind != null) {
    if (
      row.kind !== 'always' &&
      row.kind !== 'clue' &&
      row.kind !== 'default'
    ) {
      return {
        ok: false,
        issue: {
          path: `${path}.kind`,
          code: 'invalid_edge_kind',
          message: 'edge.kind must be always, clue, or default',
        },
      };
    }
    kind = row.kind;
  }

  const edge: WorkflowEdge = {
    id: row.id,
    from: row.from,
    to: row.to,
    ...(kind ? { kind } : {}),
  };

  const resolvedKind = kind ?? 'always';
  if (resolvedKind === 'clue') {
    if (!isRecord(row.clue)) {
      return {
        ok: false,
        issue: {
          path: `${path}.clue`,
          code: 'missing_clue',
          message: 'clue edges require clue object',
        },
      };
    }
    if (!isNonEmptyString(row.clue.key)) {
      return {
        ok: false,
        issue: {
          path: `${path}.clue.key`,
          code: 'missing_clue_key',
          message: 'clue edges require clue.key',
        },
      };
    }
    if (!isNonEmptyString(row.clue.description)) {
      return {
        ok: false,
        issue: {
          path: `${path}.clue.description`,
          code: 'missing_clue_description',
          message: 'clue edges require clue.description',
        },
      };
    }
    edge.clue = {
      key: row.clue.key,
      description: row.clue.description,
    };
  } else if (isRecord(row.clue)) {
    // always/default 可忽略 clue；若带了不完整线索字段则拒绝，避免脏配置
    const key = row.clue.key;
    const description = row.clue.description;
    if (
      (key != null && !isNonEmptyString(key)) ||
      (description != null && !isNonEmptyString(description))
    ) {
      return {
        ok: false,
        issue: {
          path: `${path}.clue`,
          code: 'invalid_clue',
          message: 'edge.clue.key/description must be non-empty strings when set',
        },
      };
    }
    if (isNonEmptyString(key) && isNonEmptyString(description)) {
      edge.clue = { key, description };
    }
  }

  return { ok: true, edge };
}

/** 严格解析 edges[]：任一行非法则记入 issues，不静默丢弃后改走线性。 */
export function parseWorkflowEdgesJsonStrict(value: unknown): {
  edges: WorkflowEdge[];
  issues: WorkflowValidationIssue[];
} {
  if (!Array.isArray(value)) {
    return {
      edges: [],
      issues: [
        {
          path: 'edges',
          code: 'invalid_edges',
          message: 'edges must be an array',
        },
      ],
    };
  }
  const edges: WorkflowEdge[] = [];
  const issues: WorkflowValidationIssue[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const parsed = tryParseWorkflowEdge(value[index], index);
    if (parsed.ok === true) {
      edges.push(parsed.edge);
      continue;
    }
    issues.push(parsed.issue);
  }
  return { edges, issues };
}

export type ParsedWorkflowGraph = {
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId: string | null;
  /**
   * 文档是否声明了 edges 字段（含 edges: []）。
   * true 时禁止再静默合成线性边覆盖意图。
   */
  edgesDeclared: boolean;
  /** 严格解析 edges 产生的问题（声明边时必查）。 */
  edgeParseIssues: WorkflowValidationIssue[];
};

function parseWorkflowNodesArray(value: unknown): WorkflowNodeDef[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (row): row is WorkflowNodeDef =>
      isRecord(row) &&
      typeof row.id === 'string' &&
      typeof row.action === 'string' &&
      typeof row.name === 'string' &&
      typeof row.objective === 'string' &&
      isRecord(row.input),
  );
}

/**
 * 双形态解析：
 * - WorkflowNodeDef[]（遗留只读）→ 合成 always；edgesDeclared=false
 * - { nodes, edges: array } → edgesDeclared=true，严格解析，失败记入 edgeParseIssues
 * - { nodes, edges: 非数组 } → edgesDeclared=true + invalid_edges_type（fail-closed，禁止线性回落）
 * - { nodes } 无 edges 字段 → 合成 always（仅兼容无 detect 的旧脏数据）
 */
export function parseWorkflowGraphJson(value: unknown): ParsedWorkflowGraph {
  if (Array.isArray(value)) {
    const nodes = parseWorkflowNodesArray(value);
    return {
      nodes,
      edges: synthesizeLinearWorkflowEdges(nodes),
      entryNodeId: nodes[0]?.id ?? null,
      edgesDeclared: false,
      edgeParseIssues: [],
    };
  }

  if (isRecord(value) && Array.isArray(value.nodes)) {
    const nodes = parseWorkflowNodesArray(value.nodes);
    const entryNodeId =
      typeof value.entryNodeId === 'string' && value.entryNodeId.trim()
        ? value.entryNodeId
        : (nodes[0]?.id ?? null);

    if ('edges' in value) {
      if (!Array.isArray(value.edges)) {
        return {
          nodes,
          edges: [],
          entryNodeId,
          edgesDeclared: true,
          edgeParseIssues: [
            {
              path: 'edges',
              code: 'invalid_edges_type',
              message: 'edges must be an array when present',
            },
          ],
        };
      }
      const { edges, issues } = parseWorkflowEdgesJsonStrict(value.edges);
      return {
        nodes,
        edges,
        entryNodeId,
        edgesDeclared: true,
        edgeParseIssues: issues,
      };
    }

    return {
      nodes,
      edges: synthesizeLinearWorkflowEdges(nodes),
      entryNodeId,
      edgesDeclared: false,
      edgeParseIssues: [],
    };
  }

  return {
    nodes: [],
    edges: [],
    entryNodeId: null,
    edgesDeclared: false,
    edgeParseIssues: [],
  };
}

/** 持久化：B 端约定一律存文档对象（含 edges）；遗留读取仍兼容纯数组。 */
export function serializeWorkflowGraphJson(input: {
  nodes: WorkflowNodeDef[];
  edges?: WorkflowEdge[];
  entryNodeId?: string | null;
}): unknown {
  return {
    nodes: input.nodes,
    edges: input.edges ?? [],
    ...(input.entryNodeId ? { entryNodeId: input.entryNodeId } : {}),
  };
}

export function listOutgoingEdges(
  edges: WorkflowEdge[],
  fromNodeId: string,
): WorkflowEdge[] {
  return edges.filter((edge) => edge.from === fromNodeId);
}

export function listClueEdgesFrom(
  edges: WorkflowEdge[],
  fromNodeId: string,
): WorkflowEdge[] {
  return listOutgoingEdges(edges, fromNodeId).filter(
    (edge) => resolveWorkflowEdgeKind(edge) === 'clue',
  );
}

export function findDefaultEdgeFrom(
  edges: WorkflowEdge[],
  fromNodeId: string,
): WorkflowEdge | null {
  return (
    listOutgoingEdges(edges, fromNodeId).find(
      (edge) => resolveWorkflowEdgeKind(edge) === 'default',
    ) ?? null
  );
}

export function listAlwaysEdgesFrom(
  edges: WorkflowEdge[],
  fromNodeId: string,
): WorkflowEdge[] {
  return listOutgoingEdges(edges, fromNodeId).filter(
    (edge) => resolveWorkflowEdgeKind(edge) === 'always',
  );
}
