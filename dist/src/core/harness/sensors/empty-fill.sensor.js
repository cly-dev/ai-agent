"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyFillSensor = void 0;
exports.emptyFillSensor = {
    name: 'empty-fill',
    run(_ctx, payload) {
        var _a, _b, _c;
        const data = payload;
        const fillText = (_b = (_a = data === null || data === void 0 ? void 0 : data.fillText) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
        const dslOutcome = (_c = data === null || data === void 0 ? void 0 : data.dslOutcome) !== null && _c !== void 0 ? _c : null;
        if (fillText.length > 0 && dslOutcome === 'dispatched') {
            return { name: 'empty-fill', verdict: 'pass' };
        }
        if (fillText.length === 0) {
            return {
                name: 'empty-fill',
                verdict: 'fail',
                code: 'STREAM_EMPTY',
                message: 'fillText is empty after generate_and_push',
            };
        }
        return {
            name: 'empty-fill',
            verdict: 'fail',
            code: 'DSL_NOT_DISPATCHED',
            message: `dslOutcome is ${dslOutcome !== null && dslOutcome !== void 0 ? dslOutcome : 'null'}, expected dispatched`,
        };
    },
};
//# sourceMappingURL=empty-fill.sensor.js.map