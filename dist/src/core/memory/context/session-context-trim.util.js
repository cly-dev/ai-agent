"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimTurnsByCompressedWatermark = void 0;
function trimTurnsByCompressedWatermark(turns, compressedUpToMessageId) {
    if (compressedUpToMessageId == null) {
        return turns;
    }
    return turns.filter((turn) => turn.messageId > compressedUpToMessageId);
}
exports.trimTurnsByCompressedWatermark = trimTurnsByCompressedWatermark;
//# sourceMappingURL=session-context-trim.util.js.map