"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptySummarySensor = void 0;
exports.emptySummarySensor = {
    name: 'empty-summary',
    run(_ctx, payload) {
        var _a, _b, _c;
        const data = (payload !== null && payload !== void 0 ? payload : {});
        const mode = (_a = data.mode) !== null && _a !== void 0 ? _a : 'final';
        if (mode === 'draft') {
            return { name: 'empty-summary', verdict: 'pass' };
        }
        const summaryText = (_c = (_b = data.summaryText) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : '';
        if (summaryText.length > 0) {
            return { name: 'empty-summary', verdict: 'pass' };
        }
        return {
            name: 'empty-summary',
            verdict: 'fail',
            code: 'SUMMARY_EMPTY',
            message: 'summaryText is empty after summarize',
        };
    },
};
//# sourceMappingURL=empty-summary.sensor.js.map