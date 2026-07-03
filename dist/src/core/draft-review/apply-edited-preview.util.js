"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfirmedPreviewSerialized = void 0;
function resolveConfirmedPreviewSerialized(input) {
    var _a, _b;
    if (input.decision.action === 'confirm_with_edits' &&
        ((_a = input.decision.editedPreviewSerialized) === null || _a === void 0 ? void 0 : _a.trim())) {
        return input.decision.editedPreviewSerialized.trim();
    }
    return ((_b = input.gatePreviewSerialized) === null || _b === void 0 ? void 0 : _b.trim()) || null;
}
exports.resolveConfirmedPreviewSerialized = resolveConfirmedPreviewSerialized;
//# sourceMappingURL=apply-edited-preview.util.js.map