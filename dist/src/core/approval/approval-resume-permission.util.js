"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveApproverAllowedToolIds = void 0;
const client_1 = require("../../../generated/prisma/client");
async function resolveApproverAllowedToolIds(input) {
    if (input.source === client_1.ApprovalSource.page_action || input.source === client_1.ApprovalSource.webhook) {
        return input.triggerPermission.resolveUserAllowedToolIdsForApp({
            userId: input.approverUserId,
            appClientId: input.appClientId,
        });
    }
    return input.snapshot.scopedToolIds;
}
exports.resolveApproverAllowedToolIds = resolveApproverAllowedToolIds;
//# sourceMappingURL=approval-resume-permission.util.js.map