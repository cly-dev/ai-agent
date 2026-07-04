"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyWorkflowOverrides = void 0;
function applyWorkflowOverrides(nodes, overrides) {
    if (!overrides || Object.keys(overrides).length === 0) {
        return nodes.map((node) => (Object.assign(Object.assign({}, node), { input: Object.assign({}, node.input) })));
    }
    return nodes.map((node) => {
        const override = overrides[node.id];
        if (!(override === null || override === void 0 ? void 0 : override.objective)) {
            return Object.assign(Object.assign({}, node), { input: Object.assign({}, node.input) });
        }
        return Object.assign(Object.assign({}, node), { objective: override.objective, input: Object.assign({}, node.input) });
    });
}
exports.applyWorkflowOverrides = applyWorkflowOverrides;
//# sourceMappingURL=apply-workflow-overrides.util.js.map