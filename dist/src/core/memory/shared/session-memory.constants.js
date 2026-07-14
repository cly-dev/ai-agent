"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionMemoryMaxObservationLedgerEntries = exports.getSessionMemoryMaxObservationSnapshots = exports.ARTIFACT_SUMMARY_MAX_CHARS = exports.EPISODE_OUTCOME_MAX_CHARS = exports.EPISODE_GOAL_MAX_CHARS = exports.getSessionMemoryMaxArtifacts = exports.getSessionMemoryMaxEpisodes = void 0;
function readPositiveInt(envKey, defaultValue) {
    const raw = process.env[envKey];
    if (raw === undefined || raw === '') {
        return defaultValue;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : defaultValue;
}
function getSessionMemoryMaxEpisodes() {
    return readPositiveInt('SESSION_MEMORY_MAX_EPISODES', 8);
}
exports.getSessionMemoryMaxEpisodes = getSessionMemoryMaxEpisodes;
function getSessionMemoryMaxArtifacts() {
    return readPositiveInt('SESSION_MEMORY_MAX_ARTIFACTS', 12);
}
exports.getSessionMemoryMaxArtifacts = getSessionMemoryMaxArtifacts;
exports.EPISODE_GOAL_MAX_CHARS = 240;
exports.EPISODE_OUTCOME_MAX_CHARS = 600;
exports.ARTIFACT_SUMMARY_MAX_CHARS = 480;
function getSessionMemoryMaxObservationSnapshots() {
    return readPositiveInt('SESSION_MEMORY_MAX_OBSERVATION_SNAPSHOTS', 4);
}
exports.getSessionMemoryMaxObservationSnapshots = getSessionMemoryMaxObservationSnapshots;
function getSessionMemoryMaxObservationLedgerEntries() {
    return readPositiveInt('SESSION_MEMORY_MAX_OBSERVATION_LEDGER', 200);
}
exports.getSessionMemoryMaxObservationLedgerEntries = getSessionMemoryMaxObservationLedgerEntries;
//# sourceMappingURL=session-memory.constants.js.map