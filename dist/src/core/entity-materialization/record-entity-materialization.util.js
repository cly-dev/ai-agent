"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentEntityMaterializationStep = exports.recordPageActionEntityMaterialization = void 0;
const entity_materialization_audit_util_1 = require("./entity-materialization-audit.util");
function recordPageActionEntityMaterialization(recorder, entities, options) {
    var _a;
    recorder.record({
        type: 'entity',
        name: (_a = options === null || options === void 0 ? void 0 : options.name) !== null && _a !== void 0 ? _a : 'entity_materialization',
        status: 'ok',
        detail: (0, entity_materialization_audit_util_1.serializeEntitiesForAudit)(entities),
    });
}
exports.recordPageActionEntityMaterialization = recordPageActionEntityMaterialization;
function buildAgentEntityMaterializationStep(input) {
    var _a;
    return {
        step: input.step,
        type: 'entity',
        name: (_a = input.name) !== null && _a !== void 0 ? _a : 'entity_materialization',
        output: (0, entity_materialization_audit_util_1.serializeEntitiesForAudit)(input.entities),
    };
}
exports.buildAgentEntityMaterializationStep = buildAgentEntityMaterializationStep;
//# sourceMappingURL=record-entity-materialization.util.js.map