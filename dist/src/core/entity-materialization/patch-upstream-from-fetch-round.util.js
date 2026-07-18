"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchUpstreamEntitiesAfterFetchRound = void 0;
const tool_output_projection_util_1 = require("../tool-engine/tool-output-projection.util");
const workflow_node_output_util_1 = require("../workflow/workflow-node-output.util");
const record_entity_materialization_util_1 = require("./record-entity-materialization.util");
const entity_materializer_util_1 = require("./entity-materializer.util");
function newlyCompletedStepIds(planBefore, planAfter) {
    var _a;
    if (!planAfter) {
        return [];
    }
    const before = new Set((_a = planBefore === null || planBefore === void 0 ? void 0 : planBefore.completedStepIds) !== null && _a !== void 0 ? _a : []);
    return planAfter.completedStepIds.filter((id) => !before.has(id));
}
function patchUpstreamEntitiesAfterFetchRound(input) {
    var _a, _b, _c;
    const completedIds = newlyCompletedStepIds(input.planBefore, input.planAfter);
    if (completedIds.length === 0 || input.roundObservationIndices.length === 0) {
        return null;
    }
    const fetchNodeIds = completedIds.filter((stepId) => {
        var _a;
        const def = (_a = input.state.workflowNodeDefs) === null || _a === void 0 ? void 0 : _a.find((row) => row.id === stepId);
        return (def === null || def === void 0 ? void 0 : def.action) === 'fetch_data';
    });
    if (fetchNodeIds.length === 0) {
        return null;
    }
    let entities = [
        ...((_a = input.state.materializedEntities) !== null && _a !== void 0 ? _a : []),
    ];
    const workflowNodeOutputs = Object.assign({}, ((_b = input.state.workflowNodeOutputs) !== null && _b !== void 0 ? _b : {}));
    let changed = false;
    for (const nodeId of fetchNodeIds) {
        for (const index of input.roundObservationIndices) {
            const observation = input.allObservations[index];
            if (!observation) {
                continue;
            }
            const tool = input.state.scopedTools.find((row) => row.name === observation.name);
            const profile = (0, tool_output_projection_util_1.parseResponseProfile)(tool === null || tool === void 0 ? void 0 : tool.responseProfile);
            const incoming = (0, entity_materializer_util_1.materializeEntitiesFromToolOutput)({
                raw: observation.output,
                profile,
            });
            if (incoming.length === 0) {
                continue;
            }
            entities = (0, entity_materializer_util_1.mergeMaterializedEntities)(entities, incoming);
            workflowNodeOutputs[(0, workflow_node_output_util_1.buildWorkflowNodeOutputRef)('fetch_data', nodeId)] = {
                toolName: observation.name,
                toolId: (_c = tool === null || tool === void 0 ? void 0 : tool.id) !== null && _c !== void 0 ? _c : null,
                output: observation.output,
            };
            changed = true;
        }
    }
    if (!changed) {
        return null;
    }
    const nextStep = input.steps.length > 0
        ? Math.max(...input.steps.map((row) => row.step)) + 1
        : 1;
    const steps = [
        ...input.steps,
        (0, record_entity_materialization_util_1.buildAgentEntityMaterializationStep)({
            step: nextStep,
            entities,
            name: 'entity_materialization_upstream',
        }),
    ];
    return {
        materializedEntities: entities,
        workflowNodeOutputs,
        steps,
    };
}
exports.patchUpstreamEntitiesAfterFetchRound = patchUpstreamEntitiesAfterFetchRound;
//# sourceMappingURL=patch-upstream-from-fetch-round.util.js.map