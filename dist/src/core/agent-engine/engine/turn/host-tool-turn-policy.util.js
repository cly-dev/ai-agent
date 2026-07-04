"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveHostToolTurnPolicy = void 0;
const disabled = {
    allowHostToolSteps: false,
    allowHostToolAutoDispatch: false,
    allowHostToolLlmDispatch: false,
};
const enabled = {
    allowHostToolSteps: true,
    allowHostToolAutoDispatch: true,
    allowHostToolLlmDispatch: true,
};
function resolveHostToolTurnPolicy(input) {
    if (input.route === 'direct_answer') {
        return disabled;
    }
    if (input.writeChannel === 'host') {
        return enabled;
    }
    if (input.pageContextPlan !== 'none') {
        return disabled;
    }
    return disabled;
}
exports.resolveHostToolTurnPolicy = resolveHostToolTurnPolicy;
//# sourceMappingURL=host-tool-turn-policy.util.js.map