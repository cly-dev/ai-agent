"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePageWorkflowFetchData = void 0;
const common_1 = require("@nestjs/common");
const page_workflow_tool_bundle_util_1 = require("./page-workflow-tool-bundle.util");
const page_context_metadata_scan_util_1 = require("../host-bridge/page-context-metadata-scan.util");
const page_action_run_audit_util_1 = require("./page-action-run-audit.util");
function buildReadToolInputFromPageContext(pageContext, pathTemplate) {
    var _a, _b;
    const input = {};
    const entity = pageContext === null || pageContext === void 0 ? void 0 : pageContext.entity;
    if (entity && typeof entity === 'object' && !Array.isArray(entity)) {
        Object.assign(input, entity);
    }
    const entityId = (0, page_context_metadata_scan_util_1.resolvePageContextEntityId)(pageContext);
    if (entityId) {
        input.id = entityId;
    }
    const pathKeys = (_b = (_a = pathTemplate.match(/\{([^/{}]+)\}/g)) === null || _a === void 0 ? void 0 : _a.map((match) => match.slice(1, -1))) !== null && _b !== void 0 ? _b : [];
    for (const key of pathKeys) {
        if (input[key] == null && entityId) {
            input[key] = entityId;
        }
    }
    return input;
}
async function resolveFetchDataTool(prisma, input) {
    var _a;
    const include = { integration: true };
    if (input.toolId != null) {
        const tool = await prisma.tool.findFirst({
            where: {
                id: input.toolId,
                appClientId: input.appClientId,
                isActive: true,
            },
            include,
        });
        if (!tool) {
            throw new common_1.NotFoundException({
                code: 'FETCH_TOOL_NOT_FOUND',
                message: `Tool id=${input.toolId} not found for app`,
            });
        }
        return tool;
    }
    const definitionKey = (_a = input.definitionKey) === null || _a === void 0 ? void 0 : _a.trim();
    if (definitionKey) {
        const tool = await prisma.tool.findFirst({
            where: {
                definitionKey,
                appClientId: input.appClientId,
                isActive: true,
            },
            include,
        });
        if (!tool) {
            throw new common_1.NotFoundException({
                code: 'FETCH_TOOL_NOT_FOUND',
                message: `Tool definitionKey="${definitionKey}" not found for app`,
            });
        }
        return tool;
    }
    throw new common_1.BadRequestException({
        code: 'FETCH_TOOL_UNRESOLVED',
        message: 'fetch_data node requires toolId or definitionKey',
    });
}
async function executePageWorkflowFetchData(input) {
    var _a, _b, _c, _d, _e, _f;
    const tool = (_b = (input.nodeInput.toolId != null
        ? (_a = input.toolBundle) === null || _a === void 0 ? void 0 : _a.toolById.get(input.nodeInput.toolId)
        : undefined)) !== null && _b !== void 0 ? _b : (await resolveFetchDataTool(input.prisma, {
        appClientId: input.appClientId,
        toolId: input.nodeInput.toolId,
        definitionKey: input.nodeInput.definitionKey,
    }));
    const args = buildReadToolInputFromPageContext(input.pageContext, tool.path);
    const toolStepId = (_c = input.nodeId) !== null && _c !== void 0 ? _c : 'fetch_data';
    (_d = input.stepRecorder) === null || _d === void 0 ? void 0 : _d.record({
        type: 'workflow',
        name: `${toolStepId}:tool:start`,
        detail: (0, page_action_run_audit_util_1.buildToolCallRequestAudit)({
            toolName: tool.name,
            toolId: tool.id,
            arguments: args,
            httpMethod: tool.method,
            httpPath: tool.path,
        }),
    });
    const result = await input.toolEngine.executeFromDefinition((0, page_workflow_tool_bundle_util_1.toToolExecutionDefinition)(tool), args, input.userId, {
        integrationCredentialCache: (_e = input.toolBundle) === null || _e === void 0 ? void 0 : _e.toolBuildCtx.integrationCredentialCache,
    });
    (_f = input.stepRecorder) === null || _f === void 0 ? void 0 : _f.record({
        type: 'workflow',
        name: `${toolStepId}:tool:complete`,
        detail: (0, page_action_run_audit_util_1.buildToolCallResultAudit)(result),
        status: 'ok',
    });
    return {
        name: tool.name,
        output: result.output,
        args,
        toolId: tool.id,
        toolName: tool.name,
        agentMetadata: tool.agentMetadata,
    };
}
exports.executePageWorkflowFetchData = executePageWorkflowFetchData;
//# sourceMappingURL=page-workflow-fetch-data.util.js.map