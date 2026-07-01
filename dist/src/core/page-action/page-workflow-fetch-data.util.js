"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePageWorkflowFetchData = void 0;
const common_1 = require("@nestjs/common");
const page_context_metadata_scan_util_1 = require("../host-bridge/page-context-metadata-scan.util");
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
    const tool = await resolveFetchDataTool(input.prisma, {
        appClientId: input.appClientId,
        toolId: input.nodeInput.toolId,
        definitionKey: input.nodeInput.definitionKey,
    });
    const args = buildReadToolInputFromPageContext(input.pageContext, tool.path);
    const result = await input.toolEngine.executeFromDefinition({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        schema: tool.schema,
        method: tool.method,
        path: tool.path,
        timeout: tool.timeout,
        integration: {
            id: tool.integration.id,
            name: tool.integration.name,
            baseUrl: tool.integration.baseUrl,
            authMode: tool.integration.authMode,
            apiKey: tool.integration.apiKey,
        },
        agentMetadata: tool.agentMetadata,
        responseProfile: tool.responseProfile,
    }, args, input.userId);
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