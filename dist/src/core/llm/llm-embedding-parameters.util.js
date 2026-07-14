"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readEmbeddingRuntimeParameters = void 0;
function readEmbeddingRuntimeParameters(config) {
    var _a, _b;
    const params = normalizeJsonObject(config === null || config === void 0 ? void 0 : config.parameters);
    const allowRemote = params.allowRemoteModels === true ||
        ((_a = process.env.AGENT_EMBEDDING_LOCAL_ALLOW_REMOTE) === null || _a === void 0 ? void 0 : _a.trim()) === 'true';
    const fromDb = typeof params.localModelPath === 'string'
        ? params.localModelPath.trim()
        : '';
    const localModelPath = fromDb ||
        ((_b = process.env.AGENT_EMBEDDING_LOCAL_MODEL_PATH) === null || _b === void 0 ? void 0 : _b.trim()) ||
        undefined;
    return {
        allowRemoteModels: allowRemote,
        localModelPath,
    };
}
exports.readEmbeddingRuntimeParameters = readEmbeddingRuntimeParameters;
function normalizeJsonObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return value;
}
//# sourceMappingURL=llm-embedding-parameters.util.js.map