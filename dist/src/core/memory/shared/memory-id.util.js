"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSessionContextId = exports.assertPositiveIntId = void 0;
const common_1 = require("@nestjs/common");
const SESSION_CONTEXT_ID_HEX = /^[a-f0-9]{32}$/;
function assertPositiveIntId(field, value) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new common_1.BadRequestException(`${field} must be a positive integer`);
    }
}
exports.assertPositiveIntId = assertPositiveIntId;
function assertSessionContextId(field, value) {
    const v = value.trim();
    if (!SESSION_CONTEXT_ID_HEX.test(v)) {
        throw new common_1.BadRequestException(`${field} must be a 32-character lowercase hex string`);
    }
}
exports.assertSessionContextId = assertSessionContextId;
//# sourceMappingURL=memory-id.util.js.map