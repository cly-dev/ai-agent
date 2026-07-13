"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHostToolStreamEnabled = void 0;
function isHostToolStreamEnabled() {
    var _a;
    const raw = (_a = process.env.HOST_TOOL_STREAM) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    if (raw === '0' || raw === 'false' || raw === 'off' || raw === 'no') {
        return false;
    }
    return true;
}
exports.isHostToolStreamEnabled = isHostToolStreamEnabled;
//# sourceMappingURL=host-tool-stream-env.util.js.map