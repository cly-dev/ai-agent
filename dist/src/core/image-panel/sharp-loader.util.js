"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSharp = exports.tryLoadSharp = void 0;
let cached;
function tryLoadSharp() {
    if (cached !== undefined) {
        return cached;
    }
    try {
        cached = require('sharp');
        return cached;
    }
    catch (_a) {
        cached = null;
        return null;
    }
}
exports.tryLoadSharp = tryLoadSharp;
function requireSharp() {
    const sharp = tryLoadSharp();
    if (!sharp) {
        throw new Error('SHARP_UNAVAILABLE');
    }
    return sharp;
}
exports.requireSharp = requireSharp;
//# sourceMappingURL=sharp-loader.util.js.map