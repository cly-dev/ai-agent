"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeExternalAccountProfile = exports.tokenIdentityDigest = void 0;
const crypto_1 = require("crypto");
function sanitizeIdentitySegment(value) {
    const trimmed = value.trim().toLowerCase();
    const sanitized = trimmed
        .replace(/[^a-z0-9._-]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return sanitized || 'user';
}
function tokenIdentityDigest(accountToken) {
    return (0, crypto_1.createHash)('sha256')
        .update(accountToken.trim())
        .digest('hex')
        .slice(0, 24);
}
exports.tokenIdentityDigest = tokenIdentityDigest;
function normalizeExternalAccountProfile(partial, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const tokenDigest = tokenIdentityDigest(input.accountToken);
    const employeeId = ((_a = partial.employeeId) === null || _a === void 0 ? void 0 : _a.trim()) ||
        ((_b = partial.username) === null || _b === void 0 ? void 0 : _b.trim()) ||
        `tok_${tokenDigest}`;
    const username = ((_c = partial.nickName) === null || _c === void 0 ? void 0 : _c.trim()) ||
        ((_d = partial.cnName) === null || _d === void 0 ? void 0 : _d.trim()) ||
        ((_e = partial.username) === null || _e === void 0 ? void 0 : _e.trim()) ||
        employeeId;
    const email = ((_f = partial.email) === null || _f === void 0 ? void 0 : _f.trim()) ||
        `${sanitizeIdentitySegment(employeeId)}@app-${input.appClientId}.ext.agent.local`;
    return {
        employeeId,
        email,
        username,
        nickName: (_g = partial.nickName) === null || _g === void 0 ? void 0 : _g.trim(),
        cnName: (_h = partial.cnName) === null || _h === void 0 ? void 0 : _h.trim(),
        active: partial.active !== false,
    };
}
exports.normalizeExternalAccountProfile = normalizeExternalAccountProfile;
//# sourceMappingURL=app-client-auth-profile.util.js.map