"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveSkillExecutionChannelsFromIr = void 0;
function deriveSkillExecutionChannelsFromIr(input) {
    const { ir } = input;
    if (ir.nodes.length === 0) {
        return {
            httpRead: false,
            httpMutation: false,
            hostPush: false,
            primaryWriteChannel: null,
        };
    }
    const types = new Set(ir.nodes.map((n) => n.type));
    const httpRead = types.has('data_query');
    const hostPush = types.has('host_effect');
    const hasWriteTool = types.has('tool_call');
    const hasCompose = types.has('data_transform') &&
        ir.nodes.some((n) => {
            var _a;
            return n.type === 'data_transform' &&
                ((_a = n.config) === null || _a === void 0 ? void 0 : _a.purpose) === 'compose_mutation';
        });
    const hasHumanConfirm = types.has('human_task');
    const httpMutation = hasWriteTool || (hasCompose && hasHumanConfirm);
    const primaryWriteChannel = (() => {
        if (httpMutation) {
            return 'http';
        }
        if (hostPush) {
            return 'host';
        }
        return null;
    })();
    return {
        httpRead,
        httpMutation,
        hostPush,
        primaryWriteChannel,
    };
}
exports.deriveSkillExecutionChannelsFromIr = deriveSkillExecutionChannelsFromIr;
//# sourceMappingURL=derive-skill-execution-channels-from-ir.util.js.map