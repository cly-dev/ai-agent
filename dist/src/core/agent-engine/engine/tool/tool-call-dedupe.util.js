"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partitionToolCallsByHistory = exports.getExecutedToolCallSignaturesFromSteps = exports.areToolCallRoundsIdentical = exports.getLastToolRoundFromSteps = exports.toolCallSignature = exports.stableSerializeToolCallArgs = void 0;
const tool_call_args_util_1 = require("../../../llm/tool-call-args.util");
function sortKeysDeep(value) {
    if (Array.isArray(value)) {
        return value.map(sortKeysDeep);
    }
    if (value && typeof value === 'object') {
        const row = value;
        const sorted = {};
        for (const key of Object.keys(row).sort()) {
            sorted[key] = sortKeysDeep(row[key]);
        }
        return sorted;
    }
    return value;
}
function stableSerializeToolCallArgs(args) {
    return JSON.stringify(sortKeysDeep(args));
}
exports.stableSerializeToolCallArgs = stableSerializeToolCallArgs;
function toolCallSignature(call) {
    return `${call.name}\0${stableSerializeToolCallArgs(call.arguments)}`;
}
exports.toolCallSignature = toolCallSignature;
function getLastToolRoundFromSteps(steps) {
    const toolSteps = steps.filter((row) => row.type === 'tool');
    if (toolSteps.length === 0) {
        return [];
    }
    const lastStepNum = Math.max(...toolSteps.map((row) => { var _a; return (_a = row.step) !== null && _a !== void 0 ? _a : 0; }));
    return toolSteps
        .filter((row) => { var _a; return ((_a = row.step) !== null && _a !== void 0 ? _a : 0) === lastStepNum; })
        .map((row) => {
        var _a;
        return ({
            name: (_a = row.name) !== null && _a !== void 0 ? _a : '',
            arguments: (0, tool_call_args_util_1.normalizeToolCallArgs)(row.input),
        });
    })
        .filter((row) => row.name.length > 0);
}
exports.getLastToolRoundFromSteps = getLastToolRoundFromSteps;
function areToolCallRoundsIdentical(current, previous) {
    if (current.length === 0 || previous.length === 0) {
        return false;
    }
    if (current.length !== previous.length) {
        return false;
    }
    const currentSigs = current.map(toolCallSignature).sort();
    const previousSigs = previous.map(toolCallSignature).sort();
    return currentSigs.every((sig, index) => sig === previousSigs[index]);
}
exports.areToolCallRoundsIdentical = areToolCallRoundsIdentical;
function getExecutedToolCallSignaturesFromSteps(steps) {
    const signatures = new Set();
    for (const step of steps) {
        if (step.type !== 'tool' || !step.name) {
            continue;
        }
        signatures.add(toolCallSignature({
            name: step.name,
            arguments: (0, tool_call_args_util_1.normalizeToolCallArgs)(step.input),
        }));
    }
    return signatures;
}
exports.getExecutedToolCallSignaturesFromSteps = getExecutedToolCallSignaturesFromSteps;
function partitionToolCallsByHistory(calls, steps) {
    const executed = getExecutedToolCallSignaturesFromSteps(steps);
    const novel = [];
    const duplicates = [];
    for (const call of calls) {
        if (executed.has(toolCallSignature(call))) {
            duplicates.push(call);
        }
        else {
            novel.push(call);
        }
    }
    return { novel, duplicates };
}
exports.partitionToolCallsByHistory = partitionToolCallsByHistory;
//# sourceMappingURL=tool-call-dedupe.util.js.map