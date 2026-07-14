"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeRunRoundObservations = exports.formatSplitObservationsFromState = exports.allToolObservations = exports.splitToolObservationsFromState = exports.runOwnedToolObservations = exports.preloadedToolObservations = void 0;
const observation_format_util_1 = require("./observation-format.util");
function preloadedToolObservations(state) {
    var _a;
    return (_a = state.preloadedToolObservations) !== null && _a !== void 0 ? _a : [];
}
exports.preloadedToolObservations = preloadedToolObservations;
function runOwnedToolObservations(state) {
    return state.toolObservations;
}
exports.runOwnedToolObservations = runOwnedToolObservations;
function splitToolObservationsFromState(state) {
    return {
        workingMemory: preloadedToolObservations(state),
        currentRun: runOwnedToolObservations(state),
    };
}
exports.splitToolObservationsFromState = splitToolObservationsFromState;
function allToolObservations(state) {
    return [...preloadedToolObservations(state), ...runOwnedToolObservations(state)];
}
exports.allToolObservations = allToolObservations;
function formatSplitObservationsFromState(state) {
    const split = splitToolObservationsFromState(state);
    return (0, observation_format_util_1.formatSplitObservationsPromptBlock)({
        workingMemory: (0, observation_format_util_1.toolObservationsToPayloads)(split.workingMemory, 'session'),
        currentRun: (0, observation_format_util_1.toolObservationsToPayloads)(split.currentRun, 'current_run'),
    });
}
exports.formatSplitObservationsFromState = formatSplitObservationsFromState;
function mergeRunRoundObservations(state, mergedFromRound) {
    const baselineLen = allToolObservations(state).length;
    const added = mergedFromRound.slice(baselineLen);
    if (added.length === 0) {
        return state.toolObservations;
    }
    return [...state.toolObservations, ...added];
}
exports.mergeRunRoundObservations = mergeRunRoundObservations;
//# sourceMappingURL=graph-tool-observations.util.js.map