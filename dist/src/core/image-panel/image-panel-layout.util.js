"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layoutForCount = void 0;
function layoutForCount(count) {
    const n = Math.max(0, Math.floor(count));
    if (n <= 1) {
        return { rows: 1, cols: 1 };
    }
    if (n === 2) {
        return { rows: 1, cols: 2 };
    }
    if (n <= 4) {
        return { rows: 2, cols: 2 };
    }
    return { rows: 2, cols: 3 };
}
exports.layoutForCount = layoutForCount;
//# sourceMappingURL=image-panel-layout.util.js.map