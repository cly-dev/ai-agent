"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCapabilityKey = void 0;
const common_1 = require("@nestjs/common");
const CAPABILITY_KEY_PATTERN = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*$/;
function normalizeCapabilityKey(value) {
    if (value == null) {
        return null;
    }
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
        return null;
    }
    if (!CAPABILITY_KEY_PATTERN.test(trimmed)) {
        throw new common_1.BadRequestException('capabilityKey must be lowercase segments separated by dots, e.g. order.inquiry');
    }
    return trimmed;
}
exports.normalizeCapabilityKey = normalizeCapabilityKey;
//# sourceMappingURL=skill-capability-key.util.js.map