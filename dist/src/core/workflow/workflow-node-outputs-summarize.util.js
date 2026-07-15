"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPriorOutputsForDetectClues = exports.workflowNodeOutputsToSummarizeObservations = exports.compactWorkflowNodeOutputForSummarize = void 0;
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function compactWorkflowNodeOutputForSummarize(ref, value) {
    var _a, _b;
    if (!isRecord(value)) {
        return value;
    }
    if (ref.includes('summarize_images') || ref.includes(':summarize_images:')) {
        const cellsRaw = value.cells;
        const cells = Array.isArray(cellsRaw)
            ? cellsRaw.map((cell) => {
                if (!isRecord(cell)) {
                    return cell;
                }
                return {
                    index: cell.index,
                    url: cell.url,
                    status: cell.status,
                    summary: cell.summary,
                    legible: cell.legible,
                    cached: cell.cached,
                    error: cell.error,
                };
            })
            : [];
        return Object.assign({ panelVersion: (_a = value.panelVersion) !== null && _a !== void 0 ? _a : 1, cells, omittedCount: (_b = value.omittedCount) !== null && _b !== void 0 ? _b : 0 }, (typeof value.visionError === 'string'
            ? { visionError: value.visionError }
            : {}));
    }
    try {
        const text = JSON.stringify(value);
        if (text.length <= 4000) {
            return value;
        }
        return {
            _truncated: true,
            preview: `${text.slice(0, 4000)}…`,
        };
    }
    catch (_c) {
        return String(value);
    }
}
exports.compactWorkflowNodeOutputForSummarize = compactWorkflowNodeOutputForSummarize;
function workflowNodeOutputsToSummarizeObservations(nodeOutputs) {
    if (!nodeOutputs || Object.keys(nodeOutputs).length === 0) {
        return [];
    }
    const rows = [];
    for (const [ref, value] of Object.entries(nodeOutputs)) {
        rows.push({
            name: ref,
            output: compactWorkflowNodeOutputForSummarize(ref, value),
            quality: 'high',
        });
    }
    return rows;
}
exports.workflowNodeOutputsToSummarizeObservations = workflowNodeOutputsToSummarizeObservations;
function formatPriorOutputsForDetectClues(priorOutputs, maxLen = 6000) {
    const entries = Object.entries(priorOutputs);
    if (entries.length === 0) {
        return '{}';
    }
    const imageEntries = entries.filter(([ref]) => ref.includes('summarize_images'));
    const otherEntries = entries.filter(([ref]) => !ref.includes('summarize_images'));
    const ordered = [...imageEntries, ...otherEntries];
    const imageBudget = Math.min(2500, Math.floor(maxLen * 0.45));
    const otherBudget = Math.max(800, maxLen - imageBudget);
    const parts = [];
    let used = 2;
    for (const [ref, value] of ordered) {
        const isImage = ref.includes('summarize_images');
        const budget = isImage ? imageBudget : otherBudget;
        const compact = isImage
            ? compactWorkflowNodeOutputForSummarize(ref, value)
            : value;
        let text;
        try {
            text = JSON.stringify(compact);
        }
        catch (_a) {
            text = String(compact);
        }
        if (text.length > budget) {
            text = `${text.slice(0, budget)}…`;
        }
        const piece = `${JSON.stringify(ref)}:${text}`;
        if (used + piece.length + 1 > maxLen) {
            if (isImage && parts.length === 0) {
                const room = Math.max(200, maxLen - used - 20);
                parts.push(`${JSON.stringify(ref)}:${text.slice(0, room)}…`);
            }
            break;
        }
        parts.push(piece);
        used += piece.length + 1;
    }
    return `{${parts.join(',')}}`;
}
exports.formatPriorOutputsForDetectClues = formatPriorOutputsForDetectClues;
//# sourceMappingURL=workflow-node-outputs-summarize.util.js.map