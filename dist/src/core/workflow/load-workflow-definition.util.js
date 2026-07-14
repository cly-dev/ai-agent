"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toWorkflowDefinition = exports.loadWorkflowForRun = exports.loadWorkflowForRunDetailed = exports.parseWorkflowOverridesJson = exports.parseWorkflowNodesJson = void 0;
const apply_workflow_overrides_util_1 = require("./apply-workflow-overrides.util");
const workflow_run_util_1 = require("./workflow-run.util");
const workflow_definition_cache_util_1 = require("./workflow-definition-cache.util");
const validate_workflow_against_scope_util_1 = require("./validate-workflow-against-scope.util");
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function parseWorkflowNodesJson(value) {
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
exports.parseWorkflowNodesJson = parseWorkflowNodesJson;
function parseWorkflowOverridesJson(value) {
    if (!isRecord(value)) {
        return null;
    }
    const overrides = {};
    for (const [nodeId, patch] of Object.entries(value)) {
        if (!isRecord(patch)) {
            continue;
        }
        if (typeof patch.objective === 'string') {
            overrides[nodeId] = { objective: patch.objective };
        }
    }
    return Object.keys(overrides).length > 0 ? overrides : null;
}
exports.parseWorkflowOverridesJson = parseWorkflowOverridesJson;
async function loadWorkflowForRunDetailed(prisma, input) {
    var _a;
    const workflow = await prisma.workflow.findFirst({
        where: {
            id: input.workflowId,
            appClientId: input.appClientId,
            isActive: true,
        },
        include: {
            workflowTools: true,
            workflowHostTools: true,
        },
    });
    if (!workflow) {
        return {
            status: 'failed',
            reason: 'asset_missing',
            workflowId: input.workflowId,
        };
    }
    const pinVersion = (_a = input.workflowVersion) !== null && _a !== void 0 ? _a : null;
    const cacheKey = (0, workflow_definition_cache_util_1.workflowLoadCacheKey)(input);
    let nodesJson = workflow.nodes;
    let version = workflow.version;
    let revisionFingerprint = null;
    if (pinVersion != null && pinVersion !== workflow.version) {
        const revision = await prisma.workflowRevision.findUnique({
            where: {
                workflowId_version: {
                    workflowId: workflow.id,
                    version: pinVersion,
                },
            },
        });
        if (!revision) {
            return {
                status: 'failed',
                reason: 'revision_missing',
                workflowId: workflow.id,
            };
        }
        nodesJson = revision.nodes;
        version = revision.version;
        revisionFingerprint = `${revision.id}:${revision.createdAt.toISOString()}`;
    }
    let baseNodes = (0, workflow_definition_cache_util_1.readCachedWorkflowLoad)(cacheKey, workflow.updatedAt, revisionFingerprint, version);
    if (!baseNodes) {
        baseNodes = parseWorkflowNodesJson(nodesJson);
        if (baseNodes.length > 0) {
            (0, workflow_definition_cache_util_1.rememberWorkflowLoadCache)(cacheKey, {
                workflowId: workflow.id,
                version,
                workflowUpdatedAt: workflow.updatedAt.toISOString(),
                revisionFingerprint,
                baseNodes,
            });
        }
    }
    if (baseNodes.length === 0) {
        return {
            status: 'failed',
            reason: 'empty_nodes',
            workflowId: workflow.id,
        };
    }
    const nodes = (0, apply_workflow_overrides_util_1.applyWorkflowOverrides)(baseNodes, input.workflowOverrides);
    if (input.scope) {
        const compatible = (0, validate_workflow_against_scope_util_1.isWorkflowCompatibleWithScope)({
            nodes,
            scope: input.scope,
        });
        if (!compatible) {
            return {
                status: 'failed',
                reason: 'scope_incompatible',
                workflowId: workflow.id,
            };
        }
    }
    const workflowRun = (0, workflow_run_util_1.initWorkflowRun)({
        workflowId: workflow.id,
        version,
        nodes,
        compiledFrom: 'workflow_db',
    });
    return {
        status: 'loaded',
        nodes,
        workflowRun,
        workflowId: workflow.id,
        version,
        compiledFrom: 'workflow_db',
    };
}
exports.loadWorkflowForRunDetailed = loadWorkflowForRunDetailed;
async function loadWorkflowForRun(prisma, input) {
    const result = await loadWorkflowForRunDetailed(prisma, input);
    if (result.status === 'loaded') {
        const { status: _status } = result, loaded = __rest(result, ["status"]);
        return loaded;
    }
    return null;
}
exports.loadWorkflowForRun = loadWorkflowForRun;
function toWorkflowDefinition(row) {
    var _a;
    return {
        workflowKey: row.workflowKey,
        name: row.name,
        profile: row.profile,
        goal: (_a = row.goal) !== null && _a !== void 0 ? _a : null,
        constraints: Array.isArray(row.constraints)
            ? row.constraints
            : [],
        nodes: parseWorkflowNodesJson(row.nodes),
    };
}
exports.toWorkflowDefinition = toWorkflowDefinition;
//# sourceMappingURL=load-workflow-definition.util.js.map