"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPageActionBuiltinShowResultTool = exports.resolvePageActionSummarizeHostTool = void 0;
const common_1 = require("@nestjs/common");
const host_tool_types_1 = require("../../modules/host-tool/host-tool.types");
const page_action_builtin_host_tool_util_1 = require("./page-action-builtin-host-tool.util");
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
async function resolvePageActionSummarizeHostTool(prisma, input) {
    if (typeof input.nodeHostToolId === 'number' &&
        Number.isInteger(input.nodeHostToolId) &&
        input.nodeHostToolId > 0) {
        const row = await loadHostToolRow(prisma, input.appClientId, input.nodeHostToolId);
        if (!row.isActive) {
            throw new common_1.BadRequestException({
                code: 'HOST_TOOL_INACTIVE',
                message: `HostTool "${row.name}" is inactive`,
            });
        }
        return {
            hostTool: (0, page_action_host_tool_util_1.resolvePageActionHostTool)(row, input.pageContext),
            builtin: false,
        };
    }
    if (input.fallbackHostTool) {
        return {
            hostTool: input.fallbackHostTool,
            builtin: false,
        };
    }
    return {
        hostTool: (0, page_action_builtin_host_tool_util_1.buildPageActionBuiltinShowResultHostTool)(),
        builtin: true,
    };
}
exports.resolvePageActionSummarizeHostTool = resolvePageActionSummarizeHostTool;
function isPageActionBuiltinShowResultTool(hostTool) {
    return hostTool.definition.name === page_action_builtin_host_tool_util_1.PAGE_ACTION_BUILTIN_SHOW_RESULT_TOOL_NAME;
}
exports.isPageActionBuiltinShowResultTool = isPageActionBuiltinShowResultTool;
//# sourceMappingURL=page-action-summarize-host-tool.util.js.map