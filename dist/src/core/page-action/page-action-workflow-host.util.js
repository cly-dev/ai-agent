"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePageActionHostToolForPushNode = exports.resolvePageActionHostToolResolved = exports.resolvePageActionHostToolRow = void 0;
const common_1 = require("@nestjs/common");
const host_tool_types_1 = require("../../modules/host-tool/host-tool.types");
const page_action_host_tool_util_1 = require("./page-action-host-tool.util");
async function loadHostToolRow(prisma, appClientId, hostToolId) {
    const hostTool = await prisma.hostTool.findFirst({
        where: { id: hostToolId, appClientId },
        include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
    });
    if (!hostTool) {
        throw new common_1.NotFoundException({
            code: 'HOST_TOOL_NOT_FOUND',
            message: `HostTool ${hostToolId} not found for AppClient ${appClientId}`,
        });
    }
    return hostTool;
}
async function resolvePageActionHostToolRow(prisma, pageAction) {
    if (pageAction.hostTool) {
        return pageAction.hostTool;
    }
    return null;
}
exports.resolvePageActionHostToolRow = resolvePageActionHostToolRow;
async function resolvePageActionHostToolResolved(prisma, pageAction, pageContext) {
    const row = await resolvePageActionHostToolRow(prisma, pageAction);
    if (!row) {
        return null;
    }
    if (!row.isActive) {
        throw new common_1.BadRequestException({
            code: 'HOST_TOOL_INACTIVE',
            message: `Bound HostTool "${row.name}" is inactive`,
        });
    }
    return (0, page_action_host_tool_util_1.resolvePageActionHostTool)(row, pageContext);
}
exports.resolvePageActionHostToolResolved = resolvePageActionHostToolResolved;
async function resolvePageActionHostToolForPushNode(prisma, input) {
    if (typeof input.hostToolId === 'number' &&
        Number.isInteger(input.hostToolId) &&
        input.hostToolId > 0) {
        const row = await loadHostToolRow(prisma, input.appClientId, input.hostToolId);
        if (!row.isActive) {
            throw new common_1.BadRequestException({
                code: 'HOST_TOOL_INACTIVE',
                message: `HostTool "${row.name}" is inactive`,
            });
        }
        return (0, page_action_host_tool_util_1.resolvePageActionHostTool)(row, input.pageContext);
    }
    if (input.fallbackHostTool) {
        return input.fallbackHostTool;
    }
    throw new common_1.BadRequestException({
        code: 'PAGE_ACTION_PUSH_HOST_TOOL_MISSING',
        message: 'generate_and_push node requires input.hostToolId or PageAction.hostToolId',
    });
}
exports.resolvePageActionHostToolForPushNode = resolvePageActionHostToolForPushNode;
//# sourceMappingURL=page-action-workflow-host.util.js.map