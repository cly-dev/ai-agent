"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldRouteToRespond = void 0;
const turn_respond_util_1 = require("./turn-respond.util");
function shouldRouteToRespond(state) {
    if (state.finished) {
        return false;
    }
    return (0, turn_respond_util_1.hasPendingRespond)(state.pendingRespond);
}
exports.shouldRouteToRespond = shouldRouteToRespond;
//# sourceMappingURL=turn-graph.util.js.map