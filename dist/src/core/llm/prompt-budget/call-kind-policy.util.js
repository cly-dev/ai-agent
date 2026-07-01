"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCallKindPolicyToBlock = exports.resolveCallKindPolicy = void 0;
const SKIP_FIT_KINDS = new Set([
    'compression',
    'gather_page_summary',
    'schema_inference',
]);
function resolveCallKindPolicy(callKind, skipFit) {
    if (skipFit) {
        return { skipFit: true };
    }
    const kind = callKind !== null && callKind !== void 0 ? callKind : 'default';
    if (SKIP_FIT_KINDS.has(kind)) {
        return { skipFit: true };
    }
    switch (kind) {
        case 'decision':
            return {
                maxDegradeLevelByKind: {
                    current_run_observations: 2,
                    tool_schema: 2,
                    host_tool_schema: 2,
                },
            };
        case 'summarize':
            return {
                maxDegradeLevelByKind: {
                    current_user_request: 0,
                    plan_context: 1,
                    pending_write_tool_call: 0,
                    current_run_observations: 2,
                    summarize_context: 2,
                    tool_schema: 2,
                    host_tool_schema: 2,
                    tool_decision: 4,
                },
            };
        case 'plan':
            return {
                maxDegradeLevelByKind: {
                    session_goa: 1,
                    tool_schema: 4,
                    host_tool_schema: 4,
                },
            };
        case 'routing':
            return {
                maxDegradeLevelByKind: {
                    working_memory_observations: 4,
                    current_run_observations: 4,
                    session_goa: 3,
                    tool_schema: 4,
                },
            };
        default:
            return {};
    }
}
exports.resolveCallKindPolicy = resolveCallKindPolicy;
function applyCallKindPolicyToBlock(kind, baseMaxDegrade, policy) {
    var _a;
    const cap = (_a = policy.maxDegradeLevelByKind) === null || _a === void 0 ? void 0 : _a[kind];
    if (cap == null) {
        return baseMaxDegrade;
    }
    return Math.min(baseMaxDegrade, cap);
}
exports.applyCallKindPolicyToBlock = applyCallKindPolicyToBlock;
//# sourceMappingURL=call-kind-policy.util.js.map