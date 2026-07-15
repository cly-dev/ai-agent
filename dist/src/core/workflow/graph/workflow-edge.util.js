"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAlwaysEdgesFrom = exports.findDefaultEdgeFrom = exports.listClueEdgesFrom = exports.listOutgoingEdges = exports.serializeWorkflowGraphJson = exports.parseWorkflowGraphJson = exports.parseWorkflowEdgesJsonStrict = exports.tryParseWorkflowEdge = exports.synthesizeLinearWorkflowEdges = exports.resolveWorkflowEdgeKind = void 0;
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
function resolveWorkflowEdgeKind(edge) {
    var _a;
    return (_a = edge.kind) !== null && _a !== void 0 ? _a : 'always';
}
exports.resolveWorkflowEdgeKind = resolveWorkflowEdgeKind;
function synthesizeLinearWorkflowEdges(nodes) {
    const edges = [];
    for (let index = 0; index < nodes.length - 1; index += 1) {
        const from = nodes[index];
        const to = nodes[index + 1];
        edges.push({
            id: `linear:${from.id}->${to.id}`,
            from: from.id,
            to: to.id,
            kind: 'always',
        });
    }
    return edges;
}
exports.synthesizeLinearWorkflowEdges = synthesizeLinearWorkflowEdges;
function tryParseWorkflowEdge(row, index) {
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
    let kind;
    if (row.kind != null) {
        if (row.kind !== 'always' &&
            row.kind !== 'clue' &&
            row.kind !== 'default') {
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
    const edge = Object.assign({ id: row.id, from: row.from, to: row.to }, (kind ? { kind } : {}));
    const resolvedKind = kind !== null && kind !== void 0 ? kind : 'always';
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
    }
    else if (isRecord(row.clue)) {
        const key = row.clue.key;
        const description = row.clue.description;
        if ((key != null && !isNonEmptyString(key)) ||
            (description != null && !isNonEmptyString(description))) {
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
exports.tryParseWorkflowEdge = tryParseWorkflowEdge;
function parseWorkflowEdgesJsonStrict(value) {
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
    const edges = [];
    const issues = [];
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
exports.parseWorkflowEdgesJsonStrict = parseWorkflowEdgesJsonStrict;
function parseWorkflowNodesArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((row) => isRecord(row) &&
        typeof row.id === 'string' &&
        typeof row.action === 'string' &&
        typeof row.name === 'string' &&
        typeof row.objective === 'string' &&
        isRecord(row.input));
}
function parseWorkflowGraphJson(value) {
    var _a, _b, _c, _d;
    if (Array.isArray(value)) {
        const nodes = parseWorkflowNodesArray(value);
        return {
            nodes,
            edges: synthesizeLinearWorkflowEdges(nodes),
            entryNodeId: (_b = (_a = nodes[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
            edgesDeclared: false,
            edgeParseIssues: [],
        };
    }
    if (isRecord(value) && Array.isArray(value.nodes)) {
        const nodes = parseWorkflowNodesArray(value.nodes);
        const entryNodeId = typeof value.entryNodeId === 'string' && value.entryNodeId.trim()
            ? value.entryNodeId
            : ((_d = (_c = nodes[0]) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null);
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
exports.parseWorkflowGraphJson = parseWorkflowGraphJson;
function serializeWorkflowGraphJson(input) {
    var _a;
    return Object.assign({ nodes: input.nodes, edges: (_a = input.edges) !== null && _a !== void 0 ? _a : [] }, (input.entryNodeId ? { entryNodeId: input.entryNodeId } : {}));
}
exports.serializeWorkflowGraphJson = serializeWorkflowGraphJson;
function listOutgoingEdges(edges, fromNodeId) {
    return edges.filter((edge) => edge.from === fromNodeId);
}
exports.listOutgoingEdges = listOutgoingEdges;
function listClueEdgesFrom(edges, fromNodeId) {
    return listOutgoingEdges(edges, fromNodeId).filter((edge) => resolveWorkflowEdgeKind(edge) === 'clue');
}
exports.listClueEdgesFrom = listClueEdgesFrom;
function findDefaultEdgeFrom(edges, fromNodeId) {
    var _a;
    return ((_a = listOutgoingEdges(edges, fromNodeId).find((edge) => resolveWorkflowEdgeKind(edge) === 'default')) !== null && _a !== void 0 ? _a : null);
}
exports.findDefaultEdgeFrom = findDefaultEdgeFrom;
function listAlwaysEdgesFrom(edges, fromNodeId) {
    return listOutgoingEdges(edges, fromNodeId).filter((edge) => resolveWorkflowEdgeKind(edge) === 'always');
}
exports.listAlwaysEdgesFrom = listAlwaysEdgesFrom;
//# sourceMappingURL=workflow-edge.util.js.map