"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGE_ACTION_RUN_ADMIN_INCLUDE = exports.PAGE_ACTION_DETAIL_INCLUDE = void 0;
const host_tool_types_1 = require("../host-tool/host-tool.types");
exports.PAGE_ACTION_DETAIL_INCLUDE = {
    appClient: { select: { id: true, name: true, dsn: true } },
    hostTool: { include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE },
};
exports.PAGE_ACTION_RUN_ADMIN_INCLUDE = {
    pageAction: { select: { id: true, actionKey: true, name: true } },
    user: { select: { id: true, username: true, email: true } },
};
//# sourceMappingURL=page-action.types.js.map