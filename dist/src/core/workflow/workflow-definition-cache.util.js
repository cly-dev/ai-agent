"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rememberWorkflowLoadCache = exports.readCachedWorkflowLoad = exports.workflowLoadCacheKey = void 0;
const WORKFLOW_LOAD_CACHE_TTL_MS = 5 * 60000;
const workflowLoadCache = new Map();
function workflowLoadCacheKey(input) {
    var _a;
    const version = (_a = input.workflowVersion) !== null && _a !== void 0 ? _a : 'head';
    return `${input.appClientId}:${input.workflowId}:${version}`;
}
exports.workflowLoadCacheKey = workflowLoadCacheKey;
function readCachedWorkflowLoad(key, workflowUpdatedAt, revisionFingerprint, resolvedVersion) {
    const cached = workflowLoadCache.get(key);
    if (!cached || cached.expiresAt <= Date.now()) {
        workflowLoadCache.delete(key);
        return null;
    }
    if (cached.workflowUpdatedAt !== workflowUpdatedAt.toISOString() ||
        cached.revisionFingerprint !== revisionFingerprint ||
        cached.version !== resolvedVersion) {
        workflowLoadCache.delete(key);
        return null;
    }
    return {
        nodes: cached.baseNodes,
        edges: cached.edges,
        entryNodeId: cached.entryNodeId,
        edgesDeclared: cached.edgesDeclared,
        edgeParseIssues: cached.edgeParseIssues,
    };
}
exports.readCachedWorkflowLoad = readCachedWorkflowLoad;
function rememberWorkflowLoadCache(key, entry) {
    workflowLoadCache.set(key, {
        expiresAt: Date.now() + WORKFLOW_LOAD_CACHE_TTL_MS,
        workflowId: entry.workflowId,
        version: entry.version,
        workflowUpdatedAt: entry.workflowUpdatedAt,
        revisionFingerprint: entry.revisionFingerprint,
        baseNodes: entry.graph.nodes,
        edges: entry.graph.edges,
        entryNodeId: entry.graph.entryNodeId,
        edgesDeclared: entry.graph.edgesDeclared,
        edgeParseIssues: entry.graph.edgeParseIssues,
    });
}
exports.rememberWorkflowLoadCache = rememberWorkflowLoadCache;
//# sourceMappingURL=workflow-definition-cache.util.js.map