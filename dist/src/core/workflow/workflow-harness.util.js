"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHarnessSensorPayload = void 0;
function buildHarnessSensorPayload(def, state, extra) {
    if (!def) {
        return extra !== null && extra !== void 0 ? extra : {};
    }
    switch (def.action) {
        case 'fetch_data': {
            const input = def.input;
            const payload = {
                observations: state.toolObservations,
                toolId: input.toolId,
            };
            return Object.assign(Object.assign({}, payload), extra);
        }
        case 'generate_and_push': {
            const payload = {
                fillText: typeof (extra === null || extra === void 0 ? void 0 : extra.fillText) === 'string' ? extra.fillText : undefined,
                dslOutcome: typeof (extra === null || extra === void 0 ? void 0 : extra.dslOutcome) === 'string' ? extra.dslOutcome : undefined,
            };
            return payload;
        }
        default:
            return extra !== null && extra !== void 0 ? extra : {};
    }
}
exports.buildHarnessSensorPayload = buildHarnessSensorPayload;
//# sourceMappingURL=workflow-harness.util.js.map