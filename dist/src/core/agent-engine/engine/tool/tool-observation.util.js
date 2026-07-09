"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldPreferSummarizeOverObservedTools = exports.hasSummarizableToolObservations = exports.observationsAreOnlyEmptyLists = exports.isEmptyListToolObservation = void 0;
const agent_run_user_messages_util_1 = require("../agent-run-user-messages.util");
function normalizeObservationPayload(output) {
    if (typeof output !== 'string') {
        return output;
    }
    const trimmed = output.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        return output;
    }
    try {
        return JSON.parse(trimmed);
    }
    catch (_a) {
        return output;
    }
}
function isEmptyListToolObservation(output) {
    var _a, _b, _c;
    const payload = normalizeObservationPayload(output);
    if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
        return Array.isArray(payload) && payload.length === 0;
    }
    const row = payload;
    const data = (_c = (_b = (_a = row.data) !== null && _a !== void 0 ? _a : row.list) !== null && _b !== void 0 ? _b : row.items) !== null && _c !== void 0 ? _c : row.records;
    if (Array.isArray(data)) {
        return data.length === 0;
    }
    return false;
}
exports.isEmptyListToolObservation = isEmptyListToolObservation;
function observationsAreOnlyEmptyLists(observations) {
    return (observations.length > 0 &&
        observations.every((row) => isEmptyListToolObservation(row.output)));
}
exports.observationsAreOnlyEmptyLists = observationsAreOnlyEmptyLists;
function hasSummarizableToolObservations(observations) {
    if (observations.length === 0 || observationsAreOnlyEmptyLists(observations)) {
        return false;
    }
    return observations.some((row) => row.output != null &&
        !(0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(row.output) &&
        !isEmptyListToolObservation(row.output));
}
exports.hasSummarizableToolObservations = hasSummarizableToolObservations;
function shouldPreferSummarizeOverObservedTools(llmText, observations) {
    if (observations.length === 0) {
        return false;
    }
    if (observationsAreOnlyEmptyLists(observations)) {
        return true;
    }
    const trimmed = llmText.trim();
    if (!trimmed) {
        return true;
    }
    const bulletLines = trimmed.match(/^\s*[-*•]\s+\S+/gm);
    const hasCapabilityList = bulletLines != null && bulletLines.length >= 2;
    const hasPayloadCue = /[{[\]}]|"data"|"items"|"records"|"total"|"count"|\b(id|sku|status)\b/i.test(trimmed);
    if (hasCapabilityList && !hasPayloadCue) {
        return true;
    }
    const endsWithOffer = /\?\s*$/.test(trimmed) &&
        /\b(help|assist|can i|how may|what can|anything else)\b/i.test(trimmed);
    return endsWithOffer && !hasPayloadCue && trimmed.length >= 40;
}
exports.shouldPreferSummarizeOverObservedTools = shouldPreferSummarizeOverObservedTools;
//# sourceMappingURL=tool-observation.util.js.map