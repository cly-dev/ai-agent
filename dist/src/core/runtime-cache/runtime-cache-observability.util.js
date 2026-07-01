"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logRuntimeCacheEvent = void 0;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('RuntimeCache');
function logRuntimeCacheEvent(input) {
    const { layer, operation, cacheHit, revisionMismatch, sessionId, agentId, appClientId, runId, extra, } = input;
    logger.debug(JSON.stringify(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ cacheLayer: layer, operation,
        cacheHit }, (revisionMismatch != null ? { revisionMismatch } : {})), (sessionId != null ? { sessionId } : {})), (agentId != null ? { agentId } : {})), (appClientId != null ? { appClientId } : {})), (runId != null ? { runId } : {})), extra)));
}
exports.logRuntimeCacheEvent = logRuntimeCacheEvent;
//# sourceMappingURL=runtime-cache-observability.util.js.map