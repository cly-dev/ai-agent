"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePriorToolObservationsFromGoa = exports.buildObservationLedgerEntriesFromContext = exports.appendSessionObservationLedger = exports.isLedgerEligibleObservation = exports.sessionLedgerEntryKey = void 0;
const agent_run_user_messages_util_1 = require("../../agent-engine/engine/agent-run-user-messages.util");
const observation_format_util_1 = require("../../agent-engine/engine/observation-format.util");
const session_memory_constants_1 = require("../shared/session-memory.constants");
function stableJson(value) {
    try {
        return JSON.stringify(value);
    }
    catch (_a) {
        return String(value);
    }
}
function sessionLedgerEntryKey(row) {
    const args = (0, observation_format_util_1.compactArgsForObservation)(row.args);
    if (args && Object.keys(args).length > 0) {
        return `${row.name}:${stableJson(args)}`;
    }
    const output = stableJson(row.output);
    const clipped = output.length > 256 ? `${output.slice(0, 256)}…len=${output.length}` : output;
    return `${row.name}:${clipped}`;
}
exports.sessionLedgerEntryKey = sessionLedgerEntryKey;
function isLedgerEligibleObservation(row) {
    if (!row.name.trim()) {
        return false;
    }
    if ((0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(row.output)) {
        return false;
    }
    return row.output !== undefined;
}
exports.isLedgerEligibleObservation = isLedgerEligibleObservation;
function appendSessionObservationLedger(existing, incoming) {
    if (incoming.length === 0) {
        return existing;
    }
    const max = (0, session_memory_constants_1.getSessionMemoryMaxObservationLedgerEntries)();
    const byKey = new Map();
    for (const row of existing) {
        byKey.set(sessionLedgerEntryKey(row), row);
    }
    for (const row of incoming) {
        if (!isLedgerEligibleObservation(row)) {
            continue;
        }
        byKey.set(sessionLedgerEntryKey(row), row);
    }
    const merged = [...byKey.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return merged.slice(-max);
}
exports.appendSessionObservationLedger = appendSessionObservationLedger;
function buildObservationLedgerEntriesFromContext(input) {
    const now = new Date().toISOString();
    return input.newToolObservations
        .filter((row) => isLedgerEligibleObservation(row))
        .map((row) => (Object.assign({ runId: input.runId, turnId: input.turnId, name: row.name, output: row.output, createdAt: now }, ((0, observation_format_util_1.compactArgsForObservation)(row.args)
        ? { args: (0, observation_format_util_1.compactArgsForObservation)(row.args) }
        : {}))));
}
exports.buildObservationLedgerEntriesFromContext = buildObservationLedgerEntriesFromContext;
function mergePriorToolObservationsFromGoa(payload) {
    var _a;
    if (!payload) {
        return [];
    }
    const ledger = (_a = payload.sessionObservationLedger) !== null && _a !== void 0 ? _a : [];
    const active = payload.activeTask;
    const fromActive = active &&
        (active.status === 'in_progress' ||
            active.status === 'awaiting_confirmation')
        ? active.observationLog
        : [];
    const byKey = new Map();
    for (const row of ledger) {
        byKey.set(sessionLedgerEntryKey(row), row);
    }
    for (const row of fromActive) {
        byKey.set(sessionLedgerEntryKey(row), row);
    }
    const merged = [...byKey.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return merged.map((row) => ({ name: row.name, output: row.output }));
}
exports.mergePriorToolObservationsFromGoa = mergePriorToolObservationsFromGoa;
//# sourceMappingURL=session-goa-ledger.util.js.map