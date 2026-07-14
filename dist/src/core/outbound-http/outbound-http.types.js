"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboundHttpError = void 0;
class OutboundHttpError extends Error {
    constructor(message, kind) {
        super(message);
        this.name = 'OutboundHttpError';
        this.kind = kind;
    }
}
exports.OutboundHttpError = OutboundHttpError;
//# sourceMappingURL=outbound-http.types.js.map