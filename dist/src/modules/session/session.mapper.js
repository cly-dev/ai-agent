"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSessionResponseList = exports.toSessionResponse = void 0;
function toSessionResponse(row) {
    return row;
}
exports.toSessionResponse = toSessionResponse;
function toSessionResponseList(rows) {
    return rows.map((row) => toSessionResponse(row));
}
exports.toSessionResponseList = toSessionResponseList;
//# sourceMappingURL=session.mapper.js.map