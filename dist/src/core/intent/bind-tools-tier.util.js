"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBindToolsTopK = exports.readBindToolsTierConfig = void 0;
const DEFAULT_FULL_BIND_MAX = 5;
const DEFAULT_RECALL_BIND_MAX = 5;
function readBindToolsTierConfig(recall) {
    return {
        fullBindMax: readPositiveIntEnv('AGENT_BIND_FULL_MAX', DEFAULT_FULL_BIND_MAX),
        recallBindMax: readPositiveIntEnv('AGENT_BIND_RECALL_MAX', readPositiveIntEnv('AGENT_BIND_MEDIUM_MAX', DEFAULT_RECALL_BIND_MAX)),
        hardCap: recall.bindToolsMax,
    };
}
exports.readBindToolsTierConfig = readBindToolsTierConfig;
function resolveBindToolsTopK(candidateCount, cfg) {
    if (candidateCount <= 0) {
        return { topK: 0, tier: 'full', recallRequired: false };
    }
    if (candidateCount <= cfg.fullBindMax) {
        return {
            topK: candidateCount,
            tier: 'full',
            recallRequired: false,
        };
    }
    const topK = Math.min(cfg.recallBindMax, cfg.hardCap, candidateCount);
    return {
        topK,
        tier: 'recall',
        recallRequired: candidateCount > topK,
    };
}
exports.resolveBindToolsTopK = resolveBindToolsTopK;
function readPositiveIntEnv(name, fallback) {
    var _a;
    const raw = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw) {
        return fallback;
    }
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}
//# sourceMappingURL=bind-tools-tier.util.js.map