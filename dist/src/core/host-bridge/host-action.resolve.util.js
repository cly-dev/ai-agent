"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveHostActionMetadata = exports.parseSkillHostBridgeConfig = void 0;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function parseSkillHostBridgeConfig(skillConfig) {
    if (!isRecord(skillConfig)) {
        return null;
    }
    const hostBridge = skillConfig.hostBridge;
    if (!isRecord(hostBridge)) {
        return null;
    }
    const reason = typeof hostBridge.reason === 'string' ? hostBridge.reason.trim() : '';
    return reason ? { reason } : null;
}
exports.parseSkillHostBridgeConfig = parseSkillHostBridgeConfig;
function resolveHostActionMetadata(pageContext) {
    const metadata = pageContext === null || pageContext === void 0 ? void 0 : pageContext.metadata;
    if (!metadata || !isRecord(metadata)) {
        return undefined;
    }
    return Object.keys(metadata).length > 0 ? Object.assign({}, metadata) : undefined;
}
exports.resolveHostActionMetadata = resolveHostActionMetadata;
//# sourceMappingURL=host-action.resolve.util.js.map