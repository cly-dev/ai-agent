"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allocateWorkflowIntentStateKeys = exports.slugWorkflowIntentStateKey = void 0;
function slugWorkflowIntentStateKey(label) {
    const trimmed = label.trim();
    if (!trimmed) {
        return 'state';
    }
    const ascii = trimmed
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48);
    if (ascii.length > 0) {
        return ascii;
    }
    let hash = 0;
    for (let i = 0; i < trimmed.length; i += 1) {
        hash = (hash * 31 + trimmed.charCodeAt(i)) | 0;
    }
    return `s_${(hash >>> 0).toString(36)}`;
}
exports.slugWorkflowIntentStateKey = slugWorkflowIntentStateKey;
function allocateWorkflowIntentStateKeys(labels) {
    const used = new Set();
    return labels.map((label) => {
        const base = slugWorkflowIntentStateKey(label);
        let key = base;
        let n = 2;
        while (used.has(key)) {
            key = `${base}_${n}`;
            n += 1;
        }
        used.add(key);
        return key;
    });
}
exports.allocateWorkflowIntentStateKeys = allocateWorkflowIntentStateKeys;
//# sourceMappingURL=workflow-intent-state-key.util.js.map