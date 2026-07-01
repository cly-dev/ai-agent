"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOST_TOOL_DETAIL_INCLUDE = exports.HOST_PAGE_DETAIL_INCLUDE = void 0;
exports.HOST_PAGE_DETAIL_INCLUDE = {
    appClient: { select: { id: true, name: true, dsn: true } },
    _count: { select: { hostTools: true } },
};
exports.HOST_TOOL_DETAIL_INCLUDE = {
    appClient: { select: { id: true, name: true, dsn: true } },
    hostPage: { select: { id: true, scope: true, label: true } },
};
//# sourceMappingURL=host-tool.types.js.map