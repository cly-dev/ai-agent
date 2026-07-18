"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEntityFingerprint = void 0;
const node_crypto_1 = require("node:crypto");
function buildEntityFingerprint(input) {
    const normalized = `${input.source}\0${input.path.trim()}`;
    return (0, node_crypto_1.createHash)('sha256').update(normalized).digest('hex').slice(0, 16);
}
exports.buildEntityFingerprint = buildEntityFingerprint;
//# sourceMappingURL=entity-fingerprint.util.js.map