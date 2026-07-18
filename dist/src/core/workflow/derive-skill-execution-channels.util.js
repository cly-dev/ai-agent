"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveSkillExecutionChannels = exports.EMPTY_SKILL_EXECUTION_CHANNELS = void 0;
exports.EMPTY_SKILL_EXECUTION_CHANNELS = {
    httpRead: false,
    httpMutation: false,
    hostPush: false,
    primaryWriteChannel: null,
};
function deriveSkillExecutionChannels(input) {
    var _a;
    const nodes = (_a = input.nodes) !== null && _a !== void 0 ? _a : [];
    if (nodes.length > 0) {
        const httpRead = nodes.some((n) => n.irType === 'data_query' || n.action === 'fetch_data');
        const hostPush = nodes.some((n) => n.irType === 'host_effect' || n.action === 'generate_and_push');
        const httpMutation = input.deliverable === 'mutation' ||
            nodes.some((n) => n.irType === 'tool_call' || n.action === 'write_data') ||
            (nodes.some((n) => n.irType === 'data_transform' || n.action === 'compose_mutation') &&
                nodes.some((n) => n.irType === 'human_task' || n.action === 'await_user_confirm'));
        const primaryWriteChannel = (() => {
            if (input.deliverable === 'mutation' || httpMutation) {
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
    return {
        httpRead: input.skillToolIds.length > 0,
        httpMutation: false,
        hostPush: input.hostToolIds.length > 0,
        primaryWriteChannel: input.hostToolIds.length > 0 ? 'host' : null,
    };
}
exports.deriveSkillExecutionChannels = deriveSkillExecutionChannels;
//# sourceMappingURL=derive-skill-execution-channels.util.js.map