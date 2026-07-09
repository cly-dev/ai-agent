"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveInitialPlanRunContext = exports.planRunContextFromState = exports.planObservationBucketsFromState = exports.selectObservationsForPagedGatherResume = exports.selectObservationsForPlanToolSatisfaction = void 0;
const graph_tool_observations_util_1 = require("../../graph-tool-observations.util");
const page_context_usage_util_1 = require("../../../../host-bridge/page-context-usage.util");
function selectObservationsForPlanToolSatisfaction(buckets) {
    const pagePreloaded = buckets.preloaded.filter((row) => (0, page_context_usage_util_1.isPageContextSourcedObservation)(row));
    return [...pagePreloaded, ...buckets.runOwned];
}
exports.selectObservationsForPlanToolSatisfaction = selectObservationsForPlanToolSatisfaction;
function selectObservationsForPagedGatherResume(buckets) {
    return [...buckets.preloaded, ...buckets.runOwned];
}
exports.selectObservationsForPagedGatherResume = selectObservationsForPagedGatherResume;
function planObservationBucketsFromState(state) {
    return {
        preloaded: (0, graph_tool_observations_util_1.preloadedToolObservations)(state),
        runOwned: (0, graph_tool_observations_util_1.runOwnedToolObservations)(state),
    };
}
exports.planObservationBucketsFromState = planObservationBucketsFromState;
function planRunContextFromState(state) {
    var _a;
    return (_a = state.planRunContext) !== null && _a !== void 0 ? _a : 'fresh';
}
exports.planRunContextFromState = planRunContextFromState;
function resolveInitialPlanRunContext(input) {
    var _a;
    if (input.resumeFromWriteConfirm) {
        return 'resume';
    }
    if (((_a = input.graphInitialState) === null || _a === void 0 ? void 0 : _a.planRunContext) === 'resume') {
        return 'resume';
    }
    return 'fresh';
}
exports.resolveInitialPlanRunContext = resolveInitialPlanRunContext;
//# sourceMappingURL=plan-observation-scope.util.js.map