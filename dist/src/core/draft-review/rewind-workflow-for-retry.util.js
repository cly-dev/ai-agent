"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripNodeOutputsForRetry = exports.rewindWorkflowForDraftRetry = void 0;
const workflow_ir_native_phase_util_1 = require("../workflow/workflow-ir-native-phase.util");
const workflow_run_util_1 = require("../workflow/workflow-run.util");
function cloneRun(run) {
    return Object.assign(Object.assign({}, run), { nodes: run.nodes.map((node) => (Object.assign({}, node))) });
}
function findRetryTargetNodeId(nodes, run) {
    var _a;
    const ordered = nodes.map((row) => row.id);
    const awaitIndex = ordered.findIndex((id) => { var _a; return ((_a = nodes.find((row) => row.id === id)) === null || _a === void 0 ? void 0 : _a.action) === 'await_user_confirm'; });
    const searchEnd = awaitIndex >= 0 ? awaitIndex : ordered.length;
    const candidates = ordered.slice(0, searchEnd);
    for (const action of ['compose_mutation', 'present_mutation', 'summarize']) {
        const match = [...candidates]
            .reverse()
            .find((id) => { var _a; return ((_a = nodes.find((row) => row.id === id)) === null || _a === void 0 ? void 0 : _a.action) === action; });
        if (match) {
            return match;
        }
    }
    return (_a = candidates[candidates.length - 1]) !== null && _a !== void 0 ? _a : run.currentNodeId;
}
function rewindWorkflowForDraftRetry(input) {
    const retryNodeId = findRetryTargetNodeId(input.workflowNodeDefs, input.workflowRun);
    if (!retryNodeId) {
        return {
            workflowRun: input.workflowRun,
            retryNodeId: null,
            clearedOutputKeys: [],
        };
    }
    const retryIndex = input.workflowNodeDefs.findIndex((row) => row.id === retryNodeId);
    const next = cloneRun(input.workflowRun);
    next.status = 'running';
    for (let index = 0; index < next.nodes.length; index += 1) {
        const node = next.nodes[index];
        if (index < retryIndex) {
            continue;
        }
        node.status = 'pending';
        delete node.startedAt;
        delete node.finishedAt;
        delete node.outputRef;
        delete node.error;
        const def = input.workflowNodeDefs.find((row) => row.id === node.nodeId);
        if (def) {
            node.action = def.action;
            node.name = def.name;
        }
        if (node.phase != null && input.ir) {
            const irNode = input.ir.nodes.find((n) => n.id === node.nodeId);
            if (irNode) {
                const entry = (0, workflow_ir_native_phase_util_1.resolveWorkflowIrNativePhases)(irNode)[0];
                const phaseDef = (0, workflow_ir_native_phase_util_1.materializeWorkflowIrNodeForPhase)(irNode, entry);
                node.phase = entry;
                node.action = phaseDef.action;
                node.name = phaseDef.name;
            }
        }
        else if (node.phase === 'await' && (def === null || def === void 0 ? void 0 : def.action) === 'present_mutation') {
            node.phase = 'present';
        }
    }
    const started = (0, workflow_run_util_1.startWorkflowNode)(next, retryNodeId);
    const clearedOutputKeys = [];
    const outputs = Object.assign({}, input.nodeOutputs);
    for (const def of input.workflowNodeDefs.slice(retryIndex)) {
        for (const key of [
            def.id,
            `obs:${def.action}:${def.id}`,
            `obs:present_mutation:${def.id}`,
            `obs:compose_mutation:${def.id}`,
            `obs:summarize:${def.id}`,
        ]) {
            if (key in outputs) {
                delete outputs[key];
                clearedOutputKeys.push(key);
            }
        }
        if (def.action === 'compose_mutation') {
            const composeKey = 'page_compose_mutation';
            for (const key of Object.keys(outputs)) {
                const raw = outputs[key];
                if (raw &&
                    typeof raw === 'object' &&
                    !Array.isArray(raw) &&
                    composeKey in raw) {
                    delete outputs[key];
                    clearedOutputKeys.push(key);
                }
            }
        }
    }
    return {
        workflowRun: started,
        retryNodeId,
        clearedOutputKeys,
    };
}
exports.rewindWorkflowForDraftRetry = rewindWorkflowForDraftRetry;
function stripNodeOutputsForRetry(nodeOutputs, clearedKeys) {
    const next = Object.assign({}, nodeOutputs);
    for (const key of clearedKeys) {
        delete next[key];
    }
    return next;
}
exports.stripNodeOutputsForRetry = stripNodeOutputsForRetry;
//# sourceMappingURL=rewind-workflow-for-retry.util.js.map