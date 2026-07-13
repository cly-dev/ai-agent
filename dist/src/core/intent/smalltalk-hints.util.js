"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSmallTalkHints = void 0;
const fs = require("fs");
const path = require("path");
let cachedHints = null;
function loadSmallTalkHints() {
    if (cachedHints) {
        return cachedHints;
    }
    const file = path.join(process.cwd(), 'src', 'core', 'intent', 'smalltalk-hints.json');
    try {
        const raw = fs.readFileSync(file, 'utf-8');
        const parsed = JSON.parse(raw);
        cachedHints = Array.isArray(parsed === null || parsed === void 0 ? void 0 : parsed.hints)
            ? parsed.hints
                .map((item) => typeof item === 'string' ? item.trim().toLowerCase() : '')
                .filter((item) => item.length > 0)
            : [];
        return cachedHints;
    }
    catch (_a) {
        cachedHints = [];
        return cachedHints;
    }
}
exports.loadSmallTalkHints = loadSmallTalkHints;
//# sourceMappingURL=smalltalk-hints.util.js.map