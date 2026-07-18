"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWorkflowIntentForPersist = void 0;
const compile_workflow_ir_util_1 = require("./compile-workflow-ir.util");
const materialize_workflow_graph_from_ir_util_1 = require("./materialize-workflow-graph-from-ir.util");
const workflow_intent_types_1 = require("./workflow-intent.types");
const validate_workflow_ir_topology_util_1 = require("./validate-workflow-ir-topology.util");
const validate_workflow_intent_util_1 = require("./validate-workflow-intent.util");
const workflow_preset_util_1 = require("./workflow-preset.util");
function resolveWorkflowIntentForPersist(input) {
    if (input.preset != null && input.intent != null) {
        throw Object.assign(new Error('Provide either preset or intent, not both'), { code: 'WORKFLOW_PRESET_INTENT_CONFLICT' });
    }
    let intent;
    if (input.preset != null) {
        intent = (0, workflow_preset_util_1.expandWorkflowPresetToIntent)({
            preset: input.preset,
            profile: input.profile,
            config: (0, workflow_preset_util_1.parseWorkflowPresetConfig)(input.presetConfig),
        });
    }
    else if (input.intent != null) {
        const parsed = (0, validate_workflow_intent_util_1.parseWorkflowIntentJson)(input.intent);
        if (!parsed) {
            throw Object.assign(new Error(`intent must be WorkflowIntent version ${workflow_intent_types_1.WORKFLOW_INTENT_VERSION}`), { code: 'WORKFLOW_INTENT_INVALID' });
        }
        intent = Object.assign(Object.assign({}, parsed), { profile: input.profile });
    }
    else {
        throw Object.assign(new Error('Create/update requires intent or preset + presetConfig'), { code: 'WORKFLOW_INTENT_REQUIRED' });
    }
    const issues = (0, validate_workflow_intent_util_1.validateWorkflowIntent)(intent);
    if (issues.length > 0) {
        throw Object.assign(new Error('Workflow intent validation failed'), {
            code: 'WORKFLOW_INTENT_INVALID',
            issues,
        });
    }
    const compiled = (0, compile_workflow_ir_util_1.compileWorkflowIr)(intent);
    const ir = {
        version: 1,
        entryNodeId: compiled.entryNodeId,
        nodes: compiled.nodes,
        edges: compiled.edges,
    };
    const irTopologyIssues = (0, validate_workflow_ir_topology_util_1.validateWorkflowIrTopology)(ir);
    if (irTopologyIssues.length > 0) {
        throw Object.assign(new Error('Workflow IR topology validation failed'), {
            code: 'WORKFLOW_INTENT_INVALID',
            issues: irTopologyIssues,
        });
    }
    const materialized = (0, materialize_workflow_graph_from_ir_util_1.materializeWorkflowGraphFromIr)(ir);
    const legacyGraph = {
        nodes: materialized.nodes,
        edges: materialized.edges,
        entryNodeId: materialized.entryNodeId,
    };
    return { intent, ir, legacyGraph };
}
exports.resolveWorkflowIntentForPersist = resolveWorkflowIntentForPersist;
//# sourceMappingURL=resolve-workflow-intent-persist.util.js.map