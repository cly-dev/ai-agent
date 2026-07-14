"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPageActionRunStatusToLifecyclePhase = void 0;
const client_1 = require("../../../generated/prisma/client");
function mapPageActionRunStatusToLifecyclePhase(status) {
    switch (status) {
        case client_1.PageActionRunStatus.awaiting_approval:
            return 'awaiting_approval';
        case client_1.PageActionRunStatus.failed:
            return 'failed';
        case client_1.PageActionRunStatus.completed:
            return 'completed';
        default:
            return 'started';
    }
}
exports.mapPageActionRunStatusToLifecyclePhase = mapPageActionRunStatusToLifecyclePhase;
//# sourceMappingURL=page-action-run-lifecycle.util.js.map