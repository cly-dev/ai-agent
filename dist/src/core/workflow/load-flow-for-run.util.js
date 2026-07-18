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
exports.loadFlowForRun = exports.loadFlowForRunDetailed = void 0;
const apply_workflow_overrides_util_1 = require("./apply-workflow-overrides.util");
const materialize_workflow_graph_from_ir_util_1 = require("./materialize-workflow-graph-from-ir.util");
const parse_workflow_ir_util_1 = require("./parse-workflow-ir.util");
const validate_workflow_ir_topology_util_1 = require("./validate-workflow-ir-topology.util");
const validate_workflow_against_scope_util_1 = require("./validate-workflow-against-scope.util");
const validate_workflow_util_1 = require("./validate-workflow.util");
const workflow_ir_native_direct_util_1 = require("./workflow-ir-native-direct.util");
const workflow_run_util_1 = require("./workflow-run.util");
async function loadFlowForRunDetailed(prisma, input) {
    var _a;
    const flow = await prisma.flow.findFirst({
        where: {
            id: input.flowId,
            appClientId: input.appClientId,
            isActive: true,
        },
    });
    if (!flow) {
        return {
            status: 'failed',
            reason: 'asset_missing',
            workflowId: input.flowId,
        };
    }
    let irJson = flow.ir;
    let version = flow.version;
    const pinVersion = (_a = input.flowVersion) !== null && _a !== void 0 ? _a : null;
    if (pinVersion != null && pinVersion !== flow.version) {
        const revision = await prisma.flowRevision.findUnique({
            where: {
                flowId_version: { flowId: flow.id, version: pinVersion },
            },
        });
        if (!revision) {
            return {
                status: 'failed',
                reason: 'revision_missing',
                workflowId: flow.id,
            };
        }
        irJson = revision.ir;
        version = revision.version;
    }
    const ir = (0, parse_workflow_ir_util_1.parseWorkflowIrDocument)(irJson);
    if (!ir || ir.nodes.length === 0) {
        return {
            status: 'failed',
            reason: 'empty_nodes',
            workflowId: flow.id,
        };
    }
    const irTopologyIssues = (0, validate_workflow_ir_topology_util_1.validateWorkflowIrTopology)(ir);
    if (irTopologyIssues.length > 0) {
        return {
            status: 'failed',
            reason: 'invalid_edges',
            workflowId: flow.id,
        };
    }
    let nodes;
    let edges;
    let entryNodeId;
    let materializedDirectFromIr;
    let executionMode;
    let irForRun;
    let phasesByNodeId;
    if ((0, workflow_ir_native_direct_util_1.isWorkflowIrNativeDirectEligible)(ir)) {
        try {
            const native = (0, workflow_ir_native_direct_util_1.buildNativeDirectGraphFromIr)(ir);
            nodes = native.nodes;
            edges = native.edges;
            entryNodeId = native.entryNodeId;
            materializedDirectFromIr = true;
            executionMode = 'ir_native_direct';
            irForRun = native.ir;
            phasesByNodeId = native.phasesByNodeId;
        }
        catch (_b) {
            return {
                status: 'failed',
                reason: 'invalid_edges',
                workflowId: flow.id,
            };
        }
    }
    else {
        let materialized;
        try {
            materialized = (0, materialize_workflow_graph_from_ir_util_1.materializeWorkflowGraphFromIr)(ir);
        }
        catch (_c) {
            return {
                status: 'failed',
                reason: 'invalid_edges',
                workflowId: flow.id,
            };
        }
        if (materialized.nodes.length === 0) {
            return {
                status: 'failed',
                reason: 'empty_nodes',
                workflowId: flow.id,
            };
        }
        nodes = materialized.nodes;
        edges = materialized.edges;
        entryNodeId = materialized.entryNodeId;
        materializedDirectFromIr = materialized.materializedDirectFromIr;
        executionMode = 'materialized_expand';
        irForRun = materialized.ir;
    }
    const topologyIssues = (0, validate_workflow_util_1.validateWorkflowTopology)({
        nodes,
        edges,
        entryNodeId,
    });
    if (topologyIssues.length > 0) {
        return {
            status: 'failed',
            reason: 'invalid_edges',
            workflowId: flow.id,
        };
    }
    const overridden = (0, apply_workflow_overrides_util_1.applyWorkflowOverrides)(nodes, input.workflowOverrides);
    if (input.scope) {
        const compatible = (0, validate_workflow_against_scope_util_1.isWorkflowCompatibleWithScope)({
            nodes: overridden,
            scope: input.scope,
        });
        if (!compatible) {
            return {
                status: 'failed',
                reason: 'scope_incompatible',
                workflowId: flow.id,
            };
        }
    }
    const workflowRun = (0, workflow_run_util_1.initWorkflowRun)({
        workflowId: flow.id,
        version,
        nodes: overridden,
        edges,
        entryNodeId,
        compiledFrom: 'flow_db',
        phasesByNodeId,
    });
    return {
        status: 'loaded',
        nodes: overridden,
        edges,
        entryNodeId,
        edgesDeclared: true,
        workflowRun,
        workflowId: flow.id,
        version,
        compiledFrom: 'flow_db',
        ir: irForRun,
        materializedDirectFromIr,
        executionMode,
    };
}
exports.loadFlowForRunDetailed = loadFlowForRunDetailed;
async function loadFlowForRun(prisma, input) {
    const result = await loadFlowForRunDetailed(prisma, input);
    if (result.status === 'loaded') {
        const { status: _status } = result, loaded = __rest(result, ["status"]);
        return loaded;
    }
    return null;
}
exports.loadFlowForRun = loadFlowForRun;
//# sourceMappingURL=load-flow-for-run.util.js.map